const SEAT_LETTERS = ["A", "B", "C", "D"];

export function positionLabel(rowNumber: number, seatIndex: number) {
  const seatLetter = SEAT_LETTERS[seatIndex] || String(seatIndex + 1);

  return `${seatLetter}${String(rowNumber).padStart(2, "0")}`;
}
