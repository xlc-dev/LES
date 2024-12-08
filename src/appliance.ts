import {
  ApplianceTypes,
  ApplianceDays,
  MAX_DAYS_IN_YEAR,
  roundTo,
  shuffleArray,
} from "./utils";
import { createTimeWindow, setAvailability } from "./timewindow";

/**
 * Get typical usage hours for appliances.
 *
 * @param {ApplianceTypes} applianceName - The appliance type.
 * @returns {number[]} An array of typical usage hours.
 */
function getTypicalUsageHours(applianceName: ApplianceTypes): number[] {
  switch (applianceName) {
    case ApplianceTypes.WASHING_MACHINE:
      return [6, 7, 18, 19];
    case ApplianceTypes.TUMBLE_DRYER:
      return [7, 8, 19, 20];
    case ApplianceTypes.STOVE:
      return [12, 13, 18, 19];
    case ApplianceTypes.DISHWASHER:
      return [19, 20];
    default:
      return [];
  }
}

/**
 * Picks random hours for appliance usage based on possible hours.
 *
 * @param {number[]} possibleHours - The array of possible hours.
 * @param {number} count - The number of hours to pick.
 * @returns {number[]} An array of randomly picked hours.
 */
function pickRandomHours(possibleHours: number[], count: number): number[] {
  const shuffled = shuffleArray(possibleHours);
  return shuffled.slice(0, count);
}

/**
 * Generates an empty appliance time plan.
 *
 * @returns {ApplianceTimeDaily[]} An array of appliance time plans.
 */
function generateEmptyTimePlan(): ApplianceTimeDaily[] {
  const emptyPlan: ApplianceTimeDaily[] = [];

  for (let day = 0; day < MAX_DAYS_IN_YEAR; day++) {
    emptyPlan.push({
      day,
      bitmapWindow: 0,
      bitmapPlanEnergy: 0,
      bitmapPlanNoEnergy: 0,
    });
  }

  return emptyPlan;
}

/**
 * Converts an availability array to a bitmap (24-bit number).
 *
 * @param {ApplianceTypes} name - The appliance type.
 * @param {number} dailyUsage - The daily usage in hours.
 * @returns {number} The availability bitmap.
 */
function generateAvailability(
  name: ApplianceTypes,
  dailyUsage: number,
): number {
  const availability = Array(24).fill(false);
  const typicalHours = getTypicalUsageHours(name);
  const baseUsage = Math.floor(dailyUsage);
  let totalUsage = baseUsage + (Math.random() < dailyUsage - baseUsage ? 1 : 0);
  totalUsage = Math.max(1, totalUsage); // Ensure at least 1 hour of usage

  const hoursToPick = Math.min(totalUsage, typicalHours.length);
  const usageTimes = pickRandomHours(typicalHours, hoursToPick);

  usageTimes.forEach((hour) => (availability[hour] = true));

  // Convert availability array to bitmap
  let bitmap = 0;
  availability.forEach((isAvailable, index) => {
    if (isAvailable) {
      bitmap |= 1 << index;
    }
  });
  return bitmap;
}

/**
 * Creates an appliance based on given data.
 *
 * @param {number} id - The ID of the household.
 * @param {ApplianceTypes} name - The appliance type.
 * @param {number} householdSize - The size of the household.
 * @param {number} duration - The duration of usage in hours.
 * @param {Record<string, number>} availabilityMapping - The availability mapping based on household size.
 * @param {Record<string, number>} frequencyMapping - The frequency mapping based on household size.
 * @param {number} energyPattern - The energy pattern value.
 * @param {number} usageRandom - The random usage factor.
 * @param {number} usageMulti - The usage multiplier.
 * @param {number} usageAddition - The usage addition.
 * @returns {Appliance | null} The created appliance or null if not available.
 */
function createAppliance(
  id: number,
  name: ApplianceTypes,
  householdSize: number,
  duration: number,
  availabilityMapping: Record<string, number>,
  frequencyMapping: Record<string, number>,
  energyPattern: number,
  usageRandom: number,
  usageMulti: number,
  usageAddition: number,
): Appliance | null {
  const availabilityChance = availabilityMapping[String(householdSize)] || 0;
  if (Math.random() < availabilityChance) {
    const freq = frequencyMapping[String(householdSize)] || 0;
    const dailyUsage = freq * energyPattern;
    const power = roundTo(usageRandom * usageMulti + usageAddition, 1);

    let availability = generateAvailability(name, dailyUsage);

    const daysOfWeek: ApplianceDays[] = [
      ApplianceDays.MONDAY,
      ApplianceDays.TUESDAY,
      ApplianceDays.WEDNESDAY,
      ApplianceDays.THURSDAY,
      ApplianceDays.FRIDAY,
    ];
    daysOfWeek.forEach((day) => {
      const timeWindow = createTimeWindow(day, name);
      availability = setAvailability(availability, timeWindow, true);
    });

    // Generate time dailies for the full year
    const timeDaily: ApplianceTimeDaily[] = generateEmptyTimePlan();
    daysOfWeek.forEach((day) => {
      timeDaily.forEach((daily) => {
        if (daily.day === day) {
          daily.bitmapWindow = availability;
        }
      });
    });

    return {
      id: id,
      name,
      power,
      duration,
      dailyUsage: roundTo(dailyUsage, 3),
      timeDaily,
    };
  }
  return null;
}
/**
 * Creates a dishwasher appliance.
 *
 * @param {number} id - The ID of the household.
 * @param {number} householdSize - The size of the household.
 * @param {number} invNorm - The inverse normal value.
 * @returns {Appliance | null} The created dishwasher appliance or null.
 */
