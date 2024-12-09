import { SECONDS_IN_DAY, SECONDS_IN_HOUR, unixToHour } from "./utils";
import { checkApplianceTime, planEnergy } from "./plannersHelpers";

interface PlanGreedyResult {
  applianceTime: ApplianceTimeDaily[];
  newTotalAvailableEnergy: number;
  newHouseholdEnergy: number[][];
}

/**
 * The plan greedy planning algorithm.
 *
 * The function tries to plan an appliance on a given day.
 * How many times an appliance will be planned in on a day is random,
 * determined by its `dailyUsage`. It will be planned in at least
 * `dailyUsage` times rounded down, and possibly another time, which is
 * random based on the value in the decimals.
 *
 * The order for at which time the appliance will be tried is determined
 * by the energy provided, ordered from high to low. This makes it likelier
 * that the first attempts result in as much solar power usage as possible.
 *
 * The ordered times will be checked whether they are possible for the
 * appliance to be planned in to. If so, they will then be planned in, in
 * the `bitmapPlanEnergy`. This signifies that they are planned in using solar
 * power.
 *
 * If no possible time is found, then it will be checked if it can be planned
 * in without solar power and just energy from the national grid. The order
 * for the times here is chronological.
 *
 * If at this point still no possible time is found, the appliance will not be
 * planned in and the search will be aborted. It is possible with this search
 * method that a lower than desired number of usages is planned in.
 *
 * This planning algorithm doesn't try for finding the best solution, but just
 * a decent but quick one.
 *
 * @param {Object} params - The parameters for the greedy planning.
 * @param {number} params.householdIdx - The index of the household.
 * @param {number} params.daysInPlanning - The total number of days in planning.
 * @param {number} params.dayNumberInPlanning - The current day number in planning.
 * @param {number} params.totalAvailableEnergy - The total available energy.
 * @param {number[][]} params.householdEnergy - A 2D array representing household energy usage.
 * @param {Appliance} params.appliance - The appliance being scheduled.
 * @param {Energyflow[]} params.energyflowDay - Array of energy flow data for the day.
 * @param {number} params.totalStartDate - The total start date as a Unix timestamp.
 *
 * @returns {PlanGreedyResult} The result containing updated appliance time, total available energy, and household energy.
 * @throws {Error} If the day is not found or planning fails.
 */
export function planGreedy({
  householdIdx,
  dayNumber,
  totalAvailableEnergy,
  householdEnergy,
  appliance,
  energyflowDay,
  totalStartDate,
}: {
  householdIdx: number;
  dayNumber: number;
  totalAvailableEnergy: number;
  householdEnergy: number[][];
  appliance: Appliance;
  energyflowDay: Energyflow["data"];
  totalStartDate: number;
}): PlanGreedyResult {
  let usage = appliance.dailyUsage;

  const bitmapEnergy = appliance.timeDaily[dayNumber].bitmapPlanEnergy;
  const bitmapNoEnergy = appliance.timeDaily[dayNumber].bitmapPlanNoEnergy;

  while (usage > 0) {
    let plannedIn = false;

    // Attempt to plan using solar energy
    if (totalAvailableEnergy > 0) {
      for (const flow of energyflowDay) {
        const timestamp = Number(flow.timestamp);
        const hour = unixToHour(timestamp);

        if (plannedIn || householdEnergy[hour][householdIdx] < 0) {
          break;
        }

        if (!checkApplianceTime(appliance, timestamp, bitmapEnergy)) {
          continue;
        }

        appliance.timeDaily[dayNumber].bitmapPlanEnergy = planEnergy(
          hour,
          appliance.duration,
          bitmapEnergy
        );

        for (let i = 0; i < appliance.duration; i++) {
          const energyUsed = Math.min(
            householdEnergy[hour][householdIdx],
            appliance.power / appliance.duration
          );

          totalAvailableEnergy -= energyUsed;
          householdEnergy[hour][householdIdx] -= energyUsed;
        }

        plannedIn = true;
        usage -= 1;
        break;
      }
    }

    // If unable to plan using solar energy, attempt to plan using the national grid
    if (!plannedIn) {
      for (let i = 0; i < 24; i++) {
        const currentTime = totalStartDate + dayNumber * SECONDS_IN_DAY + i * SECONDS_IN_HOUR;

        if (!checkApplianceTime(appliance, currentTime, bitmapNoEnergy)) {
          continue;
        }

        appliance.timeDaily[dayNumber].bitmapPlanNoEnergy = planEnergy(
          unixToHour(currentTime),
          appliance.duration,
          bitmapNoEnergy
        );

        plannedIn = true;
        usage -= 1;
        break;
      }
    }

    // If unable to plan in either way, abort planning
    if (!plannedIn) {
      break;
    }
  }

  return {
    applianceTime: appliance.timeDaily,
    newTotalAvailableEnergy: totalAvailableEnergy,
    newHouseholdEnergy: householdEnergy,
  };
}
