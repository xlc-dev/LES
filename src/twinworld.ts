import { getRandomInt, randomNormal } from "./utils";
import { generateAppliancesForHousehold } from "./appliance";

const defaultEnergyUsage: Record<string, number> = {
  "1": 1600,
  "2": 2500,
  "3": 3400,
  "4": 4300,
  "5": 5000,
};

function generateHouseholdSize(): number {
  const randint = getRandomInt(1, 100);
  if (randint <= 43) return 1;
  if (randint <= 67) return 2;
  if (randint <= 81) return 3;
  if (randint <= 95) return 4;
  return 5;
}

const createTwinWorld = (baseHouseholdCount: number, variation: number): TwinWorld => {
  const householdCount = getRandomInt(
    Math.max(1, baseHouseholdCount - variation),
    baseHouseholdCount + variation
  );

  return {
    description: `A twin world consisting of roughly ${householdCount} households.`,
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
        appliances: generateAppliancesForHousehold(householdSize, invNorm),
      };
    }),
  };
};

export const defaultTwinWorlds: { [key: string]: TwinWorld } = {
  "Twin World small": createTwinWorld(25, 5),
  "Twin World large": createTwinWorld(75, 5),
};