import { HOURS_IN_WEEK, SECONDS_IN_DAY, SECONDS_IN_HOUR, unixToHour } from "./utils";

import { planGreedy } from "./planners";

import { writeResults } from "./plannersHelpers";

/**
 * Calculates the start and end dates for the energyflow data.
 *
 * @param {Energyflow} energyflow - The energyflow data.
 * @returns {{ totalStartDate: number | null, totalEndDate: number | null }} The start and end dates as numbers.
 */
function getEnergyflowStartEndDate(energyflow: Energyflow): {
  totalStartDate: number | null;
  totalEndDate: number | null;
} {
  if (energyflow.data.length === 0) {
    return { totalStartDate: null, totalEndDate: null };
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
    totalStartDate: minTimestamp,
    totalEndDate: maxTimestamp,
  };
}

/**
 * Calculates the start and end dates for the chunk of energyflow data.
 *
 * @param {Object} params - The parameters for calculating chunk dates.
 * @param {Energyflow} params.energyflow - The energyflow data.
 * @param {Energyflow["data"]} params.energyflowDataSim - The simulated energyflow data.
 * @returns {{
 *   totalStartDate: number,
 *   totalEndDate: number,
 *   startDate: number,
 *   endDate: number,
 *   daysInChunk: number
 *   daysInPlanning: number
 * }} The calculated dates and days in the chunk.
 * @throws {Error} If there is no data available to calculate dates.
 */
