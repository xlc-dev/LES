import {
  SECONDS_IN_DAY,
  ApplianceTypes,
  ApplianceDays,
  highestSetBit,
} from "./utils";

function getStartEndDate(energyflow: Energyflow): {
  min: string | null;
  max: string | null;
} {
  if (energyflow.data.length === 0) {
    return { min: null, max: null };
  }

  const minTimestamp = energyflow.data.reduce((min, current) => {
    const currentTimestamp = Number(current.timestamp); // Convert timestamp to number
    return currentTimestamp < min ? currentTimestamp : min;
  }, Number(energyflow.data[0].timestamp)); // Start with the first timestamp

  const maxTimestamp = energyflow.data.reduce((max, current) => {
    const currentTimestamp = Number(current.timestamp); // Convert timestamp to number
    return currentTimestamp > max ? currentTimestamp : max;
  }, Number(energyflow.data[0].timestamp)); // Start with the first timestamp

  return {
    min: minTimestamp.toString(),
    max: maxTimestamp.toString(),
  };
}

function getChunkStartEndDates(
  energyflow: Energyflow,
  offset: number,
  chunkSize: number,
): { chunkStartDate: string; chunkEndDate: string; daysInChunk: number } {
  // Get the total start and end dates
  const { min, max } = getStartEndDate(energyflow);
  if (!min || !max) {
    throw new Error("No data available to calculate dates.");
  }

  // Convert the min and max timestamps to numbers
  const totalStartDate = Number(min);
  const totalEndDate = Number(max);

  // Calculate the chunk start date (with offset)
  const chunkStartDate = totalStartDate + offset * SECONDS_IN_DAY; // Offset in days converted to seconds

  // Calculate the chunk end date (with chunk size)
  const chunkEndDate = chunkStartDate + chunkSize * SECONDS_IN_DAY;

  // Calculate how many days the chunk spans
  const daysInChunk =
    Math.floor((chunkEndDate - chunkStartDate) / SECONDS_IN_DAY) + 1;

  // Convert the chunk start and end dates back to a readable timestamp (string format)
  return {
    chunkStartDate: new Date(chunkStartDate * 1000).toISOString(), // Convert to milliseconds
    chunkEndDate: new Date(chunkEndDate * 1000).toISOString(), // Convert to milliseconds
    daysInChunk,
  };
}

function getAllSortedByTimestamp(
  data: Array<{ timestamp: number;[key: string]: any }>,
  limit: number = 100000,
  offset: number = 0,
): Array<any> {
  return [...data]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(offset, offset + limit);
}

function getBySolarProduced(
  data: Array<{ solar_produced: number; id: number;[key: string]: any }>,
  limit: number = 100000,
  offset: number = 0,
): Array<any> {
  return [...data]
    .filter((item) => item.solar_produced > 0)
    .sort((a, b) => b.solar_produced - a.solar_produced)
    .slice(offset, offset + limit);
}

function createTimeWindow(
  day: ApplianceDays,
  appliance_name: ApplianceTypes,
): ApplianceTimeWindow {
  let bitmap = 0;

  // Handle appliance-specific cases
  if (appliance_name === ApplianceTypes.STOVE) {
    return { day, bitmap_window: 0b000000000000000011110000, appliance_name };
  }

  if (
    appliance_name === ApplianceTypes.ELECTRIC_VEHICLE &&
    ![ApplianceDays.SATURDAY, ApplianceDays.SUNDAY].includes(day)
  ) {
    bitmap |= 0b111111111111111111111111 & ~(0b111111111111 << 8); // Restricted hours
  }

  // Generate random time windows for other appliances
  const numWindows = Math.floor(Math.random() * 100) + 1;
  const amount = numWindows < 90 ? 1 : numWindows < 99 ? 2 : 3;

  for (let i = 0; i < amount; i++) {
    let [startHour, endHour] = generateRandomTimeWindow(bitmap);
    const windowMask = ((1 << (endHour - startHour)) - 1) << startHour;
    bitmap |= windowMask;
  }

  return { day, bitmap_window: bitmap, appliance_name };
}

function generateRandomTimeWindow(bitmap: number): [number, number] {
  let startHour = Math.floor(Math.random() * 24);
  let endHour = Math.floor(Math.random() * (24 - startHour)) + startHour + 1;

  const existingBits = bitmap & ((1 << endHour) - 1);
  if (existingBits & ((1 << startHour) - 1)) {
    startHour = highestSetBit(existingBits) % 24;
  }

  return [startHour, endHour];
}

function generateEmptyTimePlan(): ApplianceTimeDaily[] {
  const daysInYear = 365;
  const emptyPlan: ApplianceTimeDaily[] = [];

  for (let day = 0; day < daysInYear; day++) {
    emptyPlan.push({
      day,
      bitmap_plan_energy: 0,
      bitmap_plan_no_energy: 0,
    });
  }

  return emptyPlan;
}
