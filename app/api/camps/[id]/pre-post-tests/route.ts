// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id: campId } = await params;

    // Fetch all stations in the camp with PRE_TEST and POST_TEST missions
    const stations = await prisma.station.findMany({
      where: {
        camp_camp_id: parseInt(campId),
        deletedAt: null,
      },
      include: {
        mission: {
          where: {
            type: { in: ["PRE_TEST", "POST_TEST"] },
          },
          include: {
            mission_question: {
              include: {
                choices: true,
              },
            },
            mission_result: {
              include: {
                student_enrollment: {
                  include: {
                    student: true,
                  },
                },
                mission_answer: {
                  include: {
                    answer_mcq: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const pairs = [];

    for (const station of stations) {
      const preTests = station.mission.filter((m) => m.type === "PRE_TEST");
      const postTests = station.mission.filter((m) => m.type === "POST_TEST");

      // Try to match them. If there's at least 1 of each
      if (preTests.length > 0 && postTests.length > 0) {
        // For simplicity, just take the first one if there are multiple
        const preTest = preTests[0];
        const postTest = postTests[0];

        const preTestTotal = preTest.mission_question.length;
        const postTestTotal = postTest.mission_question.length;

        // Collect all students who are enrolled in the camp
        const enrollments = await prisma.student_enrollment.findMany({
          where: {
            camp_camp_id: parseInt(campId),
            enrolled_at: { not: null },
          },
          include: {
            student: true,
          },
        });

        const studentScores = enrollments.map((enroll) => {
          // Find pre-test result
          const preResult = preTest.mission_result.find(
            (r) =>
              r.student_enrollment_id === enroll.student_enrollment_id &&
              r.status === "completed",
          );
          let preScore = null;

          if (preResult) {
            preScore = 0;
            for (const ans of preResult.mission_answer) {
              // find if correct
              const mq = preTest.mission_question.find(
                (q) => q.question_id === ans.mission_question_question_id,
              );

              if (mq) {
                const chosenLetter = ans.answer_mcq?.[0]?.question_text;

                if (chosenLetter) {
                  const charCode = chosenLetter.charCodeAt(0) - 65;
                  const choices = mq.choices || [];

                  if (charCode >= 0 && charCode < choices.length) {
                    if (choices[charCode].is_correct) preScore++;
                  } else {
                    const matchedChoice = choices.find(
                      (c) => c.choice_text === chosenLetter,
                    );

                    if (matchedChoice && matchedChoice.is_correct) preScore++;
                  }
                }
              }
            }
          }

          // Find post-test result
          const postResult = postTest.mission_result.find(
            (r) =>
              r.student_enrollment_id === enroll.student_enrollment_id &&
              r.status === "completed",
          );
          let postScore = null;

          if (postResult) {
            postScore = 0;
            for (const ans of postResult.mission_answer) {
              // find if correct
              const mq = postTest.mission_question.find(
                (q) => q.question_id === ans.mission_question_question_id,
              );

              if (mq) {
                const chosenLetter = ans.answer_mcq?.[0]?.question_text;

                if (chosenLetter) {
                  const charCode = chosenLetter.charCodeAt(0) - 65;
                  const choices = mq.choices || [];

                  if (charCode >= 0 && charCode < choices.length) {
                    if (choices[charCode].is_correct) postScore++;
                  } else {
                    const matchedChoice = choices.find(
                      (c) => c.choice_text === chosenLetter,
                    );

                    if (matchedChoice && matchedChoice.is_correct) postScore++;
                  }
                }
              }
            }
          }

          return {
            studentId: enroll.student.students_id,
            studentName: `${enroll.student.prefix_name || ""}${enroll.student.firstname} ${enroll.student.lastname}`,
            preScore,
            postScore,
            diff:
              preScore !== null && postScore !== null
                ? postScore - preScore
                : null,
          };
        });

        pairs.push({
          stationName: station.name,
          preTest: { title: preTest.title, total: preTestTotal },
          postTest: { title: postTest.title, total: postTestTotal },
          studentScores: studentScores,
        });
      }
    }

    return NextResponse.json({ pairs });
  } catch (error) {
    console.error("Error fetching pre-post tests:", error);

    return NextResponse.json(
      { error: "Failed to fetch pre-post tests" },
      { status: 500 },
    );
  }
}
