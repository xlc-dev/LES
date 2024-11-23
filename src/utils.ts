import * as XLSX from "xlsx";

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export async function readCSV(url: string): Promise<Energyflow> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
    }

    const csvText = await response.text();
    const workbook = XLSX.read(csvText, { type: "string" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      throw new Error("CSV file is empty");
    }

    const headers = jsonData[0] as string[];
    const data = jsonData.slice(1).map((row) => ({
      name: row[0],
      energyUsage: Number(row[1]),
      solarPanels: Number(row[2]),
    }));

    return { headers, data };
  } catch (error) {
    console.error("Error reading CSV file:", error);
    throw error;
  }
}
