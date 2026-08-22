import * as XLSX from "xlsx";

interface StudentExportItem {
  studentId: number;
  name: string;
  nickname: string | null;
  classroom: string;
  tel: string | null;
  foodAllergy: string | null;
  chronicDisease: string | null;
  remark: string | null;
  certificateNo?: number | null;
}

interface ExportCampStudentsExcelParams {
  campName: string;
  summary: {
    totalStudents: number;
    allergiesCount: number;
    chronicDiseasesCount: number;
    remarksCount: number;
  };
  students: StudentExportItem[];
}

export function exportCampStudentsToExcel({
  campName,
  summary,
  students,
}: ExportCampStudentsExcelParams) {
  const wb = XLSX.utils.book_new();

  const exportDateStr = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // --- 1. ข้อมูลนักเรียนทั้งหมด Sheet ---
  const rows: (string | number)[][] = [
    ["รายงานข้อมูลนักเรียนในค่าย - KKS Camp"],
    [`ชื่อค่าย / โครงการ: ${campName || "-"}`],
    [`วันที่ออกรายงาน: ${exportDateStr} น.`],
    [
      `สรุปภาพรวม: นักเรียนทั้งหมด ${summary.totalStudents} คน | แพ้อาหาร ${summary.allergiesCount} คน | โรคประจำตัว ${summary.chronicDiseasesCount} คน | ข้อมูลอื่นๆ ${summary.remarksCount} คน`,
    ],
    [],
    [
      "ลำดับ",
      "รหัสนักเรียน",
      "ชื่อ - นามสกุล",
      "ชื่อเล่น",
      "ระดับชั้น / ห้อง",
      "เบอร์โทรศัพท์",
      "ข้อมูลแพ้อาหาร",
      "โรคประจำตัว",
      "เงื่อนไขพิเศษ / หมายเหตุ",
      "เลขที่เกียรติบัตร",
    ],
    ...students.map((stu, index) => [
      index + 1,
      stu.studentId,
      stu.name,
      stu.nickname || "-",
      stu.classroom || "-",
      stu.tel || "-",
      stu.foodAllergy || "-",
      stu.chronicDisease || "-",
      stu.remark || "-",
      stu.certificateNo ? String(stu.certificateNo) : "-",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!cols"] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 32 },
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "รายชื่อนักเรียนในค่าย");

  const cleanCampName = (campName || "camp").replace(/[/\\?%*:|"<>]/g, "-");
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const fileName = `ข้อมูลนักเรียน_${cleanCampName}_${dateSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