function getEnergyflowChunkStartEndDates({
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
  daysInPlanning: number;
} {
  const { totalStartDate, totalEndDate } = getEnergyflowStartEndDate(energyflow);
  if (!totalStartDate || !totalEndDate) {
    throw new Error("No data available to calculate dates.");
  }

  if (energyflowDataSim.length === 0) {
    throw new Error("No simulation data available to calculate dates.");
  }

  const startDate = Number(energyflowDataSim[0].timestamp);
  const endDate =
    Number(energyflowDataSim[energyflowDataSim.length - 1].timestamp) -
    SECONDS_IN_DAY +
    SECONDS_IN_HOUR;

  const daysInChunk = Math.floor((endDate - startDate) / SECONDS_IN_DAY) + 1;
  const daysInPlanning = Math.floor((totalEndDate - totalStartDate) / SECONDS_IN_DAY) + 1;

  return {
    totalStartDate,
    totalEndDate,
    startDate,
    endDate,
    daysInChunk,
    daysInPlanning,
  };
}

/**
 * Get all energyflow data sorted by timestamp.
 *
 * @param {Object} options - The options for retrieving energy flow data.
 * @param {Array<{
 *   timestamp: string;
 *   energy_used: number;
 *   solar_produced: number;
 * }>} options.data - The energy flow data.
 * @param {number} [options.limit=HOURS_IN_WEEK] - The maximum number of records to return.
 * @param {number} [options.offset=0] - The offset for the data retrieval.
 * @returns {Array<{
 *   timestamp: string;
 *   energy_used: number;
 *   solar_produced: number;
 * }>} An array of energy flow data sorted by timestamp.
 */
function getAllEnergyflowSortedByTimestamp({
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
}): Array<{
  timestamp: string;
  energy_used: number;
  solar_produced: number;
}> {
  return data
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
    .slice(offset, offset + limit);
}

/**
 * Get all energyflow data sorted by solar produced.
 *
 * @param {Object} options - The options for retrieving energy flow data.
 * @param {Array<{
 *   timestamp: string;
 *   energy_used: number;
 *   solar_produced: number;
 * }>} options.data - The energy flow data.
 * @param {number} [options.limit=HOURS_IN_WEEK] - The maximum number of records to return.
 * @param {number} [options.offset=0] - The offset for the data retrieval.
 * @returns {Array<{
 *   timestamp: string;
 *   energy_used: number;
 *   solar_produced: number;
 * }>} An array of energy flow data sorted by solar produced.
 */
function getEnergyflowBySolarProduced({
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
}): Array<{
  timestamp: string;
  energy_used: number;
  solar_produced: number;
}> {
  return data
    .filter((el, i) => el.solar_produced > 0 && i >= offset && i < offset + limit)
    .sort((a, b) => b.solar_produced - a.solar_produced);
}

/**
 * Sets up the planning with the given energyflow data and chunk offset.
 *
 * @param {Energyflow} energyflowDataStepper - The energyflow data.
 * @param {number} chunkOffset - The chunk offset.
 * @returns {{
 *   daysInChunk: number,
 *   daysInPlanning: number,
 *   chunkOffset: number,
 *   totalStartDate: number,
 *   startDate: number,
 *   endDate: number,
 *   energyflowDataSim: Energyflow["data"],
 *   energyflowDataSolar: Energyflow["data"],
 *   results: number[][]
 * }} The setup planning data.
 */
function setupPlanning(
  energyflowDataStepper: Energyflow,
  chunkOffset: number
): {
  daysInChunk: number;
  daysInPlanning: number;
  totalStartDate: number;
  startDate: number;
  endDate: number;
  energyflowDataSim: Energyflow["data"];
  energyflowDataSolar: Energyflow["data"];
  results: number[][];
} {
  const energyflowDataSolar = getEnergyflowBySolarProduced({
    data: energyflowDataStepper.data,
    offset: chunkOffset * 24,
  });

  const energyflowDataSim = getAllEnergyflowSortedByTimestamp({
    data: energyflowDataStepper.data,
    offset: chunkOffset * 24,
  });

  const {
    totalStartDate,
    totalEndDate: _,
    startDate,
    endDate,
    daysInChunk,
    daysInPlanning,
  } = getEnergyflowChunkStartEndDates({
    energyflow: energyflowDataStepper,
    energyflowDataSim,
  });

  const results: number[][] = Array.from({ length: daysInChunk }, () => Array(7).fill(0.0));

  return {
    daysInChunk,
    daysInPlanning,
    totalStartDate,
    startDate,
    endDate,
    energyflowDataSim,
    energyflowDataSolar,
    results,
  };
}

/**
 * Processes the energyflow data and household planning for a given chunk offset.
 *
 * @param {Energyflow} energyflowData - The energyflow data.
 * @param {Household[]} householdPlanning - The household planning data.
 * @param {CostModel} costModel - The selected cost model.
 * @param {string} algo - The selected algorithm.
 * @param {number} chunkOffsetLoop - The chunk offset for the loop.
 * @returns {{
 *   results: number[][],
 *   timeDaily: number[],
 *   daysInPlanning: number,
 *   totalStartDate: number,
 *   endDate: number
 * }} The results and time daily data.
 */
export function loop(
  energyflowData: Energyflow,
  householdPlanning: Household[],
  costModel: CostModel,
  algo: Algo,
  chunkOffsetLoop: number
): {
  results: number[][];
  timeDaily: ApplianceTimeDaily[];
  daysInPlanning: number;
  totalStartDate: number;
  endDate: number;
} {
  const {
    daysInChunk,
    daysInPlanning,
    totalStartDate,
    startDate,
    endDate,
    energyflowDataSim,
    energyflowDataSolar,
    results,
  } = setupPlanning(energyflowData, chunkOffsetLoop);

  let lastResults = results;
  const planningLength = householdPlanning.length;

  for (let dayIterator = 1; dayIterator <= daysInChunk; dayIterator++) {
    const dayNumberInPlanning =
      Math.floor((startDate - totalStartDate) / SECONDS_IN_DAY) + dayIterator;
    // const date = startDate + dayNumberInPlanning * SECONDS_IN_DAY;
    const energyflowDay = energyflowDataSolar.filter(
      (el) => Math.floor((Number(el.timestamp) - startDate) / SECONDS_IN_DAY) === dayIterator - 1
    );

    let householdEnergy = Array.from({ length: 24 }, () =>
      Array.from({ length: planningLength }, () => 0.0)
    );

    let totalAvailableEnergy = 0.0;

    householdPlanning.forEach((household, householdIdx) => {
      if (household.solarPanels <= 0) {
        return;
      }
      energyflowDay.forEach((flow) => {
        const hour = unixToHour(Number(flow.timestamp));
        const potentialEnergy =
          (flow.solar_produced * household.solarYieldYearly) / energyflowData.solarPanelsFactor -
          (flow.energy_used * 0.8 * household.energyUsage) / energyflowData.energyUsageFactor;

        householdEnergy[hour][householdIdx] += potentialEnergy;
        totalAvailableEnergy += potentialEnergy;
      });
    });

    if (algo.name === "Greedy Planning" || algo.name === "Simulated Annealing") {
      householdPlanning.forEach((household, householdIdx) => {
        household.appliances?.forEach((appliance) => {
          const { newApplianceTime, newTotalAvailableEnergy, newHouseholdEnergy } = planGreedy({
            householdIdx: householdIdx,
            dayNumber: dayNumberInPlanning,
            totalAvailableEnergy: totalAvailableEnergy,
            householdEnergy: householdEnergy,
            appliance: appliance,
            energyflowDay: energyflowDay,
            totalStartDate: totalStartDate,
          });

          totalAvailableEnergy = newTotalAvailableEnergy;
          appliance.timeDaily = newApplianceTime;
          householdEnergy = newHouseholdEnergy;
        });
      });
    }

    const currentUsed = Array(24).fill(0.0);
    const solarProduced = Array(24).fill(0.0);
    const currentAvailable = Array(24).fill(0.0);

    const energyflowDaySim = energyflowDataSim.filter(
      (el) =>
        dayNumberInPlanning ===
        Math.floor((Number(el.timestamp) - totalStartDate) / SECONDS_IN_DAY) + 1
    );

    const totalYield = householdPlanning.reduce(
      (acc, household) => acc + household.solarYieldYearly,
      0
    );

    for (let hour = 0; hour < 24; hour++) {
      const hourEnergy = energyflowDaySim
        .filter((el) => unixToHour(Number(el.timestamp)) === hour)
        .reduce((acc, el) => acc + el.solar_produced, 0);

      solarProduced[hour] = (hourEnergy * totalYield) / energyflowData.solarPanelsFactor;
      currentAvailable[hour] = solarProduced[hour] - currentUsed[hour];
    }

    const newResults = writeResults(
      dayIterator,
      results,
      energyflowData,
      costModel,
      energyflowDaySim,
      householdPlanning
    );
    lastResults = newResults;

    if (totalAvailableEnergy <= 0) {
      continue;
    }

    if (algo.name === "Simulated Annealing") {
      // planSimulatedAnnealing();

      const newResults = writeResults(
        dayIterator,
        results,
        energyflowData,
        costModel,
        energyflowDaySim,
        householdPlanning
      );
      lastResults = newResults;
    }

    if (algo.name !== "Simulated Annealing" && algo.name !== "Greedy Planning") {
      const context = { totalAvailableEnergy };

      try {
        // Create a new function with 'context' as a parameter.
        // NOTE: Yes, this is not secure, but since this is only a client side application,
        // I don't think it matters. Now you are able to execute whatever JS code you want,
        // making it very powerful for the user.
        const executeAlgorithm = new Function(
          "context",
          `
      ${algo.algorithm}
      // Ensure that run is called within this scope
      if (typeof run === 'function') {
        run(context);
      } else {
        throw new Error("The algorithm string does not define a run() function.");
      }
    `
        );

        executeAlgorithm(context);

        totalAvailableEnergy = context.totalAvailableEnergy;
      } catch (error) {
        console.error(`Error executing algorithm: ${error}`);
      }
    }
  }

  const startDay = Math.floor((startDate - totalStartDate) / SECONDS_IN_DAY) + 1;

  let timeDaily: ApplianceTimeDaily[] = [];
  householdPlanning.forEach((household) => {
    household.appliances?.forEach((appliance) => {
      const applianceTime = appliance.timeDaily.filter(
        (el) => el.day >= startDay && el.day < startDay + daysInChunk
      );
      timeDaily.push(applianceTime);
    });
  });

  return {
    results: lastResults,
    timeDaily,
    daysInPlanning,
    totalStartDate,
    endDate,
  };
}
