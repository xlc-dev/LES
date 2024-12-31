import * as XLSX from "xlsx";

export const SECONDS_IN_DAY = 86400;
export const HOURS_IN_WEEK = 168;
export const MAX_DAYS_IN_YEAR = 366;
export const SECONDS_IN_HOUR = 3600;

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

/**
 * Returns a random integer between min and max (inclusive).
 *
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The random integer.
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffles an array.
 *
 * @param {T[]} arr - The array to shuffle.
 * @returns {T[]} The shuffled array.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Converts a string to an ArrayBuffer.
 *
 * @param {string} s - The string to convert.
 * @returns {ArrayBuffer} The ArrayBuffer representation of the string.
 */
export function s2ab(s: string): ArrayBuffer {
  const buffer = new ArrayBuffer(s.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buffer;
}

/**
 * Reads a CSV file and returns the parsed data.
 *
 * @param {string | File} input - The input file or URL.
 * @returns {Promise<Energyflow>} A promise that resolves to the parsed energyflow data.
 */
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

    const headers = jsonData[0];
    const firstDataRow = jsonData[1];
    const firstTime = unixToTimestamp(Number(firstDataRow[0]));

    const offset = Math.round((Math.round(firstTime) - firstTime) * 86400);

    const data = jsonData.slice(1).map((row) => ({
      timestamp: (Number(row[0]) + offset).toString(),
      energy_used: Number(row[1]),
      solar_produced: Number(row[2]),
    }));

    return { solarPanelsFactor: 8500, energyUsageFactor: 7000, headers, data };
  } catch (error) {
    console.error("Error reading CSV file:", error);
    throw error;
  }
}

/**
 * Rounds a number to a specified number of decimals.
 *
 * @param {number} num - The number to round.
 * @param {number} decimals - The number of decimals to round to.
 * @returns {number} The rounded number.
 */
export function roundTo(num: number, decimals: number): number {
  return Number(num.toFixed(decimals));
}

/**
 * Box-Muller transform to generate a random number with a normal distribution.
 *
 * @param {number} mean - The mean of the distribution.
 * @param {number} stddev - The standard deviation of the distribution.
 * @returns {number} The random number.
 */
export function randomNormal(mean: number = 0, stddev: number = 1): number {
  let u1 = Math.random();
  let u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z * stddev + mean;
}

/**
 * Converts an Excel timestamp to a Unix timestamp.
 *
 * @param {number} excelTimestamp - The Excel timestamp.
 * @returns {number} The Unix timestamp.
 */
export function timestampToUnix(excelTimestamp: number): number {
  // Excel's epoch is 25569 days before Unix epoch
  return Math.round((excelTimestamp - 25569) * SECONDS_IN_DAY);
}

/**
 * Converts a Unix timestamp to an hour (range 0-23).
 *
 * @param {number} unixTimestamp - The Unix timestamp.
 * @returns {number} The hour.
 */
export function unixToHour(unixTimestamp: number): number {
  return Math.floor(unixTimestamp / SECONDS_IN_HOUR) % 24;
}

/**
 * Converts a Unix timestamp to an Excel timestamp.
 *
 * @param {number} unixTimestamp - The Unix timestamp.
 * @returns {number} The Excel timestamp.
 */
export function unixToTimestamp(unixTimestamp: number): number {
  return unixTimestamp / SECONDS_IN_DAY + 25569;
}

/**
 * Converts a 24-bit bitmap to a boolean array.
 * Each bit in the bitmap represents whether the appliance is available at a specific hour.
 * @param bitmap The 24-bit number representing availability (1 = available, 0 = not available).
 * @returns A boolean array where each element represents the availability of the appliance at each hour (0-23).
 */
export function bitmapToBoolArray(bitmap: number): boolean[] {
  const boolArray: boolean[] = [];

  // Iterate through each bit in the 24-bit number
  for (let i = 0; i < 24; i++) {
    // Check if the i-th bit is set (1) or not (0)
    boolArray[i] = (bitmap & (1 << i)) !== 0;
  }

  return boolArray;
}
