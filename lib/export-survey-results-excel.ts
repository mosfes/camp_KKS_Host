import * as XLSX from "xlsx-js-style";

export interface SurveyExportQuestion {
  id: number;
  text: string;
  type: "scale" | "text" | "checkbox" | "header";
  scaleMax?: number;
}

export interface SurveyExportResponse {
  submittedAt: string;
  answers: Record<
    number,
    { text_answer: string | null; scale_value: number | null }
  >;
}

export interface SurveyExportData {
  title: string;
  questions: SurveyExportQuestion[];
  individualResponses: SurveyExportResponse[];
}

export interface ScaleQuestionSummary {
  questionId: number;
  text: string;
  average: number;
  standardDeviation: number;
  interpretation: string;
}

export interface SurveyScaleSummary {
  questions: ScaleQuestionSummary[];
  overallAverage: number;
  overallStandardDeviation: number;
  overallInterpretation: string;
}

const HEADER_STYLE = {
  fill: { fgColor: { rgb: "D9EAF7" } },
  font: { bold: true, color: { rgb: "1F2937" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "64748B" } },
    bottom: { style: "thin", color: { rgb: "64748B" } },
    left: { style: "thin", color: { rgb: "64748B" } },
    right: { style: "thin", color: { rgb: "64748B" } },
  },
};

const BODY_STYLE = {
  fill: { fgColor: { rgb: "FFFFFF" } },
  font: { color: { rgb: "1F2937" } },
  alignment: { vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } },
  },
};

const BODY_CENTER_STYLE = {
  ...BODY_STYLE,
  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  },
};

const TOTAL_STYLE = {
  ...BODY_STYLE,
  fill: { fgColor: { rgb: "D9EAF7" } },
  font: { bold: true, color: { rgb: "1F2937" } },
  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  },
};

function round(value: number, decimalPlaces: number) {
  const multiplier = 10 ** decimalPlaces;

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function average(values: number[]) {
  if (values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStandardDeviation(values: number[]) {
  if (values.length <= 1) return 0;

  const mean = average(values);
  const squaredDifferenceSum = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  );

  return Math.sqrt(squaredDifferenceSum / (values.length - 1));
}

function interpretAverage(value: number, scaleMax = 5) {
  const normalizedValue = scaleMax > 0 ? (value / scaleMax) * 5 : value;

  if (normalizedValue >= 4.51) return "ดีเยี่ยม";
  if (normalizedValue >= 3.51) return "ดี";
  if (normalizedValue >= 2.51) return "ปานกลาง";
  if (normalizedValue >= 1.51) return "น้อย";

  return "น้อยที่สุด";
}

function getScaleAnswers(
  responses: SurveyExportResponse[],
  questionId: number,
) {
  return responses.flatMap((response) => {
    const value = response.answers[questionId]?.scale_value;

    return typeof value === "number" && Number.isFinite(value) ? [value] : [];
  });
}

export function calculateSurveyScaleSummary(
  data: SurveyExportData,
): SurveyScaleSummary {
  const scaleQuestions = data.questions.filter(
    (question) => question.type === "scale",
  );
  const allScaleAnswers: number[] = [];

  const questions = scaleQuestions.map((question) => {
    const answers = getScaleAnswers(data.individualResponses, question.id);
    const questionAverage = average(answers);

    allScaleAnswers.push(...answers);

    return {
      questionId: question.id,
      text: question.text,
      average: round(questionAverage, 2),
      standardDeviation: round(sampleStandardDeviation(answers), 3),
      interpretation: interpretAverage(questionAverage, question.scaleMax || 5),
    };
  });

  const overallAverage = average(allScaleAnswers);
  const overallScaleMax =
    scaleQuestions.length > 0
      ? average(scaleQuestions.map((question) => question.scaleMax || 5))
      : 5;

  return {
    questions,
    overallAverage: round(overallAverage, 2),
    overallStandardDeviation: round(
      sampleStandardDeviation(allScaleAnswers),
      3,
    ),
    overallInterpretation: interpretAverage(overallAverage, overallScaleMax),
  };
}

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAnswer(
  response: SurveyExportResponse,
  question: SurveyExportQuestion,
) {
  const answer = response.answers[question.id];

  if (!answer) return "-";
  if (question.type === "scale") return answer.scale_value ?? "-";
  if (question.type === "checkbox") {
    try {
      const selectedOptions = JSON.parse(answer.text_answer || "[]");

      return Array.isArray(selectedOptions)
        ? selectedOptions.join(", ")
        : answer.text_answer || "-";
    } catch {
      return answer.text_answer || "-";
    }
  }

  return answer.text_answer || "-";
}

function applyCellStyle(
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  style: Record<string, unknown>,
) {
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let column = range.s.c; column <= range.e.c; column++) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = worksheet[address];

      if (cell) cell.s = JSON.parse(JSON.stringify(style));
    }
  }
}

