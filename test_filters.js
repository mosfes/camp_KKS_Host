const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking all camps...");

    const allCamps = await prisma.camp.findMany({
        where: { deletedAt: null },
        select: {
            camp_id: true,
            name: true,
            created_by_teacher_id: true,
            teacher_enrollment: { select: { teacher_teachers_id: true } },
            camp_classroom: { 
                select: { 
                    classroom: { 
                        select: { 
                            teachers_teachers_id: true,
                            classroom_teacher: true
                        }
                    }
                } 
            }
        }
    });

    console.log(`Total camps in DB: ${allCamps.length}`);
    
    for (const c of allCamps) {
        let involvedTeachers = new Set();
        involvedTeachers.add(c.created_by_teacher_id);
        c.teacher_enrollment.forEach(t => involvedTeachers.add(t.teacher_teachers_id));
        
        c.camp_classroom.forEach(cc => {
            if (cc.classroom.teachers_teachers_id) involvedTeachers.add(cc.classroom.teachers_teachers_id);
            cc.classroom.classroom_teacher.forEach(ct => involvedTeachers.add(ct.teacher_teachers_id));
        });

        console.log(`- Camp ${c.camp_id} ("${c.name}") is visible to: ${Array.from(involvedTeachers).join(', ')}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
