export type StudentMissionSubmitPayload = {
  campId: number;
  missionId: number;
  answers: Array<{
    questionId: number;
    type: "TEXT" | "MCQ" | "PHOTO";
    value: string;
    publicId?: string;
  }>;
  isDraft: boolean;
};

export type StudentMissionSubmitResult = {
  success: boolean;
  missionId: number;
  status: "pending" | "completed";
  resultId: number;
  alreadyCompleted?: boolean;
};

const RETRY_DELAYS_MS = [
  () => 800 + Math.random() * 1700,
  () => 2000 + Math.random() * 3000,
  () => 4000 + Math.random() * 4000,
];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function submitStudentMissionWithRetry(
  payload: StudentMissionSubmitPayload,
): Promise<StudentMissionSubmitResult> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let response: Response;

    try {
      response = await fetch("/api/student/mission/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      if (attempt === RETRY_DELAYS_MS.length) {
        throw new Error("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
      }

      await wait(RETRY_DELAYS_MS[attempt]());
      continue;
    }

    const result = await readJson(response);

    if (response.ok && result.success) {
      return result as StudentMissionSubmitResult;
    }

    const isBusy =
      response.status === 503 &&
      result.code === "MISSION_SUBMIT_BUSY" &&
      result.retryable === true;

    if (!isBusy) {
      throw new Error(result.error || result._error || "ส่งภารกิจล้มเหลว");
    }

    if (attempt === RETRY_DELAYS_MS.length) {
      throw new Error("มีผู้ใช้งานพร้อมกันจำนวนมาก กรุณาลองอีกครั้ง");
    }

    await wait(RETRY_DELAYS_MS[attempt]());
  }

  throw new Error("ส่งภารกิจไม่สำเร็จ กรุณาลองใหม่");
}
