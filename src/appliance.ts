import { ApplianceTypes, ApplianceDays, roundTo, shuffleArray } from "./utils";
import { createTimeWindow, setAvailability } from "./timewindow";

// Utility function to get typical usage hours for appliances
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

// Convert availability array to bitmap (24-bit number)
function generateAvailability(name: ApplianceTypes, dailyUsage: number): number {
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

// Pick random hours for appliance usage based on possible hours
function pickRandomHours(possibleHours: number[], count: number): number[] {
  const shuffled = shuffleArray(possibleHours);
  return shuffled.slice(0, count);
}

// Create an appliance based on given data
function createAppliance(
  name: ApplianceTypes,
  householdSize: number,
  duration: number,
  availabilityMapping: Record<string, number>,
  frequencyMapping: Record<string, number>,
  energyPattern: number,
  usageRandom: number,
  usageMulti: number,
  usageAddition: number
): Appliance | null {
  const availabilityChance = availabilityMapping[String(householdSize)] || 0;
  if (Math.random() < availabilityChance) {
    const freq = frequencyMapping[String(householdSize)] || 0;
    const dailyUsage = freq * energyPattern;
    const power = roundTo(usageRandom * usageMulti + usageAddition, 1);

    let availability = generateAvailability(name, dailyUsage);

    // Now, apply time windows
    const daysOfWeek: ApplianceDays[] = [
      ApplianceDays.MONDAY,
      ApplianceDays.TUESDAY,
      ApplianceDays.WEDNESDAY,
      ApplianceDays.THURSDAY,
      ApplianceDays.FRIDAY,
    ]; // For example
    daysOfWeek.forEach((day) => {
      const timeWindow = createTimeWindow(day, name);
      availability = setAvailability(availability, timeWindow.bitmap_window, true);
    });

    return {
      name,
      power,
      duration,
      dailyUsage: roundTo(dailyUsage, 3),
      availability,
    };
  }
  return null;
}

function createDishwasher(householdSize: number, invNorm: number): Appliance | null {
  const available = { "1": 0.47, "2": 0.76, "3": 0.81, "4": 0.89, "5": 0.83 };
  const frequency = { "1": 1.0, "2": 1.2, "3": 1.5, "4": 1.7, "5": 2.0 };
  return createAppliance(
    ApplianceTypes.DISHWASHER,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8
  );
}

function createWashingMachine(householdSize: number, invNorm: number): Appliance | null {
  const available = { "1": 0.34, "2": 0.76, "3": 0.79, "4": 0.85, "5": 0.79 };
  const frequency = { "1": 1.2, "2": 1.5, "3": 1.7, "4": 1.9, "5": 2.3 };
  return createAppliance(
    ApplianceTypes.WASHING_MACHINE,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8
  );
}

function createTumbleDryer(householdSize: number, invNorm: number): Appliance | null {
  const available = { "1": 0.34, "2": 0.79, "3": 0.81, "4": 0.88, "5": 0.84 };
  const frequency = { "1": 1.0, "2": 1.2, "3": 1.5, "4": 1.6, "5": 1.9 };
  return createAppliance(
    ApplianceTypes.TUMBLE_DRYER,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8
  );
}

function createStove(householdSize: number, invNorm: number): Appliance | null {
  const available = { "1": 0.74, "2": 0.85, "3": 0.88, "4": 0.91, "5": 0.87 };
  const frequency = { "1": 1.2, "2": 1.4, "3": 1.7, "4": 1.9, "5": 2.1 };
  return createAppliance(
    ApplianceTypes.STOVE,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8
  );
}

function createElectricVehicle(householdSize: number, invNorm: number): Appliance | null {
  const available = { "1": 0.2, "2": 0.35, "3": 0.4, "4": 0.5, "5": 0.6 };
  const frequency = { "1": 1.5, "2": 2.0, "3": 2.5, "4": 3.0, "5": 3.5 };
  return createAppliance(
    ApplianceTypes.ELECTRIC_VEHICLE,
    householdSize,
    1,
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8
  );
}

export function generateAppliancesForHousehold(
  householdSize: number,
  invNorm: number
): Appliance[] {
  const appliances: (Appliance | null)[] = [];
  appliances.push(createDishwasher(householdSize, invNorm));
  appliances.push(createWashingMachine(householdSize, invNorm));
  appliances.push(createTumbleDryer(householdSize, invNorm));
  appliances.push(createStove(householdSize, invNorm));
  appliances.push(createElectricVehicle(householdSize, invNorm));

  return appliances.filter((appliance): appliance is Appliance => appliance !== null);
}
