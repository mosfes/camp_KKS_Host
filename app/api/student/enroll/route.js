import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

// POST: ลงทะเบียนเข้าร่วมค่าย
export async function POST(req) {
    const { student, error: authError } = await requireStudent();
    if (authError) return authError;

    try {
        const body = await req.json();
        const campId = Number(body.campId);
        const studentId = Number(student.students_id);

        console.log("Enroll Request:", { studentId, campId });

        if (!campId) {
            return NextResponse.json({ error: "Camp ID is required" }, { status: 400 });
        }

        // ตรวจสอบว่าลงทะเบียนแล้วหรือยัง
        const existing = await prisma.student_enrollment.findFirst({
            where: {
                student_students_id: studentId,
                camp_camp_id: campId
            }
        });

        console.log("Existing Enrollment:", existing);

        if (existing) {
            // Pre-created record (enrolled_at = null) → นักเรียนกดเข้าร่วมครั้งแรก
            if (!existing.enrolled_at) {
                console.log("Updating existing record...");
                const enrollment = await prisma.student_enrollment.update({
                    where: { student_enrollment_id: existing.student_enrollment_id },
                    data: {
                        enrolled_at: new Date(), // ใช้ Date ปกติ (UTC)
                    }
                });
                return NextResponse.json(enrollment, { status: 200 });
            }
            return NextResponse.json({ message: "Already enrolled" }, { status: 200 });
        }

        // ไม่มี record → สร้างใหม่
        console.log("Creating new record...");
        const enrollment = await prisma.student_enrollment.create({
            data: {
                student: { connect: { students_id: studentId } },
                camp: { connect: { camp_id: campId } },
                enrolled_at: new Date(),
                shirt_size: null,
            }
        });

        return NextResponse.json(enrollment, { status: 201 });

    } catch (error) {
        console.error("Enrollment Error:", error);
        return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
    }
}

// PUT: อัปเดตขนาดเสื้อ
export async function PUT(req) {
    const { student, error: authError } = await requireStudent();
    if (authError) return authError;

    try {
        const body = await req.json();
        const { campId, shirtSize } = body;

        if (!campId || !shirtSize) {
            return NextResponse.json({ error: "Camp ID and Shirt Size required" }, { status: 400 });
        }

        const enrollment = await prisma.student_enrollment.findFirst({
            where: {
                student_students_id: student.students_id,
                camp_camp_id: campId
            }
        });

        if (!enrollment) {
            return NextResponse.json({ error: "Not enrolled in this camp" }, { status: 404 });
        }

        const updated = await prisma.student_enrollment.update({
            where: { student_enrollment_id: enrollment.student_enrollment_id },
            data: { shirt_size: shirtSize }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("Update Shirt Error:", error);
        return NextResponse.json({ error: "Failed to update shirt size" }, { status: 500 });
    }
}
