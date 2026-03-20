const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.survey.findMany({ include: { survey_question: { include: { survey_answer: true } } } }).then(data => console.log(JSON.stringify(data, null, 2))).finally(() => prisma.$disconnect());
