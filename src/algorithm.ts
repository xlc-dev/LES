import { HOURS_IN_WEEK, MAX_DAYS_IN_YEAR, SECONDS_IN_DAY } from "./utils";

function getStartEndDate(energyflow: Energyflow): {
  min: string | null;
  max: string | null;
} {
  if (energyflow.data.length === 0) {
    return { min: null, max: null };
  }

  const minTimestamp = energyflow.data.reduce((min, current) => {
    const currentTimestamp = Number(current.timestamp);
    return currentTimestamp < min ? currentTimestamp : min;
  }, Number(energyflow.data[0].timestamp));

  const maxTimestamp = energyflow.data.reduce((max, current) => {
    const currentTimestamp = Number(current.timestamp);
    return currentTimestamp > max ? currentTimestamp : max;
  }, Number(energyflow.data[0].timestamp));

  return {
    min: minTimestamp.toString(),
    max: maxTimestamp.toString(),
  };
}

function getChunkStartEndDates({
  energyflow,
  energyflowDataSim,
}: {
  energyflow: Energyflow;
  energyflowDataSim: Energyflow["data"];
}): {
  totalStartDate: number;
  totalEndDate: number;
  startDate: number;
  endDate: number;
  daysInChunk: number;
} {
  const { min, max } = getStartEndDate(energyflow);
  if (!min || !max) {
    throw new Error("No data available to calculate dates.");
  }

  const totalStartDate = Number(min);
  const totalEndDate = Number(max);

  if (energyflowDataSim.length === 0) {
    throw new Error("No simulation data available to calculate dates.");
  }

  const startDate = Number(energyflowDataSim[0].timestamp);
  const endDate =
    Number(energyflowDataSim[energyflowDataSim.length - 1].timestamp) -
    SECONDS_IN_DAY +
    3600;

  const daysInChunk = Math.floor((endDate - startDate) / SECONDS_IN_DAY) + 1;

  return {
    totalStartDate,
    totalEndDate,
    startDate,
    endDate,
    daysInChunk,
  };
}

function getAllSortedByTimestamp({
  data,
  limit = HOURS_IN_WEEK,
  offset = 0,
}: {
  data: Array<{
    timestamp: string;
    energy_used: number;
    solar_produced: number;
  }>;
  limit?: number;
  offset?: number;
}): Array<any> {
  return [...data]
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
    .slice(offset, offset + limit);
}

function getBySolarProduced({
  data,
  limit = HOURS_IN_WEEK,
  offset = 0,
}: {
  data: Array<{
    timestamp: string;
    energy_used: number;
    solar_produced: number;
  }>;
  limit?: number;
  offset?: number;
}): Array<any> {
  return [...data]
    .filter((item) => item.solar_produced > 0)
    .sort((a, b) => b.solar_produced - a.solar_produced)
    .slice(offset, offset + limit);
}

function generateEmptyTimePlan(): ApplianceTimeDaily[] {
  const emptyPlan: ApplianceTimeDaily[] = [];

  for (let day = 0; day < MAX_DAYS_IN_YEAR; day++) {
    emptyPlan.push({
      day,
      bitmap_plan_energy: 0,
      bitmap_plan_no_energy: 0,
    });
  }

  return emptyPlan;
}

function setupPlanning(
  energyflowDataStepper: Energyflow,
  chunkOffset: number,
): {
  daysInChunk: number;
  chunkOffset: number;
  totalStartDate: number;
  totalEndDate: number;
  startDate: number;
  endDate: number;
  energyflowDataSim: Energyflow["data"];
  energyflowDataSolar: Energyflow["data"];
  applianceTime: ApplianceTimeDaily[];
  results: number[][];
} {
  const energyflowDataSolar = getBySolarProduced({
    data: energyflowDataStepper.data,
    offset: chunkOffset * 24,
  });

  const energyflowDataSim = getAllSortedByTimestamp({
    data: energyflowDataStepper.data,
    offset: chunkOffset * 24,
  });

  const { totalStartDate, totalEndDate, startDate, endDate, daysInChunk } =
    getChunkStartEndDates({
      energyflow: energyflowDataStepper,
      energyflowDataSim,
    });

  const applianceTime = generateEmptyTimePlan();

  const results: number[][] = Array.from({ length: daysInChunk }, () =>
    Array(7).fill(0.0),
  );

  return {
    daysInChunk,
    chunkOffset,
    totalStartDate,
    totalEndDate,
    startDate,
    endDate,
    energyflowDataSim,
    energyflowDataSolar,
    applianceTime,
    results,
  };
}

export function loop(
  energyflowData: Energyflow,
  householdPlanning: Household[],
  chunkOffsetLoop: number,
) {
  const {
    daysInChunk,
    chunkOffset,
    totalStartDate,
    totalEndDate,
    startDate,
    endDate,
    energyflowDataSim,
    energyflowDataSolar,
    applianceTime,
    results,
  } = setupPlanning(energyflowData, chunkOffsetLoop);

  const planningLength = householdPlanning.length;

  for (let dayIterator = 1; dayIterator <= daysInChunk; dayIterator++) { }
}