function createDishwasher(
  id: number,
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.47, "2": 0.76, "3": 0.81, "4": 0.89, "5": 0.83 };
  const frequency = { "1": 1.0, "2": 1.2, "3": 1.5, "4": 1.7, "5": 2.0 };
  return createAppliance(
    id,
    ApplianceTypes.DISHWASHER,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8,
  );
}

/**
 * Creates a washing machine appliance.
 *
 * @param {number} id - The ID of the household.
 * @param {number} householdSize - The size of the household.
 * @param {number} invNorm - The inverse normal value.
 * @returns {Appliance | null} The created washing machine appliance or null.
 */
function createWashingMachine(
  id: number,
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.34, "2": 0.76, "3": 0.79, "4": 0.85, "5": 0.79 };
  const frequency = { "1": 1.2, "2": 1.5, "3": 1.7, "4": 1.9, "5": 2.3 };
  return createAppliance(
    id,
    ApplianceTypes.WASHING_MACHINE,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8,
  );
}

/**
 * Creates a tumble dryer appliance.
 *
 * @param {number} id - The ID of the household.
 * @param {number} householdSize - The size of the household.
 * @param {number} invNorm - The inverse normal value.
 * @returns {Appliance | null} The created tumble dryer appliance or null.
 */
function createTumbleDryer(
  id: number,
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.34, "2": 0.79, "3": 0.81, "4": 0.88, "5": 0.84 };
  const frequency = { "1": 1.0, "2": 1.2, "3": 1.5, "4": 1.6, "5": 1.9 };
  return createAppliance(
    id,
    ApplianceTypes.TUMBLE_DRYER,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8,
  );
}

/**
 * Creates a stove appliance.
 *
 * @param {number} id - The ID of the household.
 * @param {number} householdSize - The size of the household.
 * @param {number} invNorm - The inverse normal value.
 * @returns {Appliance | null} The created stove appliance or null.
 */
function createStove(
  id: number,
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.74, "2": 0.85, "3": 0.88, "4": 0.91, "5": 0.87 };
  const frequency = { "1": 1.2, "2": 1.4, "3": 1.7, "4": 1.9, "5": 2.1 };
  return createAppliance(
    id,
    ApplianceTypes.STOVE,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8,
  );
}

/**
 * Creates an electric vehicle appliance.
 *
 * @param {number} id - The ID of the household.
 * @param {number} householdSize - The size of the household.
 * @param {number} invNorm - The inverse normal value.
 * @returns {Appliance | null} The created electric vehicle appliance or null.
 */
function createElectricVehicle(
  id: number,
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.2, "2": 0.35, "3": 0.4, "4": 0.5, "5": 0.6 };
  const frequency = { "1": 1.5, "2": 2.0, "3": 2.5, "4": 3.0, "5": 3.5 };
  return createAppliance(
    id,
    ApplianceTypes.ELECTRIC_VEHICLE,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8,
  );
}

/**
 * Generates appliances for a household based on size and inverse normal value.
 *
 * @param {number} id - The ID of the household.
 * @param {number} householdSize - The size of the household.
 * @param {number} invNorm - The inverse normal value.
 * @returns {Appliance[]} An array of generated appliances.
 */
export function generateAppliancesForHousehold(
  id: number,
  householdSize: number,
  invNorm: number,
): Appliance[] {
  const appliances: (Appliance | null)[] = [];
  appliances.push(createDishwasher(id, householdSize, invNorm));
  appliances.push(createWashingMachine(id, householdSize, invNorm));
  appliances.push(createTumbleDryer(id, householdSize, invNorm));
  appliances.push(createStove(id, householdSize, invNorm));
  appliances.push(createElectricVehicle(id, householdSize, invNorm));

  return appliances.filter(
    (appliance): appliance is Appliance => appliance !== null,
  );
}
