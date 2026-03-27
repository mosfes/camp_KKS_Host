const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOldEnrollments() {
  console.log("Cleaning up old teacher 1 enrollments...");
  
  // Find all camps where teacher 1 is enrolled BUT did not create the camp
  const enrollmentsToRemove = await prisma.teacher_enrollment.findMany({
    where: {
      teacher_teachers_id: 1,
      camp: {
        created_by_teacher_id: { not: 1 } // Only remove if they didn't create it
      }
    },
    include: {
      camp: {
        include: {
          camp_classroom: {
            include: {
              classroom: {
                include: {
                  classroom_teacher: true
                }
              }
            }
          }
        }
      }
    }
  });

  let removedCount = 0;
  
  for (const enrollment of enrollmentsToRemove) {
    let isHomeroomTeacher = false;
    
    // Check if Teacher 1 is actually a homeroom teacher for any of the classrooms linked to this camp
    for (const cc of enrollment.camp.camp_classroom) {
      if (cc.classroom.teachers_teachers_id === 1) {
        isHomeroomTeacher = true;
        break;
      }
      for (const ct of cc.classroom.classroom_teacher) {
        if (ct.teacher_teachers_id === 1) {
          isHomeroomTeacher = true;
          break;
        }
      }
    }
    
    // If they are not a homeroom teacher and not the creator, this was an auto-enrollment. Delete it.
    if (!isHomeroomTeacher) {
      await prisma.teacher_enrollment.delete({
        where: { teacher_enrollment_id: enrollment.teacher_enrollment_id }
      });
      removedCount++;
    }
  }

  console.log(`Successfully removed ${removedCount} auto-enrollment records for Teacher 1.`);
}

cleanOldEnrollments()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
