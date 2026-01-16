import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ฟังก์ชันแปลง Level_1 -> Level_2
const getNextGrade = (currentGrade) => {
    const map = {
        'Level_1': 'Level_2',
        'Level_2': 'Level_3',
        'Level_3': 'Level_4',
        'Level_4': 'Level_5',
        'Level_5': 'Level_6',
        'Level_6': 'Graduated' // จบการศึกษา
    };
    return map[currentGrade] || null;
};

// GET: ดึงข้อมูลเพื่อ Preview การเลื่อนชั้น
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromYearId = searchParams.get('fromYearId');
        const toYearId = searchParams.get('toYearId');

        if (!fromYearId || !toYearId) {
            return NextResponse.json({ error: 'กรุณาระบุปีการศึกษา' }, { status: 400 });
        }

        // 1. ดึงห้องเรียนปีเก่า
        const sourceClassrooms = await prisma.classrooms.findMany({
            where: { academic_years_years_id: parseInt(fromYearId) },
            include: {
                classroom_students: {
                    include: { student: true }
                },
                teacher: true
            },
            orderBy: { grade: 'asc' }
        });

        // 2. ดึงห้องเรียนปีใหม่ (เพื่อเช็คว่ามีห้องรอรับไหม)
        const targetClassrooms = await prisma.classrooms.findMany({
            where: { academic_years_years_id: parseInt(toYearId) },
            include: { teacher: true }
        });

        const previewData = [];

        for (const room of sourceClassrooms) {
            const nextGrade = getNextGrade(room.grade);
            
            // ข้าม ม.6 (จบการศึกษา)
            if (nextGrade === 'Graduated' || !nextGrade) continue;

            // หาห้องปลายทาง (Grade ถัดไป + Type เดิม)
            const targetRoom = targetClassrooms.find(
                tr => tr.grade === nextGrade && tr.type_classroom === room.type_classroom
            );

            previewData.push({
                sourceRoomId: room.classroom_id,
                sourceGrade: room.grade,
                sourceType: room.type_classroom,
                sourceTeacher: `${room.teacher?.firstname} ${room.teacher?.lastname}`,
                
                // ข้อมูลปลายทาง (Target)
                targetGrade: nextGrade,
                targetType: room.type_classroom, // ห้องโครงการเดิม
                targetRoomId: targetRoom ? targetRoom.classroom_id : null, // ถ้ามี ID แปลว่าห้องมีอยู่แล้ว
                isNewRoom: !targetRoom, // ถ้าไม่มี ต้องสร้างใหม่
                
                // ครูปลายทาง (ถ้าห้องมีอยู่แล้วดึงมาโชว์ ถ้าห้องใหม่ = null ให้ User เลือก)
                targetTeacherId: targetRoom ? targetRoom.teachers_teachers_id.toString() : "", 
                
                // รายชื่อนักเรียนที่จะย้าย
                students: room.classroom_students.map(rs => ({
                    id: rs.student.students_id,
                    code: rs.student.students_id.toString(), 
                    firstname: rs.student.firstname,
                    lastname: rs.student.lastname,
                    name: `${rs.student.firstname} ${rs.student.lastname}`,
                    selected: true // ค่าเริ่มต้นคือเลือกทุกคน
                }))
            });
        }

        return NextResponse.json(previewData);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to preview' }, { status: 500 });
    }
}

// POST: บันทึกข้อมูลจริง (สร้างห้อง + ย้ายเด็ก)
export async function POST(req) {
    try {
        const body = await req.json();
        const { toYearId, plan } = body; // plan คือ array ของ previewData ที่ User แก้ไขแล้ว

        if (!toYearId || !plan || !Array.isArray(plan)) {
            return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
        }

        let createdRooms = 0;
        let movedStudents = 0;

        await prisma.$transaction(async (tx) => {
            for (const item of plan) {
                // ข้ามถ้าไม่มีนักเรียนถูกเลือกเลย
                const selectedStudents = item.students.filter(s => s.selected);
                if (selectedStudents.length === 0) continue;

                let targetRoomId = item.targetRoomId;

                // 1. ถ้าห้องปลายทางยังไม่มี (isNewRoom) หรือ User สั่งสร้าง ให้สร้างห้องใหม่
                if (!targetRoomId) {
                    // ถ้า User ไม่เลือกครู ให้ใส่ครู Default (เช่น Admin หรือ Dummy) หรือข้ามไปก่อน
                    // ในที่นี้บังคับว่าต้องมี teacher_id ตาม Schema, ถ้าว่างอาจต้อง Handle Error หรือใส่ครูเดิม
                    // สมมติ: ถ้า User ไม่เลือกครู ยอมให้พัง หรือต้อง Validate จาก Frontend มาแล้ว
                    
                    if (!item.targetTeacherId) {
                         throw new Error(`กรุณาเลือกครูประจำชั้นสำหรับห้อง ${item.targetGrade} (${item.targetType})`);
                    }

                    const newRoom = await tx.classrooms.create({
                        data: {
                            grade: item.targetGrade,
                            type_classroom: item.targetType,
                            academic_years_years_id: parseInt(toYearId),
                            teachers_teachers_id: parseInt(item.targetTeacherId)
                        }
                    });
                    targetRoomId = newRoom.classroom_id;
                    createdRooms++;
                } else {
                    // ถ้าห้องมีอยู่แล้ว แต่อยากอัปเดตครู (Option)
                    if (item.targetTeacherId) {
                        await tx.classrooms.update({
                            where: { classroom_id: targetRoomId },
                            data: { teachers_teachers_id: parseInt(item.targetTeacherId) }
                        });
                    }
                }

                // 2. ย้ายนักเรียน (สร้าง record ใน classroom_students ใหม่)
                for (const student of selectedStudents) {
                    // เช็คว่าเด็กคนนี้มีในห้องปลายทางปีนี้หรือยัง (กันเหนียว)
                    const exists = await tx.classroom_students.findFirst({
                        where: {
                            student_students_id: student.id,
                            classroom_classroom_id: targetRoomId
                        }
                    });

                    if (!exists) {
                        await tx.classroom_students.create({
                            data: {
                                student_students_id: student.id,
                                classroom_classroom_id: targetRoomId
                            }
                        });
                        movedStudents++;
                    }
                }
            }
        });

        return NextResponse.json({ 
            message: `สำเร็จ! สร้างห้องใหม่ ${createdRooms} ห้อง และย้ายนักเรียน ${movedStudents} คน` 
        });

    } catch (error) {
        console.error("Promote Error:", error);
        return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการบันทึก' }, { status: 500 });
    }
}