// @ts-nocheck
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
        if (existing) {
            // Pre-created record (enrolled_at = null) → นักเรียนกดเข้าร่วมครั้งแรก
            if (!existing.enrolled_at) {
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
        if (error.code === 'P2002') {
            return NextResponse.json({ message: "Already enrolled" }, { status: 200 });
        }
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

        // ตรวจสอบว่าอยู่ในช่วงเวลาจองเสื้อหรือไม่
        const camp = await prisma.camp.findUnique({
            where: { camp_id: campId },
            select: { has_shirt: true, start_shirt_date: true, end_shirt_date: true }
        });

        if (!camp) {
            return NextResponse.json({ error: "Camp not found" }, { status: 404 });
        }

        if (!camp.has_shirt) {
            return NextResponse.json({ error: "ค่ายนี้ไม่ได้เปิดจองเสื้อ" }, { status: 400 });
        }

        const now = new Date();
        // เปรียบเทียบวันปัจจุบัน (วันเท่านั้น ไม่รวมเวลา) กับช่วงจองเสื้อ
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (camp.start_shirt_date) {
            const shirtStart = new Date(camp.start_shirt_date);
            const shirtStartDay = new Date(shirtStart.getFullYear(), shirtStart.getMonth(), shirtStart.getDate());
            if (todayStart < shirtStartDay) {
                return NextResponse.json({ error: "ยังไม่ถึงช่วงเวลาจองเสื้อ" }, { status: 400 });
            }
        }

        if (camp.end_shirt_date) {
            const shirtEnd = new Date(camp.end_shirt_date);
            const shirtEndDay = new Date(shirtEnd.getFullYear(), shirtEnd.getMonth(), shirtEnd.getDate());
            if (todayStart > shirtEndDay) {
                return NextResponse.json({ error: "หมดช่วงเวลาจองเสื้อแล้ว ไม่สามารถจองย้อนหลังได้" }, { status: 400 });
            }
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
