
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET - ดึงข้อมูลเต็มของ template (เฉพาะตัวที่เลือก)
 */
export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const templateId = parseInt(resolvedParams.id);

        console.log("Fetching template ID:", templateId);

        const template = await prisma.camp_template.findUnique({
            where: {
                camp_template_id: templateId
            },
            include: {
                camp: {
                    select: {
                        camp_id: true,
                        name: true,
                        location: true,
                        description: true,
                        has_shirt: true,
                        camp_classroom: {
                            select: {
                                classroom_classroom_id: true,
                                classroom: {
                                    select: {
                                        classroom_id: true,
                                        grade: true,
                                        type_classroom: true,
                                        teacher: {
                                            select: {
                                                firstname: true,
                                                lastname: true,
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        camp_daily_schedule: {
                            select: {
                                day: true,
                                time_slots: {
                                    select: {
                                        startTime: true,
                                        endTime: true,
                                        activity: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!template) {
            console.log("Template not found");
            return NextResponse.json(
                { error: "ไม่พบ Template" },
                { status: 404 }
            );
        }

        console.log("Template found:", template);
        return NextResponse.json(template);
    } catch (error) {
        console.error("Error fetching template:", error);
        return NextResponse.json(
            {
                error: "ไม่สามารถดึงข้อมูล Template ได้",
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE - ลบ Template
 */
export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;
        const templateId = parseInt(resolvedParams.id);

        await prisma.camp_template.delete({
            where: {
                camp_template_id: templateId
            }
        });

        return NextResponse.json({ message: "ลบ Template สำเร็จ" });
    } catch (error) {
        console.error("Error deleting template:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบ Template ได้", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT - แก้ไขชื่อ Template
 */
export async function PUT(request, { params }) {
    try {
        const resolvedParams = await params;
        const templateId = parseInt(resolvedParams.id);
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: "กรุณาระบุชื่อ Template" },
                { status: 400 }
            );
        }

        const updatedTemplate = await prisma.camp_template.update({
            where: {
                camp_template_id: templateId
            },
            data: {
                name: name
            }
        });

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        console.error("Error updating template:", error);
        return NextResponse.json(
            { error: "ไม่สามารถแก้ไข Template ได้", details: error.message },
            { status: 500 }
        );
    }
}