function buildSummaryWorksheet(data: SurveyExportData) {
  const summary = calculateSurveyScaleSummary(data);
  const rows: (string | number)[][] = [
    [
      "ที่",
      "รายงานการประเมิน",
      "ค่าเฉลี่ย\n(X̄)",
      "ค่าเบี่ยงเบน\nมาตรฐาน (S.D.)",
      "แปลผล",
    ],
    ...summary.questions.map((question, index) => [
      index + 1,
      question.text,
      question.average,
      question.standardDeviation,
      question.interpretation,
    ]),
    [
      "รวม",
      "",
      summary.overallAverage,
      summary.overallStandardDeviation,
      summary.overallInterpretation,
    ],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const lastRowIndex = rows.length - 1;

  worksheet["!cols"] = [
    { wch: 7 },
    { wch: 62 },
    { wch: 15 },
    { wch: 21 },
    { wch: 16 },
  ];
  worksheet["!rows"] = rows.map((row, index) => ({
    hpt:
      index === 0
        ? 42
        : index === lastRowIndex
          ? 28
          : Math.max(26, Math.ceil(String(row[1]).length / 48) * 22),
  }));
  worksheet["!merges"] = [
    {
      s: { r: lastRowIndex, c: 0 },
      e: { r: lastRowIndex, c: 1 },
    },
  ];
  worksheet["!pageSetup"] = {
    orientation: "landscape",
    fitToWidth: 1,
    fitToHeight: 0,
  };
  worksheet["!margins"] = {
    left: 0.3,
    right: 0.3,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2,
  };

  applyCellStyle(
    worksheet,
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    HEADER_STYLE,
  );
  if (lastRowIndex > 1) {
    applyCellStyle(
      worksheet,
      { s: { r: 1, c: 0 }, e: { r: lastRowIndex - 1, c: 4 } },
      BODY_STYLE,
    );
    applyCellStyle(
      worksheet,
      { s: { r: 1, c: 0 }, e: { r: lastRowIndex - 1, c: 0 } },
      BODY_CENTER_STYLE,
    );
    applyCellStyle(
      worksheet,
      { s: { r: 1, c: 2 }, e: { r: lastRowIndex - 1, c: 4 } },
      BODY_CENTER_STYLE,
    );
  }
  applyCellStyle(
    worksheet,
    { s: { r: lastRowIndex, c: 0 }, e: { r: lastRowIndex, c: 4 } },
    TOTAL_STYLE,
  );

  for (let row = 1; row <= lastRowIndex; row++) {
    const indexCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    const averageCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })];
    const standardDeviationCell =
      worksheet[XLSX.utils.encode_cell({ r: row, c: 3 })];

    if (indexCell?.t === "n") indexCell.z = "0";
    if (averageCell) averageCell.z = "0.00";
    if (standardDeviationCell) standardDeviationCell.z = "0.000";
  }

  return worksheet;
}

function buildResponsesWorksheet(data: SurveyExportData) {
  const questions = data.questions.filter(
    (question) => question.type !== "header",
  );
  const rows: (string | number)[][] = [
    [
      "ลำดับ",
      "วันเวลาที่ส่ง",
      ...questions.map(
        (question, index) => `ข้อ ${index + 1}: ${question.text}`,
      ),
    ],
    ...data.individualResponses.map((response, index) => [
      index + 1,
      formatSubmittedAt(response.submittedAt),
      ...questions.map((question) => formatAnswer(response, question)),
    ]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const lastColumnIndex = Math.max(1, rows[0].length - 1);

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 24 },
    ...questions.map((question) => ({
      wch: Math.min(55, Math.max(24, question.text.length + 8)),
    })),
  ];
  worksheet["!rows"] = [{ hpt: 42 }];
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(0, rows.length - 1), c: lastColumnIndex },
    }),
  };

  applyCellStyle(
    worksheet,
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } },
    HEADER_STYLE,
  );
  if (rows.length > 1) {
    applyCellStyle(
      worksheet,
      {
        s: { r: 1, c: 0 },
        e: { r: rows.length - 1, c: lastColumnIndex },
      },
      BODY_STYLE,
    );
  }

  return worksheet;
}

export function buildSurveyResultsWorkbook(data: SurveyExportData) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    buildSummaryWorksheet(data),
    "สรุปผลการประเมิน",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    buildResponsesWorksheet(data),
    "คำตอบรายบุคคล",
  );

  return workbook;
}

export function exportSurveyResultsToExcel(data: SurveyExportData) {
  const workbook = buildSurveyResultsWorkbook(data);
  const cleanSurveyTitle = (data.title || "camp").replace(
    /[/\\?%*:|"<>]/g,
    "-",
  );
  const fileName = `ผลแบบสอบถาม_${cleanSurveyTitle}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, fileName, { compression: true });

  return fileName;
}
