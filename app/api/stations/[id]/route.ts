// @ts-nocheck

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const station = await prisma.station.findUnique({
      where: { station_id: parseInt(id) },
      include: {
        camp: {
          select: {
            camp_classroom: {
              select: {
                classroom: {
                  select: {
                    classroom_students: {
                      select: { student_students_id: true },
                    },
                  },
                },
              },
            },
          },
        },
        mission: {
          where: { deletedAt: null },
          include: {
            mission_question: {
              include: {
                choices: true,
              },
            },
            _count: {
              select: {
                mission_result: {
                  where: { status: "completed" },
                },
              },
            },
          },
        },
      },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    // A student can belong to more than one classroom linked to this camp, so
    // deduplicate by student ID.  This count is scoped to this station's camp.
    const participantIds = new Set(
      station.camp.camp_classroom.flatMap((campClassroom) =>
        campClassroom.classroom.classroom_students.map(
          (student) => student.student_students_id,
        ),
      ),
    );

    return NextResponse.json({
      ...station,
      participantCount: participantIds.size,
    });
  } catch {
    //     console.error("Error fetching station:", error);

    return NextResponse.json(
      { _error: "Failed to fetch station" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, is_required_for_cert } = body;

    if (name && name.length > 255) {
      return NextResponse.json(
        { error: "ชื่อฐานกิจกรรมต้องไม่เกิน 255 ตัวอักษร" },
        { status: 400 },
      );
    }

    if (description && description.length > 255) {
      return NextResponse.json(
        { error: "รายละเอียดต้องไม่เกิน 255 ตัวอักษร" },
        { status: 400 },
      );
    }

    const updatedStation = await prisma.station.update({
      where: { station_id: parseInt(id) },
      data: {
        name,
        description,
        ...(is_required_for_cert !== undefined && { is_required_for_cert }),
      },
    });

    return NextResponse.json(updatedStation);
  } catch (error) {
    console.error("Error updating station:", error);

    return NextResponse.json(
      {
        _error: "Failed to update station",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Soft delete the station
    await prisma.station.update({
      where: { station_id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Station deleted successfully" });
  } catch {
    //     console.error("Error deleting station:", error);

    return NextResponse.json(
      { _error: "Failed to delete station" },
      { status: 500 },
    );
  }
}
