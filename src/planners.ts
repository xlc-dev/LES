import { SECONDS_IN_DAY, SECONDS_IN_HOUR, unixToHour } from "./utils";
import { checkApplianceTime, planEnergy, updateEnergy } from "./plannersHelpers";

interface PlanGreedyResult {
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
  dayNumber -= 1;

  while (usage > 1 - Math.random()) {
    let plannedIn = false;

    const bitmapEnergy = appliance.timeDaily[dayNumber].bitmapPlanEnergy;
    const bitmapNoEnergy = appliance.timeDaily[dayNumber].bitmapPlanNoEnergy;

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

    if (!plannedIn) {
      usage = 0;
    }
  }

  return {
    newTotalAvailableEnergy: totalAvailableEnergy,
    newHouseholdEnergy: householdEnergy,
  };
}

/**
 * The simulated annealing planning algorithm.
 *
 * This algorithm requires an already feasible planning as input and will further
 * optimize it. The aim is to find the global optimum by randomly accepting worse
 * solutions, allowing the algorithm to escape local optima.
 *
 * The "temperature" represents both the number of trials available and the probability
 * of accepting a worse solution. Higher temperatures increase the likelihood that a worse
 * solution is accepted.
 *
 * In each iteration, a random household and one of its appliances is selected.
 * The appliance is then attempted to be scheduled at a random time using either solar power
 * or power from the energy provider. If the attempt is infeasible, that attempt is abandoned
 * and a new one is generated.
 *
 * If the attempt is feasible, it is checked to see if it improves the overall solution.
 * If it does, the new configuration is accepted outright. Otherwise, it may still be accepted
 * based on a probability that favors better solutions. If accepted, the schedule is updated;
 * if not, another modification is tried.
 *
 * The process continues until the temperature reaches 0.
 *
 * @param {number} dayIterator - The day iterator.
 * @param {number} planningLength - The total length of the planning period.
 * @param {number[]} currentAvailable - An array representing the currently available energy.
 * @param {number[]} solarProduced - An array representing the solar energy produced.
 * @param {number[]} currentUsed - An array representing the energy currently used.
 * @param {Algo} algo - The algorithm configuration or settings.
 * @param {Household[]} householdPlanning - An array of households involved in the planning.
 * @param {number} startDate - The start date of the simulation.
 */
export function planSimulatedAnnealing(
  dayIterator: number,
  planningLength: number,
  currentAvailable: number[],
  solarProduced: number[],
  currentUsed: number[],
  algo: Algo,
  householdPlanning: Household[],
  startDate: number
): void {
  for (let temperature = 0; temperature < algo.maxTemperature; temperature++) {
    if (currentAvailable.every((value) => value <= 0)) break;

    const effectiveTemperature = 1 - temperature / algo.maxTemperature;
    const householdRandom = Math.floor(Math.random() * planningLength);
    const selectedHousehold = householdPlanning[householdRandom];

    if (!selectedHousehold.appliances?.length) continue;

    const selectedAppliance =
      selectedHousehold.appliances[
        Math.floor(Math.random() * selectedHousehold.appliances.length)
      ];

    const applianceNewStarttime = startDate + Math.floor(Math.random() * 24) * SECONDS_IN_HOUR;
    const hasEnergy = Math.random() < 0.5;
    const getsEnergy = Math.random() < 0.5;

    const timeDaily = selectedAppliance.timeDaily[dayIterator - 1];
    if (!timeDaily) continue;

    const bitmapEnergy = timeDaily.bitmapPlanEnergy;
    const bitmapNoEnergy = timeDaily.bitmapPlanNoEnergy;

    const bitmap = (hasEnergy ? bitmapEnergy : bitmapNoEnergy).toString(2).padStart(24, "0");

    const applianceFrequency = (bitmap.match(/1/g)?.length ?? 0) / selectedAppliance.duration;

    if (applianceFrequency === 0) continue;

    const applianceTimeslot = Math.floor(Math.random() * applianceFrequency);

    // Find old scheduled hour
    let onesInBitmap = 0;
    let applianceOldStarttime: number | null = null;

    for (let position = 0; position < bitmap.length; position++) {
      if (bitmap[position] === "1") {
        onesInBitmap++;
        if (onesInBitmap === applianceTimeslot * selectedAppliance.duration + 1) {
          applianceOldStarttime = position;
          break;
        }
      }
    }

    if (applianceOldStarttime === null) continue;

    if (
      !checkApplianceTime(
        selectedAppliance,
        applianceNewStarttime,
        getsEnergy ? bitmapEnergy : bitmapNoEnergy
      )
    )
      continue;

    const currentUsedNew = [...currentUsed];

    // Update usage calculation
    for (let duration = 0; duration < selectedAppliance.duration; duration++) {
      const oldStartHour = (applianceOldStarttime + duration) % 24;
      const newStartHour = (unixToHour(applianceNewStarttime) + duration) % 24;

      if (hasEnergy) {
        currentUsedNew[oldStartHour] -= selectedAppliance.power / selectedAppliance.duration;
      }

      if (getsEnergy) {
        currentUsedNew[newStartHour] += selectedAppliance.power / selectedAppliance.duration;
      }
    }

    const improvement = currentUsedNew.reduce(
      (acc, used, hour) =>
        acc +
        Math.min(solarProduced[hour], used) -
        Math.min(solarProduced[hour], currentUsed[hour]),
      0
    );

    if (improvement > 0 || Math.exp((3 * improvement) / effectiveTemperature) < Math.random()) {
      const [newBitmapEnergy, newBitmapNoEnergy] = updateEnergy(
        applianceOldStarttime,
        unixToHour(applianceNewStarttime),
        hasEnergy,
        getsEnergy,
        selectedAppliance,
        bitmapEnergy,
        bitmapNoEnergy
      );

      timeDaily.bitmapPlanEnergy = newBitmapEnergy;
      timeDaily.bitmapPlanNoEnergy = newBitmapNoEnergy;
    }
  }
}
