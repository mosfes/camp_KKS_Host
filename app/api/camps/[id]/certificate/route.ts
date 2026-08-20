import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { ImageResponse } from "next/og";
import React from "react";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getCertificateEligibility } from "@/lib/certificate-eligibility";

// Cache Font ไว้ใน Memory เพื่อไม่ต้องอ่านไฟล์ใหม่ทุกครั้งที่กดโหลด
let cachedFontBytes: Buffer | null = null;
function getFontBytes(): Buffer {
  if (!cachedFontBytes) {
    const fontPath = path.join(process.cwd(), "public/fonts/THSarabunNew.ttf");
    cachedFontBytes = fs.readFileSync(fontPath);
  }
  return cachedFontBytes;
}

// Cache Template Image ไว้ใน Memory โดยใช้ URL เป็น key
// - URL เดิม → ใช้ buffer เดิมทันที ไม่ fetch Cloudinary ซ้ำ
// - Admin อัปโหลดใหม่ → URL เปลี่ยน → cache miss → fetch ใหม่อัตโนมัติ
const templateCache = new Map<
  string,
  { buffer: ArrayBuffer; contentType: string }
>();

async function fetchTemplate(
  url: string,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const cached = templateCache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);

  const entry = {
    buffer: await res.arrayBuffer(),
    contentType: res.headers.get("content-type") || "",
  };
  templateCache.set(url, entry);
  return entry;
}

// In-memory rate limiter to prevent rapid spam requests
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// แปลงเลขอาราบิกเป็นเลขไทย
function toThaiNumerals(str: string): string {
  const thaiDigits = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

  return str.replace(/[0-9]/g, (d) => thaiDigits[parseInt(d)]);
}

