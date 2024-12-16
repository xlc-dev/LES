import { getRandomInt, randomNormal } from "./utils";
import { generateAppliancesForHousehold } from "./appliance";

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
const createTwinWorld = (
  name: string,
  baseHouseholdCount: number,
  variation: number
): TwinWorld => {
  const householdCount = getRandomInt(
    Math.max(1, baseHouseholdCount - variation),
    baseHouseholdCount + variation
  );

  return {
    name,
    description: `A twin world consisting of roughly ${householdCount} households.`,
    solarPanelCapacity: 340,
    households: Array.from({ length: householdCount }, (_, i) => {
      const householdSize = generateHouseholdSize();
      const invNorm = randomNormal(1, 0.1);
      const totalEnergyUsage = Math.round(
        invNorm * (defaultEnergyUsage[String(householdSize)] || 0)
      );

      let solarPanels = 0;
      if (Math.random() < 0.38) {
        const invNormSolar = randomNormal(1, 0.1);
        solarPanels = Math.ceil(3 + 2 * householdSize * invNormSolar);
      }

      return {
        id: i + 1,
        name: `Household ${i + 1}`,
        size: householdSize,
        energyUsage: totalEnergyUsage,
        solarYieldYearly: solarPanels * 340, // Avg solar capacity
        solarPanels,
        appliances: generateAppliancesForHousehold(i + 1, householdSize, invNorm),
      };
    }),
  };
};

/**
 * Default twin worlds configuration.
 */
export const defaultTwinWorlds: { [key: string]: TwinWorld } = {
  "Twin World small": createTwinWorld("Twin World small", 25, 5),
  "Twin World large": createTwinWorld("Twin World large", 75, 5),
};

/**
 * Default cost model configurations.
 */
export const defaultCostModels: { [key: string]: CostModel } = {
  "Fixed Price": {
    name: "Fixed Price",
    description:
      "A fixed price for buying and selling energy. The price for buying from the utility is 0.4 and the price for selling is 0.1. The price is determined by 0.25. A higher fixed devisision means a higher trading price.",
    priceNetworkBuyConsumer: 0.4,
    priceNetworkSellConsumer: 0.1,
    fixedPriceRatio: 0.5,
    algorithm: `function costModel() {
  return buyCustomer * ratio + sellCustomer * (1 - ratio);
}
`,
  },
  TEMO: {
    name: "TEMO",
    description:
      "A price model based on the TEMO model. The price is determined by a formula that compares the energy needed to the various prices available, and returns an internal buying and selling prices",
    priceNetworkBuyConsumer: 0.4,
    priceNetworkSellConsumer: 0.1,
    fixedPriceRatio: 0.5,
    algorithm: `function costModel() {
  return buyCustomer * ratio + sellCustomer * (1 - ratio);
}
`,
  },
};

/**
 * Default algorithm configurations.
 */
export const defaultAlgorithms: { [key: string]: Algo } = {
  "Greedy Planning": {
    name: "Greedy Planning",
    description:
      "An initial planning that puts appliances in their local optimum through a greedy algorithm. Will not optimize further than one pass through all appliances.",
    maxTemperature: 10000,
    algorithm: ``,
  },
  "Simulated Annealing": {
    name: "Simulated Annealing",
    description:
      "An algorithm that improves on a given algorithm by randomly changing the time of planned in appliances. The conditions for what changes becomes stricter over time, resulting in a further optimized solution.",
    maxTemperature: 10000,
    algorithm: ``,
  },
};
