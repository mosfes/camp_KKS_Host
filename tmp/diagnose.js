const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log("--- System Diagnosis ---");
  
  // 1. Check Camps
  const camps = await prisma.camp.findMany({
    where: { deletedAt: null },
    select: { camp_id: true, name: true }
  });
  console.log("Camps:", camps);

  for (const camp of camps) {
    console.log(`\nCamp ID: ${camp.camp_id} (${camp.name})`);
    
    // 2. Check Surveys
    const surveys = await prisma.survey.findMany({
      where: { camp_camp_id: camp.camp_id },
      include: {
        survey_question: {
          include: {
            survey_answer: true
          }
        }
      }
    });
    
    console.log(`  Surveys found: ${surveys.length}`);
    surveys.forEach(s => {
      console.log(`    Survey: ${s.title}`);
      s.survey_question.forEach(q => {
        const textAnswers = q.survey_answer.filter(a => a.text_answer).map(a => a.text_answer);
        console.log(`      Question [${q.question_type}]: "${q.question_text}" | Text Answers: ${textAnswers.length}`);
        if (textAnswers.length > 0) console.log(`        Sample: ${textAnswers[0]}`);
      });
    });

    // 3. Check Evaluations (Another potential system)
    const evaluations = await prisma.evaluation.findMany({
      where: { camp_camp_id: camp.camp_id },
      include: {
        evaluation_answer: {
          include: {
            evaluation_question: true
          }
        }
      }
    });

    console.log(`  Evaluations found: ${evaluations.length}`);
    evaluations.forEach(e => {
        e.evaluation_answer.forEach(a => {
            if (a.text_answer) {
                console.log(`      Eval Question: "${a.evaluation_question.question_text}" | Text Answer: "${a.text_answer}"`);
            }
        });
    });
  }
}

diagnose()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