// สร้างข้อความเลขที่จากคำนำหน้าและปีการศึกษาที่กำหนด
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
  const { student, error } = await requireStudent();

  if (error) return error;

  const params = await context.params;
  const campId = Number(params.id);
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "pdf";
  const isDownload = searchParams.get("download") === "true";
  const disposition = isDownload ? "attachment" : "inline";

  if (isNaN(campId)) {
    return NextResponse.json({ error: "Invalid camp id" }, { status: 400 });
  }

  // Check Rate Limit
  const rateLimitKey = `cert_${student.students_id}_${campId}`;
  const now = Date.now();
  const limitRecord = rateLimitMap.get(rateLimitKey);

  if (limitRecord) {
    if (now - limitRecord.lastReset > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.set(rateLimitKey, { count: 1, lastReset: now });
    } else {
      if (limitRecord.count >= MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json(
          {
            error:
              "ระบบจำกัดการดาวน์โหลดที่ 5 ครั้งต่อนาที กรุณารอสักครู่ก่อนดาวน์โหลดใหม่",
          },
          { status: 429 },
        );
      }
      limitRecord.count += 1;
    }
  } else {
    rateLimitMap.set(rateLimitKey, { count: 1, lastReset: now });
  }

  try {
    const enrollment = await prisma.student_enrollment.findUnique({
      where: {
        student_students_id_camp_camp_id: {
          student_students_id: Number(student.students_id),
          camp_camp_id: campId,
        },
      },
      include: {
        camp: {
          include: {
            station: {
              where: { deletedAt: null },
              select: {
                mission: {
                  where: { deletedAt: null },
                  select: { mission_id: true },
                },
              },
            },
          },
        },
        student: true,
        survey_response: {
          take: 1,
        },
        certificate: {
          select: { certificate_no: true },
          take: 1,
        },
        mission_result: {
          where: { status: "completed" },
          select: { mission_mission_id: true },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student not enrolled in this camp" },
        { status: 403 },
      );
    }

    const camp = enrollment.camp;

    if (!camp.img_certificate_url) {
      return NextResponse.json(
        { error: "This camp does not have a certificate template." },
        { status: 404 },
      );
    }

    const missionIds = new Set(
      camp.station.flatMap((station) =>
        station.mission.map((mission) => mission.mission_id),
      ),
    );
    const eligibility = getCertificateEligibility({
      totalMissions: missionIds.size,
      completedMissionIds: enrollment.mission_result
        .map((result) => result.mission_mission_id)
        .filter((missionId) => missionIds.has(missionId)),
      missionPercent: camp.cert_mission_completion_percent,
      requireSurvey: camp.cert_require_survey,
      hasSurveyResponse: enrollment.survey_response.length > 0,
      hasIssuedCertificate: enrollment.certificate.length > 0,
    });

    if (!eligibility.eligible) {
      const error = !eligibility.missionRequirementMet
        ? `กรุณาทำภารกิจให้ครบอย่างน้อย ${eligibility.requiredMissions} จาก ${missionIds.size} ภารกิจก่อนดาวน์โหลดเกียรติบัตร`
        : "กรุณาทำแบบประเมินให้เสร็จสิ้นก่อนดาวน์โหลดเกียรติบัตร";

      return NextResponse.json({ error }, { status: 403 });
    }

    // ---- ระบบเลขที่เกียรติบัตรแบบรัน ----
    let assignedCertNo: number | null = null;
    let isOverflow = false;
    let overflowAmount = 0;

    if (camp.cert_show_number && camp.cert_number_start != null) {
      if (enrollment.certificate[0]?.certificate_no != null) {
        // นักเรียนเคยได้รับเลขที่แล้ว ใช้เลขเดิม
        assignedCertNo = enrollment.certificate[0].certificate_no;
      } else {
        // ออกเลขใหม่ด้วย Pessimistic Transaction (รองรับ TiDB Serverless)
        // ใช้ retry loop สำหรับ write conflict บน TiDB OCC
        const MAX_RETRIES = 5;
        let lastError: any;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            // ตรวจสอบก่อนว่า record ถูก insert ไปแล้วหรือยัง (จาก retry รอบก่อน)
            const existing = await prisma.certificate.findUnique({
              where: {
                student_enrollment_id: enrollment.student_enrollment_id,
              },
              select: { certificate_no: true },
            });
            if (existing?.certificate_no != null) {
              assignedCertNo = existing.certificate_no;
              break;
            }

            assignedCertNo = await prisma.$transaction(
              async (tx) => {
                // เปิด Pessimistic mode บน TiDB เพื่อให้ FOR UPDATE block จริงๆ
                // (TiDB default คือ Optimistic ซึ่ง FOR UPDATE ไม่ block)
                await tx.$executeRaw`SET @@tidb_txn_mode = 'pessimistic'`;

                // ล็อก camp row — เป็น existing row ที่ TiDB lock ได้ทันที
                await tx.$queryRaw`
                  SELECT camp_id FROM camp
                  WHERE camp_id = ${campId}
                  FOR UPDATE`;

                // หา certificate_no ทั้งหมดในค่ายนี้ เฉพาะตั้งแต่ cert_number_start เป็นต้นไป
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
                    .map(Number),
                );

                let newNo = camp.cert_number_start!;
                while (usedSet.has(newNo)) {
                  newNo++;
                }

                // บันทึกเลขที่ใหม่ — unique constraint คือ safety net สุดท้าย
                await tx.certificate.upsert({
                  where: {
                    student_enrollment_id: enrollment.student_enrollment_id,
                  },
                  update: {
                    certificate_no: newNo,
                    certificate_no_star: newNo,
                  },
                  create: {
                    certificate_no: newNo,
                    certificate_no_star: newNo,
                    file_url: "",
                    student_enrollment_id: enrollment.student_enrollment_id,
                  },
                });

                return newNo;
              },
              { isolationLevel: "ReadCommitted" },
            );
            break; // สำเร็จ ออกจาก loop
          } catch (txError: any) {
            lastError = txError;
            const errMsg = String(txError?.message ?? "");

            // กรณี unique constraint ชน (enrollment_id ซ้ำ) — นักเรียนคนนี้มีเลขแล้ว
            if (
              errMsg.includes("Unique constraint") ||
              errMsg.includes("unique") ||
              errMsg.includes("P2002")
            ) {
              const existingCert = await prisma.certificate.findUnique({
                where: {
                  student_enrollment_id: enrollment.student_enrollment_id,
                },
                select: { certificate_no: true },
              });
              if (existingCert?.certificate_no != null) {
                assignedCertNo = existingCert.certificate_no;
                lastError = null;
                break;
              }
            }

            // กรณี TiDB write conflict (OCC retry) — รอสักครู่แล้วลองใหม่
            if (
              errMsg.includes("Write conflict") ||
              errMsg.includes("9007") ||
              errMsg.includes("Deadlock")
            ) {
              await new Promise((r) => setTimeout(r, 20 + attempt * 30));
              continue;
            }

            // Error อื่นๆ ให้ throw ออกไปเลย
            throw txError;
          }
        }

        if (assignedCertNo == null && lastError) {
          throw lastError;
        }

        // ตรวจสอบว่าเกินช่วงที่กำหนดไหม
        if (
          camp.cert_number_end != null &&
          assignedCertNo! > camp.cert_number_end
        ) {
          isOverflow = true;
          overflowAmount = assignedCertNo! - camp.cert_number_end;
        }
      }
    }

    // Fetch the image (ใช้ cache — URL เดิมไม่ fetch Cloudinary ซ้ำ)
    const { buffer: imageBuffer, contentType } = await fetchTemplate(
      camp.img_certificate_url,
    );

    // คำนวณ hash สั้นจาก URL สำหรับใช้เป็น browser cache-buster
    const templateHash = Buffer.from(camp.img_certificate_url)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 10);

    const prefix = enrollment.student.prefix_name?.trim() || "";
    const fullName = `${prefix}${enrollment.student.firstname.trim()} ${enrollment.student.lastname.trim()}`;
    const fontSize = camp.cert_font_size || 48;
    const xPercent = camp.cert_name_x ?? 50;
    const yPercent = camp.cert_name_y ?? 50;
    const fontColorHex = camp.cert_font_color || "#000000";

    // ข้อมูลเลขที่
    const showNumber = camp.cert_show_number && assignedCertNo != null;
    const numberText = showNumber
      ? buildCertNumberText(
          camp.cert_number_prefix || "",
          assignedCertNo!,
          camp.cert_number_is_thai,
          camp.cert_year,
        )
      : null;
    const numFontSize = camp.cert_number_size || 36;
    const numXPercent = camp.cert_number_x ?? 50;
    const numYPercent = camp.cert_number_y ?? 10;
    const numColorHex = camp.cert_number_color || "#000000";

    if (format === "png") {
      // First, get the image dimensions by parsing the image via pdf-lib
      const tempPdfDoc = await PDFDocument.create();
      let embeddedImage;

      if (
        contentType.includes("png") ||
        camp.img_certificate_url.toLowerCase().endsWith(".png")
      ) {
        embeddedImage = await tempPdfDoc.embedPng(imageBuffer);
      } else {
        embeddedImage = await tempPdfDoc.embedJpg(imageBuffer);
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

      // Convert image buffer to base64 for reliable rendering in ImageResponse
      const base64Image = `data:${contentType || "image/jpeg"};base64,${Buffer.from(imageBuffer).toString("base64")}`;

      const imageResponse = new ImageResponse(
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              width: "100%",
              height: "100%",
              position: "relative",
            },
          },
          React.createElement("img", {
            src: base64Image,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            },
          }),
          // ชื่อนักเรียน
          React.createElement(
            "div",
            {
              style: {
                position: "absolute",
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: "translate(-50%, -50%)",
                display: "flex",
                color: fontColorHex,
                fontSize: fontSize,
                fontFamily: '"THSarabunNew"',
                whiteSpace: "nowrap",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            fullName,
          ),
          // เลขที่เกียรติบัตร (ถ้าเปิดใช้)
          ...(showNumber && numberText
            ? [
                React.createElement(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      left: `${numXPercent}%`,
                      top: `${numYPercent}%`,
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      color: numColorHex,
                      fontSize: numFontSize,
                      fontFamily: '"THSarabunNew"',
                      whiteSpace: "nowrap",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  },
                  numberText,
                ),
              ]
            : []),
        ),
        {
          width: width,
          height: height,
          fonts: [
            {
              name: "THSarabunNew",
              data: fontBytes,
              style: "normal",
            },
          ],
        },
      );

      const resHeaders = new Headers(imageResponse.headers);

      if (enrollment.certificate.length === 0) {
        await prisma.certificate.upsert({
          where: {
            student_enrollment_id: enrollment.student_enrollment_id,
          },
          update: {},
          create: {
            certificate_no: assignedCertNo,
            certificate_no_star: assignedCertNo,
            file_url: "",
            student_enrollment_id: enrollment.student_enrollment_id,
          },
        });
      }

      resHeaders.set(
        "Content-Disposition",
        `${disposition}; filename="certificate_${student.students_id}_${campId}.png"`,
      );
      // preview: cache ได้ตลอด (browser ใช้ซ้ำได้) เพราะ frontend จะเปลี่ยน ?t= เมื่อ template เปลี่ยน
      // download: ไม่ cache เพราะต้องการให้ได้ไฟล์ล่าสุดเสมอ
      if (isDownload) {
        resHeaders.set("Cache-Control", "no-store");
        resHeaders.delete("Pragma");
        resHeaders.delete("Expires");
      } else {
        resHeaders.set("Cache-Control", "private, max-age=31536000, immutable");
        resHeaders.delete("Pragma");
        resHeaders.delete("Expires");
      }
      resHeaders.set("X-Template-Hash", templateHash);
      if (assignedCertNo != null) {
        resHeaders.set("X-Certificate-No", String(assignedCertNo));
      }
      if (isOverflow) {
        resHeaders.set("X-Certificate-Overflow", String(overflowAmount));
      }

      return new NextResponse(imageResponse.body, {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        headers: resHeaders,
      });
    }

    // Load PDF
    const pdfDoc = await PDFDocument.create();

    pdfDoc.registerFontkit(fontkit);

    // Embed Image
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
    const page = pdfDoc.addPage([width, height]);

    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });

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

    // วาดชื่อนักเรียน
    const textWidth = customFont.widthOfTextAtSize(fullName, fontSize);
    const x = (xPercent / 100) * width - textWidth / 2;
    const y = (1 - yPercent / 100) * height - fontSize / 3;
    const fontColorRgb = hexToRgb(fontColorHex);

    page.drawText(fullName, {
      x: x,
      y: y,
      size: fontSize,
      font: customFont,
      color: rgb(fontColorRgb.r, fontColorRgb.g, fontColorRgb.b),
    });

    // วาดเลขที่เกียรติบัตร (ถ้าเปิดใช้)
    if (showNumber && numberText) {
      const numTextWidth = customFont.widthOfTextAtSize(
        numberText,
        numFontSize,
      );
      const numX = (numXPercent / 100) * width - numTextWidth / 2;
      const numY = (1 - numYPercent / 100) * height - numFontSize / 3;
      const numColorRgb = hexToRgb(numColorHex);

      page.drawText(numberText, {
        x: numX,
        y: numY,
        size: numFontSize,
        font: customFont,
        color: rgb(numColorRgb.r, numColorRgb.g, numColorRgb.b),
      });
    }

    const pdfBytes = await pdfDoc.save();

    if (enrollment.certificate.length === 0) {
      await prisma.certificate.upsert({
        where: {
          student_enrollment_id: enrollment.student_enrollment_id,
        },
        update: {},
        create: {
          certificate_no: assignedCertNo,
          certificate_no_star: assignedCertNo,
          file_url: "",
          student_enrollment_id: enrollment.student_enrollment_id,
        },
      });
    }

    const pdfHeaders: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="certificate_${student.students_id}_${campId}.pdf"`,
    };

    if (assignedCertNo != null) {
      pdfHeaders["X-Certificate-No"] = String(assignedCertNo);
    }
    if (isOverflow) {
      pdfHeaders["X-Certificate-Overflow"] = String(overflowAmount);
    }

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: pdfHeaders,
    });
  } catch (error) {
    console.error("Error generating certificate:", error);

    return NextResponse.json(
      { error: "Failed to generate certificate." },
      { status: 500 },
    );
  }
}
