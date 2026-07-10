export const BANGKOK_TIME_ZONE = "Asia/Bangkok";

type DateInput = Date | string | number;

export function getBangkokDateKey(input: DateInput): string {
  const date = input instanceof Date ? input : new Date(input);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function isBangkokDateBefore(
  input: DateInput,
  comparedTo: DateInput = new Date(),
): boolean {
  return getBangkokDateKey(input) < getBangkokDateKey(comparedTo);
}

export function isBangkokDateInRange(
  startDate?: DateInput | null,
  endDate?: DateInput | null,
  currentDate: DateInput = new Date(),
): boolean {
  const current = getBangkokDateKey(currentDate);

  return (
    (!startDate || getBangkokDateKey(startDate) <= current) &&
    (!endDate || current <= getBangkokDateKey(endDate))
  );
}

export function getBangkokDateAsUtcMidnight(
  input: DateInput = new Date(),
): Date {
  return new Date(`${getBangkokDateKey(input)}T00:00:00.000Z`);
}

export function getBangkokDaysUntil(
  input: DateInput,
  currentDate: DateInput = new Date(),
): number {
  const target = getBangkokDateAsUtcMidnight(input);
  const current = getBangkokDateAsUtcMidnight(currentDate);

  return Math.max(
    0,
    Math.round((target.getTime() - current.getTime()) / 86_400_000),
  );
}
