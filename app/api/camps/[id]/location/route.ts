import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCampLocationAccess,
  getCampLocationViewer,
} from "@/lib/camp-location-auth";
import { prisma } from "@/lib/db";

const coordinateSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

const settingsSchema = z.object({
  destination: coordinateSchema
    .extend({
      name: z.string().trim().min(1).max(255),
      address: z.string().trim().max(500).optional().nullable(),
    })
    .nullable()
    .optional(),
  sharingEnabled: z.boolean().optional(),
  updateIntervalMinutes: z.union([z.literal(5), z.literal(10)]).optional(),
});

const updateSchema = coordinateSchema.extend({
  accuracy: z.number().finite().min(0).max(100000).optional().nullable(),
});

async function authorize(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const campId = Number(id);

  if (!Number.isInteger(campId) || campId <= 0) {
    return {
      error: NextResponse.json(
        { error: "รหัสค่ายไม่ถูกต้อง" },
        { status: 400 },
      ),
    };
  }

  const viewer = await getCampLocationViewer();

  if (!viewer) {
    return {
      error: NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 },
      ),
    };
  }

  const access = await getCampLocationAccess(campId, viewer);

  if (!access.exists) {
    return {
      error: NextResponse.json({ error: "ไม่พบค่าย" }, { status: 404 }),
    };
  }

  if (!access.canView) {
    return {
      error: NextResponse.json(
        { error: "ไม่มีสิทธิ์ดูตำแหน่งค่ายนี้" },
        { status: 403 },
      ),
    };
  }

  return { campId, viewer, access };
}

