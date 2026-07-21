export function parseNfcStudentId(value: unknown): number | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  const match = normalized.match(/^(?:KKS_STUDENT:)?(\d{1,10})$/i);

  if (!match) return null;

  const studentId = Number(match[1]);

  if (!Number.isSafeInteger(studentId) || studentId <= 0) return null;

  return studentId;
}
