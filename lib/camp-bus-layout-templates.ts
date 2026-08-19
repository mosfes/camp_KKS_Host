export const PHEUNG_THIN_BUS_TEMPLATE_ID = "pheung-thin-30-0205" as const;

export type BusLayoutTemplateId = typeof PHEUNG_THIN_BUS_TEMPLATE_ID;

export type BusLayoutTemplatePosition = {
  rowNumber: number;
  seatIndex: number;
  label: string;
};

export type BusLayoutTemplateFloor = {
  floorNumber: number;
  rowCount: number;
  positions: BusLayoutTemplatePosition[];
};

export type BusLayoutTemplate = {
  id: BusLayoutTemplateId;
  name: string;
  description: string;
  defaultBusName: string;
  capacity: number;
  floors: BusLayoutTemplateFloor[];
};

function positions(
  rows: Array<Array<[seatIndex: number, label: number]>>,
): BusLayoutTemplatePosition[] {
  return rows.flatMap((row, rowIndex) =>
    row.map(([seatIndex, label]) => ({
      rowNumber: rowIndex + 1,
      seatIndex,
      label: String(label),
    })),
  );
}

function letteredPositions(
  rows: Array<Array<[seatIndex: number, label: number]>>,
): BusLayoutTemplatePosition[] {
  const seatLetters = ["A", "B", "C", "D"];

  return rows.flatMap((row, rowIndex) =>
    row.map(([seatIndex, label]) => ({
      rowNumber: rowIndex + 1,
      seatIndex,
      label: `${seatLetters[seatIndex]}${String(label).padStart(2, "0")}`,
    })),
  );
}

export const BUS_LAYOUT_TEMPLATES: readonly BusLayoutTemplate[] = [
  {
    id: PHEUNG_THIN_BUS_TEMPLATE_ID,
    name: "เชี่ยวชาญแทรเวล 30-0205",
    description:
      "รถสองชั้น 50 ที่นั่ง · ชั้นบน A/B/C/D + เลขตามผัง 1–38 · ชั้นล่าง 39–50",
    defaultBusName: "เชี่ยวชาญแทรเวล 30-0205",
    capacity: 50,
    floors: [
      {
        // The lower floor wraps around the lounge/table area in the reference
        // plan, so several rows intentionally contain only the outer seats.
        floorNumber: 1,
        rowCount: 5,
        positions: positions([
          [
            [0, 44],
            [1, 45],
            [2, 46],
            [3, 47],
          ],
          [
            [0, 43],
            [3, 48],
          ],
          [
            [0, 42],
            [3, 49],
          ],
          [
            [0, 41],
            [3, 50],
          ],
          [
            [0, 39],
            [1, 40],
          ],
        ]),
      },
      {
        floorNumber: 2,
        rowCount: 11,
        positions: letteredPositions([
          [
            [2, 1],
            [3, 2],
          ],
          [
            [0, 3],
            [1, 4],
            [2, 5],
            [3, 6],
          ],
          [
            [0, 7],
            [1, 8],
            [2, 9],
            [3, 10],
          ],
          [
            [0, 11],
            [1, 12],
            [2, 13],
            [3, 14],
          ],
          [
            [0, 15],
            [1, 16],
            [2, 17],
            [3, 18],
          ],
          [
            [0, 19],
            [1, 20],
            [2, 21],
            [3, 22],
          ],
          [
            [2, 23],
            [3, 24],
          ],
          [
            [0, 25],
            [1, 26],
            [2, 27],
            [3, 28],
          ],
          [
            [0, 29],
            [1, 30],
            [2, 31],
            [3, 32],
          ],
          [
            [0, 33],
            [1, 34],
          ],
          [
            [0, 35],
            [1, 36],
            [2, 37],
            [3, 38],
          ],
        ]),
      },
    ],
  },
] as const;

export function getBusLayoutTemplate(id: string | null | undefined) {
  return BUS_LAYOUT_TEMPLATES.find((template) => template.id === id) || null;
}

export function detectBusLayoutTemplate(
  floors: Array<{
    floor_number: number;
    row_count: number;
    positions: Array<{
      row_number: number;
      seat_index: number;
      label: string;
    }>;
  }>,
): BusLayoutTemplateId | null {
  for (const template of BUS_LAYOUT_TEMPLATES) {
    if (floors.length !== template.floors.length) continue;

    const matches = template.floors.every((templateFloor) => {
      const floor = floors.find(
        (item) => item.floor_number === templateFloor.floorNumber,
      );

      if (
        !floor ||
        floor.row_count !== templateFloor.rowCount ||
        floor.positions.length !== templateFloor.positions.length
      ) {
        return false;
      }

      const positionKeys = new Set(
        floor.positions.map(
          (position) =>
            `${position.row_number}:${position.seat_index}:${position.label}`,
        ),
      );

      return templateFloor.positions.every((position) =>
        positionKeys.has(
          `${position.rowNumber}:${position.seatIndex}:${position.label}`,
        ),
      );
    });

    if (matches) return template.id;
  }

  return null;
}
