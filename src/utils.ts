import * as XLSX from "xlsx";

export const SECONDS_IN_DAY = 86400;
export const HOURS_IN_WEEK = 168;
export const MAX_DAYS_IN_YEAR = 366;

export enum ApplianceTypes {
  WASHING_MACHINE = "Washing Machine",
  TUMBLE_DRYER = "Tumble Dryer",
  DISHWASHER = "Dishwasher",
  STOVE = "Stove",
  ELECTRIC_VEHICLE = "Electric Vehicle",
}

export enum ApplianceDays {
  MONDAY = 0,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY,
}

export const getRandomInt = (min: number, max: number): number => {
  return (
    Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + min
  );
};

export function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function s2ab(s: string): ArrayBuffer {
  const buffer = new ArrayBuffer(s.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buffer;
}

export async function readCSV(input: string | File): Promise<Energyflow> {
  try {
    let csvText: string;

    if (input instanceof File) {
      csvText = await input.text();
    } else {
      const response = await fetch(input);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
      }
      csvText = await response.text();
    }

    if (!csvText.trim()) {
      throw new Error("The CSV file is empty or contains only whitespace.");
    }

    const workbook = XLSX.read(csvText, { type: "string" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      throw new Error("The CSV file is empty.");
    }

    const headers = jsonData[0] as string[];
    const data = jsonData.slice(1).map((row) => ({
      timestamp: row[0],
      energy_used: Number(row[1]),
      solar_produced: Number(row[2]),
    }));

    return { headers, data };
  } catch (error) {
    console.error("Error reading CSV file:", error);
    throw error;
  }
}

export function highestSetBit(n: number): number {
  if (n === 0) return -1;
  return Math.floor(Math.log2(n));
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function randomNormal(mean = 1, stdDev = 0.1): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return (
    mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  );
}

export function timestampToUnix(excelTimestamp: number): number {
  // Excel's epoch is 25569 days before Unix epoch
  return Math.round((excelTimestamp - 25569) * SECONDS_IN_DAY);
}

export function unixToHour(unixTimestamp: number): number {
  // Convert Unix timestamp to hour (range 0-23)
  return Math.floor(unixTimestamp / 3600) % 24;
}

export function unixToTimestamp(unixTimestamp: number): number {
  // Convert Unix timestamp to Excel timestamp
  return unixTimestamp / SECONDS_IN_DAY + 25569;
}
