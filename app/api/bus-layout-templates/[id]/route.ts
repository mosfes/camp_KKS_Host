import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  busLayoutTemplateSchema,
  formatBusLayoutTemplate,
} from "@/lib/freeform-bus-layout";

async function requireAdminTemplate(id: string) {
  const { teacher, error } = await requireTeacher();

  if (error) return { error };
  if (teacher.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "คุณไม่มีสิทธิ์จัดการเทมเพลตผังรถ" },
        { status: 403 },
      ),
    };
  }

  const templateId = Number(id);

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return {
      error: NextResponse.json(
        { error: "รหัสเทมเพลตไม่ถูกต้อง" },
        { status: 400 },
      ),
    };
  }

  return { teacher, templateId, error: null };
}

function floorCreateData(floor: any) {
  return {
    floor_number: floor.floorNumber,
    floor_name: floor.floorName,
    canvas_columns: floor.canvasColumns,
    canvas_rows: floor.canvasRows,
    elements: {
      create: floor.elements.map((element: any) => ({
        type: element.type,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        label: element.label,
        is_assignable: element.type === "SEAT" ? element.isAssignable : false,
        z_index: element.zIndex,
        metadata: element.metadata || undefined,
      })),
    },
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireAdminTemplate(id);

  if (access.error) return access.error;

  const template = await prisma.bus_layout_template.findUnique({
    where: { template_id: access.templateId },
    include: {
      floors: {
        orderBy: { floor_number: "asc" },
        include: {
          elements: { orderBy: [{ z_index: "asc" }, { element_id: "asc" }] },
        },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "ไม่พบเทมเพลตผังรถ" }, { status: 404 });
  }

  return NextResponse.json(formatBusLayoutTemplate(template));
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireAdminTemplate(id);

  if (access.error) return access.error;

  const parsed = busLayoutTemplateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "ข้อมูลผังไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const existing = await prisma.bus_layout_template.findUnique({
    where: { template_id: access.templateId },
    select: { template_id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "ไม่พบเทมเพลตผังรถ" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.bus_layout_template_floor.deleteMany({
      where: { template_id: access.templateId },
    });
    await tx.bus_layout_template.update({
      where: { template_id: access.templateId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
        floors: {
          create: parsed.data.floors.map(floorCreateData),
        },
      },
    });
  });

  const template = await prisma.bus_layout_template.findUnique({
    where: { template_id: access.templateId },
    include: {
      floors: {
        orderBy: { floor_number: "asc" },
        include: { elements: { orderBy: { element_id: "asc" } } },
      },
    },
  });

  return NextResponse.json({
    ...formatBusLayoutTemplate(template),
    message: "บันทึกเทมเพลตผังรถเรียบร้อยแล้ว",
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireAdminTemplate(id);

  if (access.error) return access.error;

  const body = await request.json().catch(() => ({}));

  if (body.action !== "duplicate") {
    return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
  }

  const source = await prisma.bus_layout_template.findUnique({
    where: { template_id: access.templateId },
    include: {
      floors: {
        orderBy: { floor_number: "asc" },
        include: { elements: { orderBy: { element_id: "asc" } } },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: "ไม่พบเทมเพลตผังรถ" }, { status: 404 });
  }

  const duplicate = await prisma.bus_layout_template.create({
    data: {
      name: `${source.name} (สำเนา)`,
      description: source.description,
      status: "DRAFT",
      created_by_teacher_id: Number(access.teacher?.teachers_id),
      floors: {
        create: source.floors.map((floor) =>
          floorCreateData({
            floorNumber: floor.floor_number,
            floorName: floor.floor_name,
            canvasColumns: floor.canvas_columns,
            canvasRows: floor.canvas_rows,
            elements: floor.elements.map((element) => ({
              type: element.type,
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              rotation: element.rotation,
              label: element.label,
              isAssignable: element.is_assignable,
              zIndex: element.z_index,
              metadata: element.metadata,
            })),
          }),
        ),
      },
    },
    include: {
      floors: {
        orderBy: { floor_number: "asc" },
        include: { elements: { orderBy: { element_id: "asc" } } },
      },
    },
  });

  return NextResponse.json(formatBusLayoutTemplate(duplicate), { status: 201 });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireAdminTemplate(id);

  if (access.error) return access.error;

  const result = await prisma.bus_layout_template.updateMany({
    where: { template_id: access.templateId },
    data: { status: "ARCHIVED" },
  });

  if (!result.count) {
    return NextResponse.json({ error: "ไม่พบเทมเพลตผังรถ" }, { status: 404 });
  }

  return NextResponse.json({ message: "เก็บเทมเพลตเข้าคลังแล้ว" });
}