function studentName(student: {
  prefix_name: string | null;
  firstname: string;
  lastname: string;
}) {
  return `${student.prefix_name ?? ""}${student.firstname} ${student.lastname}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(context);

  if (auth.error) return auth.error;

  const { campId, viewer, access } = auth;
  const camp = await prisma.camp.findUnique({
    where: { camp_id: campId },
    select: {
      destination_name: true,
      destination_address: true,
      destination_latitude: true,
      destination_longitude: true,
      location_sharing_enabled: true,
      location_update_interval: true,
    },
  });

  if (!camp) {
    return NextResponse.json({ error: "ไม่พบค่าย" }, { status: 404 });
  }

  let students: Array<{
    studentId: number;
    name: string;
    latest: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
      recorded_at: Date;
    } | null;
  }> = [];
  let viewerPath: Array<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    recorded_at: Date;
  }> = [];

  if (viewer.kind === "teacher") {
    const enrollments = await prisma.student_enrollment.findMany({
      where: { camp_camp_id: campId, enrolled_at: { not: null } },
      orderBy: { student_students_id: "asc" },
      select: {
        student: {
          select: {
            students_id: true,
            prefix_name: true,
            firstname: true,
            lastname: true,
            student_location_update: {
              where: { camp_camp_id: campId },
              orderBy: { recorded_at: "desc" },
              take: 1,
              select: {
                latitude: true,
                longitude: true,
                accuracy: true,
                recorded_at: true,
              },
            },
          },
        },
      },
    });

    students = enrollments.map(({ student }) => ({
      studentId: student.students_id,
      name: studentName(student),
      latest: camp.location_sharing_enabled
        ? (student.student_location_update[0] ?? null)
        : null,
    }));
  } else {
    const student = await prisma.students.findUnique({
      where: { students_id: viewer.studentId },
      select: {
        students_id: true,
        prefix_name: true,
        firstname: true,
        lastname: true,
      },
    });

    if (student) {
      if (camp.location_sharing_enabled) {
        viewerPath = await prisma.student_location_update.findMany({
          where: {
            camp_camp_id: campId,
            student_students_id: viewer.studentId,
          },
          orderBy: { recorded_at: "desc" },
          take: 500,
          select: {
            latitude: true,
            longitude: true,
            accuracy: true,
            recorded_at: true,
          },
        });
        viewerPath.reverse();
      }

      students = [
        {
          studentId: student.students_id,
          name: studentName(student),
          latest: viewerPath.at(-1) ?? null,
        },
      ];
    }
  }

  return NextResponse.json(
    {
      destination:
        camp.destination_latitude != null &&
        camp.destination_longitude != null &&
        camp.destination_name
          ? {
              name: camp.destination_name,
              address: camp.destination_address,
              latitude: camp.destination_latitude,
              longitude: camp.destination_longitude,
            }
          : null,
      sharingEnabled: camp.location_sharing_enabled,
      updateIntervalMinutes: [5, 10].includes(camp.location_update_interval)
        ? camp.location_update_interval
        : 10,
      students,
      viewerPath,
      permissions: {
        canConfigure: access.canConfigure,
        canSubmitStudentLocation: access.canSubmitStudentLocation,
      },
      trackingLabel:
        viewer.kind === "teacher"
          ? "ตำแหน่งล่าสุดของนักเรียนที่ลงทะเบียน"
          : viewer.kind === "parent"
            ? "ตำแหน่งล่าสุดของบุตรหลาน"
            : "ตำแหน่งของฉันที่ผู้ปกครองและครูมองเห็น",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(context);

  if (auth.error) return auth.error;
  if (!auth.access.canConfigure) {
    return NextResponse.json(
      { error: "เฉพาะผู้สร้างค่ายหรือผู้ดูแลระบบเท่านั้นที่ตั้งค่าจุดหมายได้" },
      { status: 403 },
    );
  }

  try {
    const body = settingsSchema.parse(await request.json());
    const existing = await prisma.camp.findUnique({
      where: { camp_id: auth.campId },
      select: { destination_latitude: true, destination_longitude: true },
    });
    const willHaveDestination =
      body.destination !== null &&
      (body.destination !== undefined ||
        (existing?.destination_latitude != null &&
          existing.destination_longitude != null));

    if (body.sharingEnabled === true && !willHaveDestination) {
      return NextResponse.json(
        { error: "กรุณาปักหมุดจุดหมายก่อนเปิดแชร์ตำแหน่ง" },
        { status: 400 },
      );
    }

    const destinationData =
      body.destination === undefined
        ? {}
        : body.destination === null
          ? {
              destination_name: null,
              destination_address: null,
              destination_latitude: null,
              destination_longitude: null,
              location_sharing_enabled: false,
            }
          : {
              destination_name: body.destination.name,
              destination_address: body.destination.address || null,
              destination_latitude: body.destination.latitude,
              destination_longitude: body.destination.longitude,
            };

    await prisma.camp.update({
      where: { camp_id: auth.campId },
      data: {
        ...destinationData,
        ...(body.sharingEnabled !== undefined && {
          location_sharing_enabled: body.sharingEnabled,
        }),
        ...(body.updateIntervalMinutes !== undefined && {
          location_update_interval: body.updateIntervalMinutes,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "ข้อมูลตำแหน่งไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "บันทึกการตั้งค่าไม่สำเร็จ" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(context);

  if (auth.error) return auth.error;
  if (auth.viewer.kind !== "student" || !auth.access.canSubmitStudentLocation) {
    return NextResponse.json(
      { error: "เฉพาะนักเรียนที่ลงทะเบียนค่ายเท่านั้นที่ส่งตำแหน่งได้" },
      { status: 403 },
    );
  }

  try {
    const body = updateSchema.parse(await request.json());
    const camp = await prisma.camp.findUnique({
      where: { camp_id: auth.campId },
      select: { location_sharing_enabled: true },
    });

    if (!camp?.location_sharing_enabled) {
      return NextResponse.json(
        { error: "ครูยังไม่ได้เปิดการติดตามตำแหน่ง" },
        { status: 409 },
      );
    }

    const update = await prisma.student_location_update.create({
      data: {
        camp_camp_id: auth.campId,
        student_students_id: auth.viewer.studentId,
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: body.accuracy ?? null,
      },
      select: {
        latitude: true,
        longitude: true,
        accuracy: true,
        recorded_at: true,
      },
    });

    return NextResponse.json({ success: true, update }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "พิกัด GPS ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "ส่งตำแหน่งไม่สำเร็จ" }, { status: 500 });
  }
}
