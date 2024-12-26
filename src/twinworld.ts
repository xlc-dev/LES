import { getRandomInt, randomNormal } from "./utils";
import { generateAppliancesForHousehold } from "./appliance";

/* Stoate the last household ID */
let lastHouseholdId = 0;

/**
 * Generates a unique household ID.
 *
 * @returns {number} A unique household ID.
 */
export function generateHouseholdId(): number {
  return ++lastHouseholdId;
}

/**
 * Default energy usage values based on household size.
 */
const defaultEnergyUsage: Record<string, number> = {
  "1": 1600,
  "2": 2500,
  "3": 3400,
  "4": 4300,
  "5": 5000,
};

/**
 * Generates a household size based on predefined probabilities.
 *
 * @returns {number} The size of the household.
 */
function generateHouseholdSize(): number {
  const randint = getRandomInt(1, 100);
  if (randint <= 43) return 1;
  if (randint <= 67) return 2;
  if (randint <= 81) return 3;
  if (randint <= 95) return 4;
  return 5;
}

/**
 * Creates a twin world with a specified number of households and variation.
 *
 * @param {string} name - The name of the twin world.
 * @param {number} baseHouseholdCount - The base number of households in the twin world.
 * @param {number} variation - The variation in the number of households.
 * @returns {TwinWorld} The generated twin world.
 */
export const createTwinWorld = (
  name: string,
  baseHouseholdCount: number,
  variation: number
): TwinWorld => {
  const householdCount = getRandomInt(
    Math.max(1, baseHouseholdCount - variation),
    baseHouseholdCount + variation
  );

  const households = Array.from({ length: householdCount }, (_, i) => {
    const householdSize = generateHouseholdSize();
    const invNorm = randomNormal(1, 0.1);
    const totalEnergyUsage = Math.round(
      invNorm * (defaultEnergyUsage[String(householdSize)] || 0)
    );

    let solarPanels = 0;
    if (Math.random() < 0.7) {
      const invNormSolar = randomNormal(1, 0.1);
      solarPanels = Math.ceil(3 + 2 * householdSize * invNormSolar);
    }

    const household = {
      id: lastHouseholdId + i + 1,
      name: `Household ${lastHouseholdId + i + 1}`,
      size: householdSize,
      energyUsage: totalEnergyUsage,
      solarYieldYearly: solarPanels * 340, // Avg solar capacity
      solarPanels,
      appliances: generateAppliancesForHousehold(householdSize, invNorm),
    };

    return household;
  });

  lastHouseholdId += householdCount;

  return {
    name,
    description: `A twin world consisting of roughly ${householdCount} households.`,
    solarPanelCapacity: 340,
    households,
  };
};
