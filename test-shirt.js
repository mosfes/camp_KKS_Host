const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const campId = 480001; // The ID mentioned by user
//   const campId = 390001; // user also mentioned 390001
  
  try {
    const adminCamp = await prisma.camp.findUnique({
      where: { camp_id: campId },
      include: { camp_classroom: true }
    });

    console.log("adminCamp?", !!adminCamp);

    const enrollments = await prisma.student_enrollment.findMany({
      where: {
        camp_camp_id: campId,
      },
      include: {
        student: {
          include: {
            classroom_students: {
              include: {
                classroom: {
                  include: {
                    classroom_types: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: "asc", 
      },
    });

    console.log("Enrollments found:", enrollments.length);
    console.log("enrollment[0] student:", !!enrollments[0]?.student);
    
    // Process test
    const campClassroomIds = adminCamp.camp_classroom.map((cc) => cc.classroom_id);
    for (const enr of enrollments) {
        let classroomStr = "-";
        const matchedCs = enr.student.classroom_students.find((cs) => 
          campClassroomIds.includes(cs.classroom_classroom_id)
        );
        if (matchedCs && matchedCs.classroom) {
          const gradeStr = String(matchedCs.classroom.grade).replace("Level_", "");
          const typeStr = matchedCs.classroom.classroom_types?.name || "";
          classroomStr = `ม.${gradeStr} ห้อง ${typeStr}`.trim();
        }
    }
    console.log("Success!");
  } catch(e) {
    console.error("FAIL:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
