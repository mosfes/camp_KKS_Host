
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STUDENT_ID = 1;

// POST: Register for a camp
export async function POST(req) {
    try {
        const body = await req.json();
        const { campId } = body;

        if (!campId) {
            return NextResponse.json({ error: "Camp ID is required" }, { status: 400 });
        }

        // Check if already enrolled
        const existing = await prisma.student_enrollment.findFirst({
            where: {
                student_students_id: STUDENT_ID,
                camp_camp_id: campId
            }
        });

        if (existing) {
            return NextResponse.json({ message: "Already enrolled" }, { status: 200 });
        }

        // Register
        const enrollment = await prisma.student_enrollment.create({
            data: {
                student_students_id: STUDENT_ID,
                camp_camp_id: campId,
                shirt_size: "M", // Default size, can be updated later
                enrolled_at: new Date()
            }
        });

        return NextResponse.json(enrollment, { status: 201 });

    } catch (error) {
        console.error("Enrollment Error:", error);
        return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
    }
}

// PUT: Update shirt size
export async function PUT(req) {
    try {
        const body = await req.json();
        const { campId, shirtSize } = body;

        if (!campId || !shirtSize) {
            return NextResponse.json({ error: "Camp ID and Shirt Size required" }, { status: 400 });
        }

        // Find enrollment
        const enrollment = await prisma.student_enrollment.findFirst({
            where: {
                student_students_id: STUDENT_ID,
                camp_camp_id: campId
            }
        });

        if (!enrollment) {
            return NextResponse.json({ error: "Not enrolled in this camp" }, { status: 404 });
        }

        // Update
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
