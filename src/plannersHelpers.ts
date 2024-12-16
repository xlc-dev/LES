import { SECONDS_IN_DAY, unixToHour } from "./utils";

/**
 * Calculates the appliance duration bitmask based on duration and hour.
 *
 * @param {number} duration - The duration of the appliance in hours.
 * @param {number} hour - The starting hour (0-23) when the appliance is planned.
 * @returns {number} The calculated bitmask representing the appliance's planned duration.
 * @throws {Error} If duration or hour is out of valid range.
 */
function calculateApplianceDurationBit(duration: number, hour: number): number {
  if (hour < 0 || hour > 23) {
    throw new Error("Hour must be between 0 and 23.");
  }

  if (duration <= 0) {
    throw new Error("Duration must be a positive integer.");
  }

  const shift = 24 - hour - duration;
  const base = 2 ** duration - 1;

  if (shift >= 0) {
    return base << shift;
  } else {
    return base >> -shift;
  }
}

/**
 * Internal function that calculates the energy efficiency of a day.
 *
 * This is done by checking for each house how much energy they produce and
 * use themselves at a certain time, and how much of the available solar
 * energy in total gets used at a certain time.
 *
 * The self efficiency is how much energy all of the houses combined use of
 * their own generated solar power.
 *
 * The total efficiency is how much energy all of the houses combined use of
 * all the available generated solar power.
 *
 * @param {number} solarPanelsFactor - The solar panels factor.
 * @param {Energyflow[]} energyFlow - The list of energy flow data.
 * @param {Household[]} planning - The list of household planning data.
 * @param {ApplianceTimeDaily[]} applianceBitmapPlan - The appliance bitmap plan for the day.
 * @param {CostModel} costmodel - The cost model object.
 *
 * @returns {[number, number, number, number, number]} A tuple containing:
 *   - previousEfficiency: The efficiency of self-generated energy used.
 *   - currentEfficiency: The efficiency of total available solar energy used.
 *   - energyPrice: The energy price calculated from the cost model.
 *   - costSavings: The cost savings based on the difference in efficiency.
 *   - totalEnergyProduced: The total amount of energy produced.
 */
function energyEfficiencyDay(
  solarPanelsFactor: number,
  energyFlow: Energyflow["data"],
  planning: Household[],
  applianceBitmapPlan: ApplianceTimeDaily[],
  costmodel: CostModel
): [number, number, number, number, number] {
  const totalYield = planning.reduce((sum, household) => sum + household.solarYieldYearly, 0);

  const solarEnergyProduced = energyFlow.map(
    (ef) => (ef.solar_produced * totalYield) / solarPanelsFactor
  );

  const solarEnergyUsedSelf: number[] = new Array(24).fill(0);
  const solarEnergyUsedTotal: number[] = new Array(24).fill(0);

  for (const household of planning) {
    const householdEnergyAvailable = energyFlow.map(
      (ef) => (ef.solar_produced * household.solarYieldYearly) / solarPanelsFactor
    );

    if (household.appliances) {
      for (const appliance of household.appliances) {
        const bitmap = applianceBitmapPlan[appliance.id - 1].bitmapPlanEnergy.padStart(24, "0");

        for (let hour = 0; hour < 24; hour++) {
          if (bitmap[hour] === "1") {
            const powerPerHour = appliance.power / appliance.duration;
            const usedEnergy = Math.min(powerPerHour, householdEnergyAvailable[hour]);

            solarEnergyUsedTotal[hour] += powerPerHour;
            solarEnergyUsedSelf[hour] += usedEnergy;
            householdEnergyAvailable[hour] -= usedEnergy;
          }
        }
      }
    }
  }

  const previousTotalUsage = solarEnergyUsedSelf.map((usedSelf, index) =>
    Math.min(usedSelf, solarEnergyProduced[index])
  );

  const currentTotalUsage = solarEnergyUsedTotal.map((usedTotal, index) =>
    Math.min(usedTotal, solarEnergyProduced[index])
  );

  const sumProduced = solarEnergyProduced.reduce((sum, val) => sum + val, 0);

  const previousEfficiency =
    sumProduced > 0 ? previousTotalUsage.reduce((sum, val) => sum + val, 0) / sumProduced : 0;
  const currentEfficiency =
    sumProduced > 0 ? currentTotalUsage.reduce((sum, val) => sum + val, 0) / sumProduced : 0;

  let ratio = previousEfficiency;

  if (costmodel.name === "Fixed Price") {
    ratio = costmodel.fixedPriceRatio;
  }

  let energyPrice: number;

  if (costmodel.name === "Fixed Price" || costmodel.name === "TEMO") {
    energyPrice = costmodel.priceNetworkBuyConsumer;
  } else {
    try {
      const localVars: any = {};
      const algoWithParams = costmodel.algorithm.replace(
        "cost_model()",
        `cost_model(\n    buy_consumer=${costmodel.priceNetworkBuyConsumer},\n    sell_consumer=${costmodel.priceNetworkSellConsumer},\n    ratio=${ratio}\n)`
      );
      eval(algoWithParams);
      energyPrice = localVars.cost_model();
    } catch (e) {
      console.error("Error in algorithm:", e);
      energyPrice = costmodel.priceNetworkBuyConsumer;
    }
  }

  if (solarEnergyUsedSelf.reduce((sum, val) => sum + val, 0) <= 0) {
    energyPrice = costmodel.priceNetworkBuyConsumer;
  }

  const costSavings =
    (currentTotalUsage.reduce((sum, val) => sum + val, 0) -
      previousTotalUsage.reduce((sum, val) => sum + val, 0)) *
    (costmodel.priceNetworkBuyConsumer - energyPrice);

  return [previousEfficiency, currentEfficiency, energyPrice, costSavings, sumProduced];
}

