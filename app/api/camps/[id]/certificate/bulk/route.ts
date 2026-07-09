import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

let cachedFontBytes: Buffer | null = null;
function getFontBytes(): Buffer {
  if (!cachedFontBytes) {
    const fontPath = path.join(process.cwd(), "public/fonts/THSarabunNew.ttf");
    cachedFontBytes = fs.readFileSync(fontPath);
  }
  return cachedFontBytes;
}

function toThaiNumerals(str: string): string {
  const thaiDigits = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
  return str.replace(/[0-9]/g, (d) => thaiDigits[parseInt(d)]);
}

function buildCertNumberText(
  prefix: string,
  certNo: number,
  isThai: boolean,
  certYear?: string | null,
): string {
  const padded = String(certNo).padStart(4, "0");
  let text = prefix ? `${prefix} ${padded}` : padded;

  if (certYear) {
    text = `${text}/${certYear}`;
  }

  return isThai ? toThaiNumerals(text) : text;
}

export async function GET(request: Request, context: any) {
  const { teacher, error } = await requireTeacher();
  if (error) return error;

  const params = await context.params;
  const campId = Number(params.id);
  const { searchParams } = new URL(request.url);
  const condition = searchParams.get("condition") || "all"; // all | all_students | passed_conditions

  if (isNaN(campId)) {
    return NextResponse.json({ error: "Invalid camp id" }, { status: 400 });
  }

  try {
    const camp = await prisma.camp.findUnique({
      where: { camp_id: campId, deletedAt: null },
      include: {
        survey: true,
        station: {
          where: { deletedAt: null },
          include: {
            mission: true,
          }
        }
      },
    });

    if (!camp) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }

    if (camp.created_by_teacher_id !== teacher.teachers_id && teacher.role !== "ADMIN") {
       return NextResponse.json({ error: "ไม่มีสิทธิ์ดาวน์โหลดเกียรติบัตรแบบรวมสำหรับค่ายนี้" }, { status: 403 });
    }

    if (!camp.img_certificate_url) {
      return NextResponse.json(
        { error: "ค่ายนี้ยังไม่ได้ตั้งค่ารูปภาพเกียรติบัตร" },
        { status: 404 },
      );
    }

    if (condition === "all_students") {
      // นักเรียนที่อยู่ในห้องที่ผูกกับค่ายอาจยังไม่มี enrollment record
      // สร้าง record แบบยังไม่ลงทะเบียนไว้ เพื่อให้ certificate อ้างอิงได้
      const eligibleStudents = await prisma.classroom_students.findMany({
        where: {
          classroom: {
            camp_classroom: {
              some: { camp_camp_id: campId },
            },
          },
        },
        select: { student_students_id: true },
        distinct: ["student_students_id"],
      });

      if (eligibleStudents.length > 0) {
        await prisma.student_enrollment.createMany({
          data: eligibleStudents.map((student) => ({
            student_students_id: student.student_students_id,
            camp_camp_id: campId,
            enrolled_at: null,
          })),
          skipDuplicates: true,
        });
      }
    }

    let enrollments = await prisma.student_enrollment.findMany({
      where: {
        camp_camp_id: campId,
      },
      include: {
        student: true,
        survey_response: { take: 1 },
        certificate: {
          select: { certificate_no: true },
          take: 1,
        },
        mission_result: {
          where: { status: "completed" },
          select: { mission_mission_id: true }
        }
      },
      orderBy: {
        student: {
          students_id: "asc", 
        }
      }
    });

    // "all" และ "passed_conditions" หมายถึงเฉพาะผู้ที่กดลงทะเบียนแล้ว
    // ส่วน "all_students" รวมผู้ที่ถูกเพิ่มเข้าค่ายไว้ล่วงหน้า (enrolled_at = null)
    if (condition !== "all_students") {
      enrollments = enrollments.filter((e) => e.enrolled_at != null);
    }

    if (condition === "passed_conditions") {
      const isSurveyRequired = camp.survey && camp.survey.length > 0 && camp.survey[0].is_required_for_cert;
      
      const hasPostTest = camp.station?.some((s) =>
        s.mission?.some((m) => m.type === "POST_TEST"),
      );
      
      const requiredStations = camp.station?.filter((s) => s.is_required_for_cert) || [];

      enrollments = enrollments.filter((e) => {
        // 1. Survey Check
        if (isSurveyRequired && e.survey_response.length === 0) {
          return false;
        }

        const completedMissionIds = new Set(e.mission_result.map((r) => r.mission_mission_id));

        // 2. Post-Test Check
        if (hasPostTest) {
          const isPostTestCompleted = camp.station?.some((s) =>
            s.mission?.some((m) => m.type === "POST_TEST" && completedMissionIds.has(m.mission_id))
          );
          if (!isPostTestCompleted) return false;
        }

        // 3. Required Stations Check
        const areRequiredStationsCompleted = requiredStations.every((station) => {
          const stationMissions = station.mission || [];
          if (stationMissions.length === 0) return true;
          
          const completedMissions = stationMissions.filter((m) => completedMissionIds.has(m.mission_id));
          return completedMissions.length === stationMissions.length;
        });

        if (!areRequiredStationsCompleted) return false;

        return true;
      });
    }

    if (enrollments.length === 0) {
      const message =
        condition === "all_students"
          ? "ค่ายนี้ยังไม่มีนักเรียน กรุณาเพิ่มนักเรียนเข้าห้องหรือค่ายก่อนสร้างเกียรติบัตร"
          : condition === "passed_conditions"
            ? "ยังไม่มีนักเรียนที่ผ่านเงื่อนไขการรับเกียรติบัตร"
            : "ยังไม่มีนักเรียนที่ลงทะเบียนในค่ายนี้";

      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (camp.cert_show_number && camp.cert_number_start != null) {
      const studentsWithoutCert = enrollments.filter(e => e.certificate.length === 0);

      if (studentsWithoutCert.length > 0) {
        const MAX_RETRIES = 5;
        let lastError: any;
        let success = false;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            await prisma.$transaction(async (tx) => {
              await tx.$executeRaw`SET @@tidb_txn_mode = 'pessimistic'`;
              await tx.$queryRaw`SELECT camp_id FROM camp WHERE camp_id = ${campId} FOR UPDATE`;

              const usedCertificates: any[] = await tx.$queryRaw`
                  SELECT c.certificate_no
                  FROM certificate c
                  INNER JOIN student_enrollment se
                    ON c.student_enrollment_id = se.student_enrollment_id
                  WHERE se.camp_camp_id = ${campId}
                    AND c.certificate_no >= ${camp.cert_number_start}`;

              const usedSet = new Set(
                usedCertificates
                  .map((r) => r.certificate_no)
                  .filter((n) => n != null)
                  .map(Number)
              );

              let newNo = camp.cert_number_start!;

              for (const student of studentsWithoutCert) {
                while (usedSet.has(newNo)) {
                  newNo++;
                }

                await tx.certificate.create({
                  data: {
                    certificate_no: newNo,
                    certificate_no_star: newNo,
                    file_url: "",
                    student_enrollment_id: student.student_enrollment_id,
                  },
                });

                student.certificate = [{ certificate_no: newNo }];
                usedSet.add(newNo);
                newNo++;
              }
            }, { isolationLevel: "ReadCommitted" });

            success = true;
            break; 
          } catch (txError: any) {
            lastError = txError;
            const errMsg = String(txError?.message ?? "");
            
            if (
              errMsg.includes("Write conflict") ||
              errMsg.includes("9007") ||
              errMsg.includes("Deadlock") ||
              errMsg.includes("Unique constraint") ||
              errMsg.includes("P2002")
            ) {
              await new Promise((r) => setTimeout(r, 50 + attempt * 100));
              continue;
            }
            throw txError;
          }
        }

        if (!success && lastError) {
          console.error("Bulk certificate assignment failed after retries:", lastError);
          return NextResponse.json({ error: "เกิดข้อผิดพลาดในการรันเลขที่เกียรติบัตร กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
        }
      }
    }

    const imageRes = await fetch(camp.img_certificate_url);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Failed to load certificate template image." },
        { status: 500 },
      );
    }
    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get("content-type") || "";

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    let embeddedImage;
    if (
      contentType.includes("png") ||
      camp.img_certificate_url.toLowerCase().endsWith(".png")
    ) {
      embeddedImage = await pdfDoc.embedPng(imageBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBuffer);
    }

    const { width, height } = embeddedImage.scale(1);

    let fontBytes;
    try {
      fontBytes = getFontBytes();
    } catch (e) {
      return NextResponse.json(
        { error: "Font file not found on server." },
        { status: 500 },
      );
    }
    const customFont = await pdfDoc.embedFont(fontBytes);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
          }
        : { r: 0, g: 0, b: 0 };
    };

    const fontSize = camp.cert_font_size || 48;
    const xPercent = camp.cert_name_x ?? 50;
    const yPercent = camp.cert_name_y ?? 50;
    const fontColorRgb = hexToRgb(camp.cert_font_color || "#000000");

    const numFontSize = camp.cert_number_size || 36;
    const numXPercent = camp.cert_number_x ?? 50;
    const numYPercent = camp.cert_number_y ?? 10;
    const numColorRgb = hexToRgb(camp.cert_number_color || "#000000");
    const showNumber = camp.cert_show_number;

    for (const enrollment of enrollments) {
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      const prefix = enrollment.student.prefix_name?.trim() || "";
      const fullName = `${prefix}${enrollment.student.firstname.trim()} ${enrollment.student.lastname.trim()}`;

      const textWidth = customFont.widthOfTextAtSize(fullName, fontSize);
      const x = (xPercent / 100) * width - textWidth / 2;
      const y = (1 - yPercent / 100) * height - fontSize / 3;

      page.drawText(fullName, {
        x: x,
        y: y,
        size: fontSize,
        font: customFont,
        color: rgb(fontColorRgb.r, fontColorRgb.g, fontColorRgb.b),
      });

      if (showNumber && enrollment.certificate.length > 0) {
        const assignedCertNo = enrollment.certificate[0].certificate_no;
        if (assignedCertNo != null) {
            const numberText = buildCertNumberText(
              camp.cert_number_prefix || "",
              assignedCertNo,
              camp.cert_number_is_thai ?? false,
              camp.cert_year,
            );
            
            const numTextWidth = customFont.widthOfTextAtSize(numberText, numFontSize);
            const numX = (numXPercent / 100) * width - numTextWidth / 2;
            const numY = (1 - numYPercent / 100) * height - numFontSize / 3;
            
            page.drawText(numberText, {
              x: numX,
              y: numY,
              size: numFontSize,
              font: customFont,
              color: rgb(numColorRgb.r, numColorRgb.g, numColorRgb.b),
            });
        }
      }
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bulk_certificates_camp_${campId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating bulk certificates:", error);
    return NextResponse.json(
      { error: "Failed to generate certificates." },
      { status: 500 },
    );
  }
}
