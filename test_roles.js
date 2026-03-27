const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking all Teacher Accounts...");

    const teachers = await prisma.teachers.findMany({
        select: {
            teachers_id: true,
            firstname: true,
            lastname: true,
            role: true
        }
    });

    console.table(teachers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
