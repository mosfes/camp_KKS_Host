import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  busLayoutTemplateSchema,
  formatBusLayoutTemplate,
} from "@/lib/freeform-bus-layout";

function nestedFloors(floors: any[]) {
  return floors.map((floor) => ({
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
  }));
}

export async function GET(request: Request) {
  const { teacher, error } = await requireTeacher();

  if (error) return error;

  const includeAll =
    teacher.role === "ADMIN" &&
    new URL(request.url).searchParams.get("includeAll") === "true";
  const includeDraft =
    new URL(request.url).searchParams.get("includeDraft") === "true";
  const templates = await prisma.bus_layout_template.findMany({
    where: includeAll
      ? undefined
      : includeDraft
        ? { status: { in: ["DRAFT", "PUBLISHED"] } }
        : { status: "PUBLISHED" },
    include: {
      floors: {
        orderBy: { floor_number: "asc" },
        include: {
          elements: { orderBy: [{ z_index: "asc" }, { element_id: "asc" }] },
        },
      },
    },
    orderBy: [{ status: "asc" }, { updated_at: "desc" }],
  });

  return NextResponse.json({
    templates: templates.map(formatBusLayoutTemplate),
  });
}

export async function POST(request: Request) {
  const { teacher, error } = await requireTeacher();

  if (error) return error;
  if (teacher.role !== "ADMIN") {
    return NextResponse.json(
      { error: "คุณไม่มีสิทธิ์สร้างเทมเพลตผังรถ" },
      { status: 403 },
    );
  }

  const parsed = busLayoutTemplateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "ข้อมูลผังไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const template = await prisma.bus_layout_template.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      created_by_teacher_id: Number(teacher.teachers_id),
      floors: { create: nestedFloors(parsed.data.floors) },
    },
    include: {
      floors: {
        orderBy: { floor_number: "asc" },
        include: { elements: { orderBy: { element_id: "asc" } } },
      },
    },
  });

  return NextResponse.json(formatBusLayoutTemplate(template), { status: 201 });
}
