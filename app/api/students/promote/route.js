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
                teacher: true,
                classroom_teacher: {
                    include: { teacher: true }
                }
            },
            orderBy: { grade: 'asc' }
        });

        // 2. ดึงห้องเรียนปีใหม่ (เพื่อเช็คว่ามีห้องรอรับไหม)
        const targetClassrooms = await prisma.classrooms.findMany({
            where: { academic_years_years_id: parseInt(toYearId) },
            include: { teacher: true }
        });

        const groupedData = new Map();

        for (const room of sourceClassrooms) {
            const nextGrade = getNextGrade(room.grade);
            
            // ข้ามถ้าไม่มีระดับชั้นถัดไป (เช่น End of list ที่ไม่ได้ระบุ)
            if (!nextGrade) continue;

            const key = `${room.grade}_${room.type_classroom}`;
            
            if (!groupedData.has(key)) {
                // หาห้องปลายทาง (Grade ถัดไป + Type เดิม)
                const targetRoom = targetClassrooms.find(
                    tr => tr.grade === nextGrade && tr.type_classroom === room.type_classroom
                );

                // ครูปลายทาง
                // ถ้าห้องมีอยู่แล้วดึงมาโชว์ 
                // ถ้าห้องใหม่: ให้ดึงครูที่สอนระดับชั้นนั้นในปีปัจจุบันมาเป็น Default
                let defaultTeacherIds = new Set();
                
                if (targetRoom) {
                    defaultTeacherIds.add(targetRoom.teachers_teachers_id.toString());

                } else {
                    // ค้นหาห้องในปีปัจจุบัน ที่เป็นระดับชั้นถัดไป (Next Grade) + ประเภทเดิม
                    const matchingNextGradeRooms = sourceClassrooms.filter(
                        r => r.grade === nextGrade && r.type_classroom === room.type_classroom
                    );
                    
                    if (matchingNextGradeRooms.length > 0) {
                        for (const nextRoom of matchingNextGradeRooms) {
                             // Primary Teacher
                            if (nextRoom.teacher) {
                                defaultTeacherIds.add(nextRoom.teacher.teachers_id.toString());
                            }
                            // Secondary Teachers
                            if (nextRoom.classroom_teacher && nextRoom.classroom_teacher.length > 0) {
                                nextRoom.classroom_teacher.forEach(ct => {
                                    if (ct.teacher) {
                                        defaultTeacherIds.add(ct.teacher.teachers_id.toString());
                                    }
                                });
                            }
                        }
                    }
                }

                groupedData.set(key, {
                    sourceRoomId: room.classroom_id, 
                    sourceGrade: room.grade,
                    sourceType: room.type_classroom,
                    sourceTeacher: [], 
                    
                    // ข้อมูลปลายทาง (Target)
                    targetGrade: nextGrade,
                    targetType: room.type_classroom,
                    targetRoomId: targetRoom ? targetRoom.classroom_id : null,
                    isNewRoom: !targetRoom,
                    
                    targetTeacherIds: Array.from(defaultTeacherIds), // ส่งกลับเป็น Array
                    
                    // รายชื่อนักเรียน (ใช้ Map เพื่อกันซ้ำ Based on ID)
                    students: new Map()
                });
            }

            const group = groupedData.get(key);

            // Merge Teachers (Primary)
            if (room.teacher) {
                const name = `${room.teacher.firstname} ${room.teacher.lastname}`;
                if (!group.sourceTeacher.includes(name)) {
                    group.sourceTeacher.push(name);
                }
            }

            // Merge Teachers (Secondary from classroom_teacher)
            if (room.classroom_teacher && room.classroom_teacher.length > 0) {
                for (const ct of room.classroom_teacher) {
                    if (ct.teacher) {
                         const name = `${ct.teacher.firstname} ${ct.teacher.lastname}`;
                         if (!group.sourceTeacher.includes(name)) {
                            group.sourceTeacher.push(name);
                        }
                    }
                }
            }

            // Merge Students
            if (room.classroom_students) {
                for (const rs of room.classroom_students) {
                     if (rs.student) {
                        group.students.set(rs.student.students_id, {
                            id: rs.student.students_id,
                            code: rs.student.students_id.toString(), 
                            firstname: rs.student.firstname,
                            lastname: rs.student.lastname,
                            name: `${rs.student.firstname} ${rs.student.lastname}`,
                            selected: true
                        });
                     }
                }
            }
        }

        // Convert Map back to Array
        const previewData = [];
        for (const group of groupedData.values()) {
            previewData.push({
                ...group,
                sourceTeacher: group.sourceTeacher.join(", "), // แปลง Array ชื่อครูเป็น String คั่นด้วย comma
                students: Array.from(group.students.values()) // แปลง Map นักเรียนกลับเป็น Array
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

                // กรณีจบการศึกษา (Graduated) -> ไม่ต้องสร้างห้องใหม่ ไม่ต้องย้ายเด็ก (แค่ไม่ลงทะเบียนในปีการศึกษาหน้า)
                if (item.targetGrade === 'Graduated') {
                    movedStudents += selectedStudents.length;
                    continue;
                }

                let targetRoomId = item.targetRoomId;
                const teacherIds = item.targetTeacherIds || [];
                
                if (item.isNewRoom && teacherIds.length === 0) {
                     throw new Error(`กรุณาเลือกครูประจำชั้นสำหรับห้อง ${item.targetGrade} (${item.targetType})`);
                }

                const primaryTeacherId = teacherIds.length > 0 ? parseInt(teacherIds[0]) : null;
                const secondaryTeacherIds = teacherIds.slice(1).map(id => parseInt(id));

                // 1. ถ้าห้องปลายทางยังไม่มี (isNewRoom) หรือ User สั่งสร้าง ให้สร้างห้องใหม่
                if (!targetRoomId) {
                    const newRoom = await tx.classrooms.create({
                        data: {
                            grade: item.targetGrade,
                            type_classroom: item.targetType,
                            academic_years_years_id: parseInt(toYearId),
                            teachers_teachers_id: primaryTeacherId
                        }
                    });
                    targetRoomId = newRoom.classroom_id;
                    createdRooms++;

                    // Add Secondary Teachers
                    if (secondaryTeacherIds.length > 0) {
                        await tx.classroom_teacher.createMany({
                            data: secondaryTeacherIds.map(tid => ({
                                classroom_classroom_id: targetRoomId,
                                teacher_teachers_id: tid
                            }))
                        });
                    }

                } else {
                    // ถ้าห้องมีอยู่แล้ว แต่อยากอัปเดตครู (Option)
                    if (primaryTeacherId) {
                        await tx.classrooms.update({
                            where: { classroom_id: targetRoomId },
                            data: { teachers_teachers_id: primaryTeacherId }
                        });

                        // Update Secondary Teachers (Reset & Re-add)
                        await tx.classroom_teacher.deleteMany({
                            where: { classroom_classroom_id: targetRoomId }
                        });

                        if (secondaryTeacherIds.length > 0) {
                            await tx.classroom_teacher.createMany({
                                data: secondaryTeacherIds.map(tid => ({
                                    classroom_classroom_id: targetRoomId,
                                    teacher_teachers_id: tid
                                }))
                            });
                        }
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