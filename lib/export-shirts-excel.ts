import * as XLSX from "xlsx";

interface StudentShirt {
  enrollmentId: number;
  studentId: number;
  name: string;
  nickname: string | null;
  classroom: string;
  shirtSize: string | null;
  enrolledAt: string;
}

interface ExportShirtsExcelParams {
  campName: string;
  summary: Record<string, number>;
  totalShirts: number;
  totalStudents: number;
  students: StudentShirt[];
}

export function exportShirtsToExcel({
  campName,
  summary,
  totalShirts,
  totalStudents,
  students,
}: ExportShirtsExcelParams) {
  const wb = XLSX.utils.book_new();

  const exportDateStr = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // --- 1. สรุปยอดจองเสื้อ Sheet ---
  const summaryAoa: (string | number)[][] = [
    ["รายงานสรุปการจองเสื้อ - KKS Camp"],
    [`ชื่อค่าย / โครงการ: ${campName || "-"}`],
    [`วันที่ออกรายงาน: ${exportDateStr} น.`],
    [
      `จำนวนนักเรียนทั้งหมด: ${totalStudents} คน | ยอดสั่งทำเสื้อรวม: ${totalShirts} ตัว`,
    ],
    [],
    ["ขนาดเสื้อ (Size)", "จำนวน (ตัว)", "สัดส่วน (%)"],
  ];

  Object.entries(summary).forEach(([size, count]) => {
    const pct =
      totalStudents > 0
        ? `${((count / totalStudents) * 100).toFixed(1)}%`
        : "0%";

    summaryAoa.push([size, count, pct]);
  });

  // Total summary row
  summaryAoa.push([
    "รวมยอดจองเสื้อทั้งหมด",
    totalShirts,
    totalStudents > 0
      ? `${((totalShirts / totalStudents) * 100).toFixed(1)}%`
      : "100%",
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);

  wsSummary["!cols"] = [{ wch: 26 }, { wch: 16 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปยอดจองเสื้อ");

  // --- 2. รายชื่อผู้จองเสื้อ Sheet ---
  const studentAoa: (string | number)[][] = [
    [
      "ลำดับ",
      "รหัสนักเรียน",
      "ชื่อ - นามสกุล",
      "ชื่อเล่น",
      "ระดับชั้น / ห้อง",
      "ไซส์เสื้อ",
      "วันที่ลงทะเบียน",
    ],
    ...students.map((student, index) => [
      index + 1,
      student.studentId,
      student.name,
      student.nickname || "-",
      student.classroom || "-",
      student.shirtSize || "รอระบุไซส์",
      student.enrolledAt
        ? new Date(student.enrolledAt).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "-",
    ]),
  ];

  const wsStudents = XLSX.utils.aoa_to_sheet(studentAoa);

  wsStudents["!cols"] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 32 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, wsStudents, "รายชื่อผู้จองเสื้อ");

  // Format file name
  const cleanCampName = (campName || "camp").replace(/[/\\?%*:|"<>]/g, "-");
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const fileName = `รายการจองเสื้อ_${cleanCampName}_${dateSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
