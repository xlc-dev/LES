import * as XLSX from "xlsx";

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function shuffleArray(array: number[]): number[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