/**
 * Checks whether an appliance can be planned in at a certain time.
 *
 * This is done by retrieving the correct daily bitmap window and then
 * comparing that to the new planned-in time. Also, the existing planning
 * is checked against the newly planned-in time.
 *
 * @param {Appliance} appliance - The appliance to check.
 * @param {number} unix - The Unix timestamp representing the time to check (in seconds).
 * @param {number} applianceBitmapPlan - The current bitmap plan for the appliance.
 * @returns {boolean} Returns true if the appliance can be planned at the given time, otherwise false.
 */
export function checkApplianceTime(
  appliance: Appliance,
  unix: number,
  applianceBitmapPlan: number
): boolean {
  const date = new Date(unix * 1000);
  const dayNumber = (date.getUTCDay() + 6) % 7; // Adjust Sunday (0) to match ApplianceDays.SUNDAY (6)

  const bitmapWindow = appliance.timeDaily.find((w) => w.day === dayNumber)?.bitmapWindow;

  if (bitmapWindow === undefined) {
    return false;
  }

  const hour = unixToHour(unix);
  const applianceDurationBit = (1 << appliance.duration) - 1;
  const shift = 24 - hour - appliance.duration;
  const currentTimeWindow =
    shift >= 0 ? applianceDurationBit << shift : applianceDurationBit >> -shift;

  if ((bitmapWindow & currentTimeWindow) !== currentTimeWindow) {
    return false;
  }

  if ((currentTimeWindow & applianceBitmapPlan) !== 0) {
    return false;
  }

  return true;
}

/**
 * Returns the updated bitmap window with the new energy usage.
 *
 * @param {number} hour - The hour of the day.
 * @param {number} duration - The duration of the appliance.
 * @param {number} bitmap - The bitmap representing the appliance's energy usage.
 *
 * @returns {number} The updated bitmap window.
 */
export function planEnergy(hour: number, duration: number, bitmap: number): number {
  const applianceDurationBit = calculateApplianceDurationBit(duration, hour);
  return applianceDurationBit | bitmap;
}

/**
 * Calculates and updates the results for a specific day in the planning.
 *
 * This function uses the helper function energyEfficiencyDay to determine
 * the energy efficiency for a given day and updates the results array accordingly.
 *
 * @param {Object} params - The parameters for the function.
 * @param {number} params.dayIterator - The current iteration of the day.
 * @param {number} params.dayNumberInPlanning - The day number in the planning.
 * @param {Array<Array<number>>} params.results - A 2D array of results to be updated.
 * @param {Energyflow} params.energyflow - The energy flow object containing solar panel factor and energy flow data.
 * @param {CostModel} params.costmodel - The cost model object to calculate costs.
 * @param {Array<ApplianceTimeDaily>} params.applianceTime - An array of appliance time data for each day.
 * @param {Array<Energyflow>} params.energyflowDaySim - An array representing the energy flow simulation data for each day.
 * @param {Array<Household>} params.householdPlanning - An array representing the household planning for each day.
 *
 * @returns {Array<Array<number>>} The updated results array.
 */
export function writeResults({
  dayIterator,
  dayNumberInPlanning,
  results,
  energyflow,
  costmodel,
  applianceTime,
  energyflowDaySim,
  householdPlanning,
}: {
  date: number;
  dayIterator: number;
  dayNumberInPlanning: number;
  results: number[][];
  energyflow: Energyflow;
  twinworld: TwinWorld;
  costmodel: CostModel;
  applianceTime: ApplianceTimeDaily[];
  energyflowDaySim: Energyflow["data"];
  householdPlanning: Household[];
}): number[][] {
  const tempResult = energyEfficiencyDay(
    energyflow.solarPanelsFactor,
    energyflowDaySim,
    householdPlanning,
    applianceTime.filter((el) => el.day === dayNumberInPlanning),
    costmodel
  );

  // console.log(tempResult);

  if (dayIterator === 0) {
    results[dayIterator - 1][5] = (tempResult[0] - results[dayIterator - 1][0]) * tempResult[4];
    results[dayIterator - 1][6] = (tempResult[1] - results[dayIterator - 1][1]) * tempResult[4];
  } else {
    results[dayIterator - 1][5] =
      (tempResult[0] - results[dayIterator - 1][0]) * tempResult[4] + results[dayIterator - 2][0];
    results[dayIterator - 1][6] =
      (tempResult[1] - results[dayIterator - 1][1]) * tempResult[4] + results[dayIterator - 2][1];
  }

  for (let i = 0; i < 5; i++) {
    if (tempResult[i] > results[dayIterator - 1][i]) {
      results[dayIterator - 1][i] = tempResult[i];
    }
  }

  return results;
}
