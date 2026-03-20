import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';

// GET /api/student/surveys?campId=<id> — ดึงแบบสอบถามเพื่อให้นักเรียนทำ (และเช็คว่าทำไปแล้วหรือยัง)
export async function GET(request) {
  const { student, error } = await requireStudent();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json({ error: 'campId is required' }, { status: 400 });
    }

    // หาแบบสอบถามของค่ายนี้
    const survey = await prisma.survey.findUnique({
      where: { camp_camp_id: parseInt(campId) },
      include: {
        survey_question: { orderBy: { question_id: 'asc' } },
      },
    });

    if (!survey) {
      return NextResponse.json({ survey: null, isCompleted: false });
    }

    // หา enrollment ของนักเรียนค่ายนี้
    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: student.students_id,
        camp_camp_id: parseInt(campId),
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this camp' }, { status: 403 });
    }

    // เช็คว่าทำแบบสอบถามไปแล้วหรือยัง
    const response = await prisma.survey_response.findUnique({
      where: {
        survey_survey_id_student_enrollment_id: {
          survey_survey_id: survey.survey_id,
          student_enrollment_id: enrollment.student_enrollment_id,
        },
      },
    });

    return NextResponse.json({
      survey,
      isCompleted: !!response,
    });
  } catch (error) {
    console.error('Error fetching student survey:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST /api/student/surveys — ส่งคำตอบแบบสอบถาม
export async function POST(request) {
  const { student, error } = await requireStudent();
  if (error) return error;

  try {
    const body = await request.json();
    const { surveyId, answers, campId } = body; 

    if (surveyId === undefined || answers === undefined || campId === undefined) {
      console.log('Rejecting 400: Missing fields', { surveyId, campId, hasAnswers: !!answers });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(answers)) {
      console.log('Rejecting 400: answers is not an array', typeof answers);
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    const sId = parseInt(surveyId);
    const cId = parseInt(campId);

    if (isNaN(sId) || isNaN(cId)) {
      console.log('Rejecting 400: Invalid IDs', { sId, cId });
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: student.students_id,
        camp_camp_id: cId,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    // --- Vulgar Word Filter ---
    const textAnswers = answers
      .filter((ans) => ans.textAnswer && String(ans.textAnswer).trim() !== '')
      .map((ans) => String(ans.textAnswer).trim());

    if (textAnswers.length > 0) {
      const dbVulgarWords = await prisma.vulgar_words.findMany();
      const vulgarList = dbVulgarWords
        .map((v) => v.word.toLowerCase())
        .filter((w) => w !== 'หมา'); // อนุโลมคำว่า หมา

      let foundVulgarInDb = null;
      for (const text of textAnswers) {
        const lowerText = text.toLowerCase();
        for (const word of vulgarList) {
          if (word && lowerText.includes(word)) {
            foundVulgarInDb = word;
            break;
          }
        }
        if (foundVulgarInDb) break;
      }

      if (foundVulgarInDb) {
        console.log('Rejecting 400 (DB):', foundVulgarInDb);
        return NextResponse.json(
          { error: `กรุณางดใช้คำหยาบคาย: ${foundVulgarInDb}`, success: false },
          { status: 400 }
        );
      }

      if (process.env.GEMINI_API_KEY) {
        const combinedText = textAnswers.join(' | ');
        const prompt = `ตรวจคำตอบเหล่านี้ว่ามีคำหยาบคาย คำด่า หรือคำที่ไม่เหมาะสม (ภาษาไทยหรืออังกฤษ) หรือไม่
รวมถึงการระบุคำที่ใช้คำแสลง, คำที่จงใจเขียนเลี่ยง (เช่น ใช้ "I" แทน "ไอ้" หรือเขียนสลับตัวอักษร) 

ตอบกลับเป็น JSON ในรูปแบบ {"isVulgar": boolean, "detectedWords": string[]} 
(ข้อควรระวัง: คำว่า "หมา" อนุโลมให้ใช้ได้ ไม่ต้องนับเป็นคำหยาบ) 

ข้อความที่ต้องการตรวจ: "${combinedText}"`;

        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              let result = JSON.parse(jsonMatch[0]);
              
              // กรองคำว่า หมา ออกจากผลลัพธ์ AI อีกคร้ังเพื่อความชัวร์
              if (result.detectedWords) {
                result.detectedWords = result.detectedWords.filter((w) => w !== 'หมา');
                if (result.detectedWords.length === 0) result.isVulgar = false;
              }

              if (result.isVulgar && result.detectedWords && result.detectedWords.length > 0) {
                console.log('Rejecting 400 (Gemini):', result.detectedWords);
                // ... logic to add to DB ...
                for (const word of result.detectedWords) {
                  const existing = await prisma.vulgar_words.findFirst({ where: { word } });
                  if (!existing) await prisma.vulgar_words.create({ data: { word, is_ai: true } });
                }
                return NextResponse.json(
                  { error: `กรุณางดใช้คำหยาบคาย: ${result.detectedWords.join(', ')}`, success: false },
                  { status: 400 }
                );
              }
            } else {
              console.log('Gemini JSON match failed');
            }
          } else {
            console.log('Gemini fetch not OK', geminiResponse.status);
          }
        } catch (err) {
          console.error('Gemini processing error:', err);
        }
      }
    }
    // --- End Vulgar Word Filter ---

    // สร้าง response และ answers ให้ครบใน Transaction
    const result = await prisma.$transaction(async (tx) => {
      const response = await tx.survey_response.create({
        data: {
          survey_survey_id: parseInt(surveyId),
          student_enrollment_id: enrollment.student_enrollment_id,
          survey_answer: {
            create: answers.map((ans) => ({
              question_id: parseInt(ans.questionId),
              text_answer: ans.textAnswer || null,
              scale_value: ans.scaleValue || null,
            })),
          },
        },
      });
      return response;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error submitting survey:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'คุณทำแบบสอบถามนี้ไปแล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
