import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  const { teacher, error } = await requireTeacher();
  if (error) return error;

  try {
    const { campId } = await request.json();

    if (!campId) {
      return NextResponse.json({ error: 'campId is required' }, { status: 400 });
    }

    const cId = parseInt(campId);

    // Verify ownership
    const camp = await prisma.camp.findUnique({
      where: { camp_id: cId, deletedAt: null },
      select: { created_by_teacher_id: true },
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    if (camp.created_by_teacher_id !== teacher.teachers_id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch survey and texts
    const survey = await prisma.survey.findUnique({
      where: { camp_camp_id: cId },
      include: {
        survey_question: {
          include: {
            survey_answer: true,
          },
        },
      },
    });

    if (!survey || !survey.survey_question.length) {
      return NextResponse.json({
        overview: "ไม่มีข้อมูลคำถามแบบประเมินสำหรับค่ายนี้",
        strengths: [],
        improvements: []
      });
    }

    // Extract all text answers regardless of question type
    let allTexts = [];
    survey.survey_question.forEach(q => {
      q.survey_answer.forEach(a => {
        if (a.text_answer && String(a.text_answer).trim() !== '') {
          allTexts.push(String(a.text_answer).trim());
        }
      });
    });

    console.log(`AI Summary: Found ${allTexts.length} text entries for campId ${cId}`);
    if (allTexts.length === 0) {
      return NextResponse.json({
        overview: "ไม่มีข้อเสนอแนะแบบข้อความจากผู้เข้าร่วมค่าย จึงไม่สามารถสรุปผลด้วย AI ได้ (ลองเช็คว่านักเรียนได้พิมพ์ข้อความมาจริงๆ หรือยังครับ)",
        strengths: [],
        improvements: []
      });
    }

    // Call Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'ระบบไม่ได้ตั้งค่า GEMINI_API_KEY ไม่สามารถใช้งาน AI ได้' }, { status: 500 });
    }

    const promptText = `
คุณคือผู้ช่วย AI สำหรับสรุปผลการประเมินค่ายการศึกษา
กรุณาอ่านข้อเสนอแนะและคำวิจารณ์จากนักเรียนต่อไปนี้ แล้วสรุปผลออกมาเป็น 3 หัวข้อ:
1. ภาพรวม (Overview): สรุปประเด็นหลักสั้นๆ เข้าใจง่าย
2. สิ่งที่ดี (Strengths): รายการสิ่งที่มีคนชมหรือเห็นว่าเป็นข้อดี
3. สิ่งที่ควรปรับปรุง (Improvements): รายการสิ่งที่ควรนำไปปรับปรุงแก้ไข

ให้ตอบกลับมาเป็นรูปแบบ JSON เท่านั้น โดยมีโครงสร้างดังนี้:
{
  "overview": "ข้อความสรุปภาพรวม",
  "strengths": ["ข้อ 1", "ข้อ 2", ...],
  "improvements": ["ข้อ 1", "ข้อ 2", ...]
}

ห้ามใส่ markdown syntax (\`\`\`json หรือ \`\`\`) ครอบมาเด็ดขาด ให้ปรินต์ออกมาแค่ JSON ชัวร์ๆ
ถ้าข้อเสนอแนะมีน้อยหรือไม่ชัดเจน ให้สรุปเท่าที่ทำได้

ข้อเสนอแนะที่ได้มามีดังนี้:
${allTexts.map(t => `- ${t}`).join('\n')}
    `.trim();

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2, // Low temperature for more deterministic/factual summarization
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini fetch failed:', geminiResponse.status);
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการติดต่อกับ AI Service' }, { status: 502 });
    }

    const geminiData = await geminiResponse.json();
    const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Gemini Raw Response:', textResponse);
    
    // Parse JSON
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse Gemini response as JSON:', textResponse);
      return NextResponse.json({ error: 'AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง' }, { status: 500 });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON Parse error on Gemini output:', jsonMatch[0]);
      return NextResponse.json({ error: 'AI ตอบกลับในรูปแบบ JSON ที่ไม่ถูกต้อง' }, { status: 500 });
    }

    // Validation
    const safetyCheck = {
      overview: parsedResult.overview || "ไม่มีข้อมูลภาพรวม",
      strengths: Array.isArray(parsedResult.strengths) ? parsedResult.strengths : [],
      improvements: Array.isArray(parsedResult.improvements) ? parsedResult.improvements : []
    };

    return NextResponse.json(safetyCheck);
  } catch (err) {
    console.error('Error generating AI summary:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดที่ไม่คาดคิดในการสรุปผล' }, { status: 500 });
  }
}
