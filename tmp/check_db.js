const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB check...");
    try {
        const answers = await prisma.survey_answer.findMany({
            include: {
                survey_question: true
            }
        });
        console.log(`Found ${answers.length} total survey answers.`);
        const textAnswers = answers.filter(a => a.text_answer && a.text_answer.trim() !== "");
        console.log(`Found ${textAnswers.length} non-empty text answers:`);
        textAnswers.forEach(a => {
            console.log(`- Question: "${a.survey_question.question_text}" | Answer: "${a.text_answer}"`);
        });

        const questions = await prisma.survey_question.findMany();
        console.log(`\nFound ${questions.length} total questions.`);
        questions.forEach(q => {
            console.log(`- Q ID: ${q.question_id} | Type: ${q.question_type} | Text: ${q.question_text}`);
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
