import { readFile } from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFPage, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 54;
const TOP = 48;
const BOTTOM = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const BODY_SIZE = 14;
const LINE_HEIGHT = 18;

type Cell = {
  text: string;
  width: number;
  align?: "left" | "center" | "right";
};

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function money(value: unknown) {
  const amount = Number(value || 0);

  return amount
    ? amount.toLocaleString("th-TH", { maximumFractionDigits: 2 })
    : "-";
}

export async function createProjectDocumentPdf(document: any) {
  const pdf = await PDFDocument.create();

  pdf.registerFontkit(fontkit);
  const fontBytes = await readFile(
    path.join(process.cwd(), "public/fonts/THSarabunNew.ttf"),
  );
  const font = await pdf.embedFont(fontBytes, { subset: true });
  let logo: any = null;

  try {
    logo = await pdf.embedPng(
      await readFile(path.join(process.cwd(), "public/images/logoKKS.png")),
    );
  } catch {
    // The document remains usable when a deployment does not contain the logo.
  }

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y!: number;

  const addPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    y = TOP;
  };

  const drawAt = (text: string, x: number, top: number, size = BODY_SIZE) => {
    page.drawText(text, {
      x,
      y: PAGE_HEIGHT - top - size,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  const segments = (text: string): string[] => {
    const normalized = clean(text);

    if (!normalized) return [""];
    const segmenter = new (Intl as any).Segmenter("th", {
      granularity: "word",
    });

    return Array.from(
      segmenter.segment(normalized) as Iterable<{ segment: string }>,
      (item) => item.segment,
    );
  };

  const wrap = (text: string, maxWidth: number, size = BODY_SIZE) => {
    const output: string[] = [];

    for (const paragraph of clean(text).split("\n")) {
      if (!paragraph) {
        output.push("");
        continue;
      }
      let line = "";

      for (const segment of segments(paragraph)) {
        const candidate = line + segment;

        if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          line = candidate;
          continue;
        }
        output.push(line.trimEnd());
        if (font.widthOfTextAtSize(segment, size) <= maxWidth) {
          line = segment.trimStart();
        } else {
          let part = "";

          for (const character of Array.from(segment)) {
            if (
              part &&
              font.widthOfTextAtSize(part + character, size) > maxWidth
            ) {
              output.push(part);
              part = character;
            } else part += character;
          }
          line = part;
        }
      }
      output.push(line.trimEnd());
    }

    return output.length ? output : [""];
  };

  const ensure = (height: number) => {
    if (y + height > PAGE_HEIGHT - BOTTOM) addPage();
  };

  const centered = (text: string, size: number, gapAfter = 5) => {
    ensure(size + gapAfter);
    const width = font.widthOfTextAtSize(text, size);

    drawAt(text, (PAGE_WIDTH - width) / 2, y, size);
    y += size + gapAfter;
  };

  const line = (
    text: string,
    options: {
      indent?: number;
      size?: number;
      bold?: boolean;
      gap?: number;
    } = {},
  ) => {
    const size = options.size ?? BODY_SIZE;
    const indent = options.indent ?? 0;
    const lines = wrap(text, CONTENT_WIDTH - indent, size);

    for (const item of lines) {
      ensure(LINE_HEIGHT);
      drawAt(item, MARGIN_X + indent, y, size);
      y += LINE_HEIGHT;
    }
    y += options.gap ?? 0;
  };

  const labeled = (label: string, value: string) => {
    const labelWidth = 150;
    const labelLines = wrap(label, labelWidth - 8, BODY_SIZE);
    const valueLines = wrap(
      value || "-",
      CONTENT_WIDTH - labelWidth,
      BODY_SIZE,
    );
    const rowLines = Math.max(labelLines.length, valueLines.length);

    ensure(rowLines * LINE_HEIGHT);
    labelLines.forEach((item, index) =>
      drawAt(item, MARGIN_X, y + index * LINE_HEIGHT, BODY_SIZE),
    );
    valueLines.forEach((item, index) =>
      drawAt(item, MARGIN_X + labelWidth, y + index * LINE_HEIGHT, BODY_SIZE),
    );
    y += rowLines * LINE_HEIGHT;
  };

  const heading = (number: string, title: string) => {
    ensure(30);
    y += 5;
    line(`${number}. ${title}`, { size: 16, gap: 2 });
  };

  const numberedList = (items: unknown[], prefix: string) => {
    (Array.isArray(items) ? items : [])
      .filter((item) => clean(item))
      .forEach((item, index) => {
        const marker = `${prefix}.${index + 1}`;
        const markerWidth = 35;
        const itemLines = wrap(clean(item), CONTENT_WIDTH - 35, BODY_SIZE);

        ensure(itemLines.length * LINE_HEIGHT);
        drawAt(marker, MARGIN_X + 18, y, BODY_SIZE);
        itemLines.forEach((itemLine, lineIndex) =>
          drawAt(
            itemLine,
            MARGIN_X + markerWidth + 18,
            y + lineIndex * LINE_HEIGHT,
            BODY_SIZE,
          ),
        );
        y += itemLines.length * LINE_HEIGHT;
      });
  };

  const drawTable = (headers: Cell[], rows: string[][], size = 12) => {
    const padding = 4;
    const headerHeight = 32;
    const drawHeader = () => {
      ensure(headerHeight);
      let x = MARGIN_X;

      headers.forEach((header) => {
        page.drawRectangle({
          x,
          y: PAGE_HEIGHT - y - headerHeight,
          width: header.width,
          height: headerHeight,
          borderWidth: 0.7,
          borderColor: rgb(0, 0, 0),
        });
        const lines = wrap(header.text, header.width - padding * 2, size).slice(
          0,
          2,
        );

        lines.forEach((headerLine, index) => {
          const textWidth = font.widthOfTextAtSize(headerLine, size);

          drawAt(
            headerLine,
            x + Math.max(padding, (header.width - textWidth) / 2),
            y + 4 + index * 13,
            size,
          );
        });
        x += header.width;
      });
      y += headerHeight;
    };

    drawHeader();

    rows.forEach((row) => {
      const allLines = row.map((value, index) =>
        wrap(clean(value) || "-", headers[index].width - padding * 2, size),
      );
      let offset = 0;

      while (offset < Math.max(...allLines.map((items) => items.length))) {
        const availableLines = Math.max(
          1,
          Math.floor((PAGE_HEIGHT - BOTTOM - y - padding * 2) / 15),
        );

        if (availableLines < 1 || y > PAGE_HEIGHT - BOTTOM - 24) {
          addPage();
          drawHeader();
          continue;
        }
        const remaining = Math.max(
          ...allLines.map((items) => items.length - offset),
        );
        const lineCount = Math.min(remaining, availableLines);
        const rowHeight = Math.max(24, lineCount * 15 + padding * 2);

        if (y + rowHeight > PAGE_HEIGHT - BOTTOM) {
          addPage();
          drawHeader();
          continue;
        }
        let x = MARGIN_X;

        headers.forEach((header, columnIndex) => {
          page.drawRectangle({
            x,
            y: PAGE_HEIGHT - y - rowHeight,
            width: header.width,
            height: rowHeight,
            borderWidth: 0.7,
            borderColor: rgb(0, 0, 0),
          });
          const cellLines = allLines[columnIndex].slice(
            offset,
            offset + lineCount,
          );

          cellLines.forEach((cellLine, lineIndex) => {
            const textWidth = font.widthOfTextAtSize(cellLine, size);
            const alignedX =
              header.align === "right"
                ? x + header.width - padding - textWidth
                : header.align === "center"
                  ? x + (header.width - textWidth) / 2
                  : x + padding;

            drawAt(cellLine, alignedX, y + padding + lineIndex * 15, size);
          });
          x += header.width;
        });
        y += rowHeight;
        offset += lineCount;
        if (offset < Math.max(...allLines.map((items) => items.length))) {
          addPage();
          drawHeader();
        }
      }
    });
    y += 5;
  };

  addPage();
  if (logo) {
    const dimensions = logo.scale(0.115);

    page.drawImage(logo, {
      x: (PAGE_WIDTH - dimensions.width) / 2,
      y: PAGE_HEIGHT - y - dimensions.height,
      width: dimensions.width,
      height: dimensions.height,
    });
    y += dimensions.height + 8;
  }
  centered(
    `โครงการตามแผนปฏิบัติการประจำปีงบประมาณ ${document.fiscal_year}`,
    18,
    5,
  );
  centered("โรงเรียนขุขันธ์ อำเภอขุขันธ์ จังหวัดศรีสะเกษ", 16, 14);
  labeled("ชื่อโครงการ", clean(document.project_name));
  labeled("รหัสโครงการ/กิจกรรม", clean(document.project_code));
  labeled(
    "ชื่อกิจกรรม",
    `${clean(document.activity_name)}${document.activity_order ? `    ลำดับกิจกรรม ${clean(document.activity_order)}` : ""}`,
  );
  labeled(
    "ลักษณะโครงการ",
    document.project_type === "NEW"
      ? "โครงการใหม่ (เลือก)    โครงการต่อเนื่อง (ไม่เลือก)"
      : "โครงการใหม่ (ไม่เลือก)    โครงการต่อเนื่อง (เลือก)",
  );
  labeled("สนอง", clean(document.standards));
  labeled("กลยุทธ์โรงเรียน", clean(document.strategy));
  labeled("ผู้รับผิดชอบโครงการ", clean(document.responsible_people));
  labeled("กลุ่มงาน/กลุ่มสาระฯ/ระดับ", clean(document.department));
  ensure(14);
  page.drawLine({
    start: { x: MARGIN_X, y: PAGE_HEIGHT - y },
    end: { x: PAGE_WIDTH - MARGIN_X, y: PAGE_HEIGHT - y },
    thickness: 0.7,
    color: rgb(0, 0, 0),
  });
  y += 10;

  heading("1", "หลักการและเหตุผล");
  line(clean(document.rationale) || "-");
  heading("2", "วัตถุประสงค์");
  numberedList(document.objectives, "2");
  heading("3", "เป้าหมาย");
  line("3.1 เชิงปริมาณ", { indent: 18 });
  numberedList(document.quantitative_targets, "3.1");
  line("3.2 เชิงคุณภาพ", { indent: 18 });
  numberedList(document.qualitative_targets, "3.2");

  heading("4", "วิธีดำเนินการ");
  drawTable(
    [
      { text: "ขั้นตอน", width: 82 },
      { text: "วิธีดำเนินการ", width: 185 },
      { text: "ระยะเวลา", width: 75, align: "center" },
      { text: "งบประมาณ", width: 65, align: "right" },
      { text: "ผู้รับผิดชอบ", width: 80 },
    ],
    (document.procedures || []).map((row: any) => [
      row.step,
      row.method,
      row.period,
      money(row.budget),
      row.responsible,
    ]),
  );
  heading("5", "ระยะเวลาดำเนินการ");
  line(clean(document.duration_text) || "-", { indent: 18 });
  heading("6", "สถานที่ดำเนินงาน");
  line(clean(document.location_text) || "-", { indent: 18 });
  heading("7", `งบประมาณที่ใช้ทั้งสิ้น ${money(document.budget_total)} บาท`);
  line(`แหล่งงบประมาณ: ${clean(document.budget_source) || "-"}`, {
    indent: 18,
  });
  drawTable(
    [
      { text: "กิจกรรม/รายการใช้งบประมาณ", width: 177 },
      { text: "ค่าตอบแทน", width: 62, align: "right" },
      { text: "ค่าใช้สอย", width: 62, align: "right" },
      { text: "ค่าวัสดุ", width: 62, align: "right" },
      { text: "รวม", width: 54, align: "right" },
      { text: "ผู้รับผิดชอบ", width: 70 },
    ],
    (document.budget_items || []).map((row: any) => [
      row.description,
      money(row.compensation),
      money(row.expenses),
      money(row.materials),
      money(
        Number(row.compensation || 0) +
          Number(row.expenses || 0) +
          Number(row.materials || 0),
      ),
      row.responsible,
    ]),
  );

  heading("8", "การวัดและประเมินผล");
  drawTable(
    [
      { text: "ที่", width: 28, align: "center" },
      { text: "ตัวชี้วัดความสำเร็จ", width: 285 },
      { text: "วิธีวัด", width: 82, align: "center" },
      { text: "เครื่องมือที่ใช้", width: 92, align: "center" },
    ],
    (document.evaluations || []).map((row: any, index: number) => [
      `8.${index + 1}`,
      row.indicator,
      row.method,
      row.tool,
    ]),
  );
  heading("9", "ผลที่คาดว่าจะได้รับ");
  numberedList(document.expected_results, "9");

  const signatories = Array.isArray(document.signatories)
    ? document.signatories
    : [];

  if (signatories.length) {
    ensure(35);
    y += 14;
    for (let index = 0; index < signatories.length; index += 2) {
      ensure(92);
      const pair = signatories.slice(index, index + 2);

      pair.forEach((person: any, columnIndex: number) => {
        const blockWidth = CONTENT_WIDTH / 2;
        const x =
          pair.length === 1
            ? MARGIN_X + blockWidth / 2
            : MARGIN_X + columnIndex * blockWidth;
        const center = x + blockWidth / 2;
        let dotCount = 30;
        let signatureLine = `ลงชื่อ ${".".repeat(dotCount)} ${clean(person.role)}`;

        while (
          dotCount > 8 &&
          font.widthOfTextAtSize(signatureLine, BODY_SIZE) > blockWidth - 8
        ) {
          dotCount -= 1;
          signatureLine = `ลงชื่อ ${".".repeat(dotCount)} ${clean(person.role)}`;
        }
        const signatureWidth = font.widthOfTextAtSize(signatureLine, BODY_SIZE);

        drawAt(
          signatureLine,
          Math.max(x, center - signatureWidth / 2),
          y,
          BODY_SIZE,
        );
        const name = `(${clean(person.prefixName)}${clean(person.firstname)} ${clean(person.lastname)})`;

        drawAt(
          name,
          center - font.widthOfTextAtSize(name, BODY_SIZE) / 2,
          y + 24,
          BODY_SIZE,
        );
        const positionLines = wrap(
          clean(person.position),
          blockWidth - 12,
          BODY_SIZE,
        );

        positionLines
          .slice(0, 2)
          .forEach((positionLine, lineIndex) =>
            drawAt(
              positionLine,
              center - font.widthOfTextAtSize(positionLine, BODY_SIZE) / 2,
              y + 45 + lineIndex * LINE_HEIGHT,
              BODY_SIZE,
            ),
          );
      });
      y += 92;
    }
  }

  pages.forEach((pdfPage, index) => {
    const footer = `หน้า ${index + 1} / ${pages.length}`;

    pdfPage.drawText(footer, {
      x: PAGE_WIDTH - MARGIN_X - font.widthOfTextAtSize(footer, 10),
      y: 23,
      size: 10,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  });

  pdf.setTitle(`เอกสารโครงการ ${clean(document.project_name)}`);
  pdf.setAuthor("โรงเรียนขุขันธ์");

  return pdf.save();
}
