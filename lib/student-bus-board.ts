export type StudentBusBoardResult = {
  success: boolean;
  alreadyBoarded?: boolean;
  busName?: string;
  positionLabel?: string | null;
  checkedAt?: string | null;
  message?: string;
};

type StudentBusBoardErrorResponse = {
  error?: string;
  code?: string;
  retryable?: boolean;
};

const RETRY_DELAYS_MS = [
  () => 800 + Math.random() * 1700,
  () => 2000 + Math.random() * 3000,
];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function boardStudentBusWithRetry(
  campId: string | number,
): Promise<StudentBusBoardResult> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(`/api/student/camps/${campId}/bus/board`, {
        method: "POST",
      });
    } catch {
      if (attempt === RETRY_DELAYS_MS.length) {
        throw new Error("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
      }

      await wait(RETRY_DELAYS_MS[attempt]());
      continue;
    }

    const result = (await readJson(response)) as StudentBusBoardResult &
      StudentBusBoardErrorResponse;

    if (response.ok && result.success) return result;

    const isBusy =
      response.status === 503 &&
      result.code === "BUS_TRANSACTION_BUSY" &&
      result.retryable === true;

    if (!isBusy) {
      throw new Error(result.error || "เช็คชื่อขึ้นรถไม่สำเร็จ");
    }

    if (attempt === RETRY_DELAYS_MS.length) {
      throw new Error("มีผู้ใช้งานพร้อมกันจำนวนมาก กรุณาลองอีกครั้ง");
    }

    await wait(RETRY_DELAYS_MS[attempt]());
  }

  throw new Error("เช็คชื่อขึ้นรถไม่สำเร็จ กรุณาลองใหม่");
}
