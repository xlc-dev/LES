import {
  getRandomInt,
  shuffleArray,
  randomNormal,
  roundTo,
  ApplianceTypes,
} from "./utils";

const TWIN_WORLD_DESCRIPTION = `
Each house consists of 1 to 5 inhabitants. The schedulable appliances are:
Washing machine, tumble dryer, dishwasher, kitchen appliances, and Electrical Vehicle.
The frequency of use and power usage are randomized for each appliance.
`;

function createAppliance(
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
    const availability = generateAvailability(name, dailyUsage);
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

function generateAvailability(
  applianceName: ApplianceTypes,
  dailyUsage: number,
): boolean[] {
  const availability = Array(24).fill(false);
  const typicalHours = getTypicalUsageHours(applianceName);
  const baseUsage = Math.floor(dailyUsage);
  let totalUsage = baseUsage + (Math.random() < dailyUsage - baseUsage ? 1 : 0);
  totalUsage = Math.max(1, totalUsage); // Ensure at least 1 hour of usage

  const hoursToPick = Math.min(totalUsage, typicalHours.length);
  const usageTimes = pickRandomHours(typicalHours, hoursToPick);

  usageTimes.forEach((hour) => (availability[hour] = true));
  return availability;
}

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

function pickRandomHours(possibleHours: number[], count: number): number[] {
  const shuffled = shuffleArray(possibleHours);
  return shuffled.slice(0, count);
}

function createApplianceOfType(
  type: ApplianceTypes,
  householdSize: number,
  durationOptions: [number, number],
  availabilityMapping: Record<string, number>,
  frequencyMapping: Record<string, number>,
  energyPattern: number,
  usageRandom: number,
  usageMulti: number,
  usageAddition: number,
): Appliance | null {
  const rand = Math.random();
  const duration = rand < 0.5 ? durationOptions[0] : durationOptions[1];
  return createAppliance(
    type,
    householdSize,
    duration,
    availabilityMapping,
    frequencyMapping,
    energyPattern,
    usageRandom,
    usageMulti,
    usageAddition,
  );
}

function createDishwasher(
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.47, "2": 0.76, "3": 0.81, "4": 0.89, "5": 0.83 };
  const frequency = { "1": 1.0, "2": 1.2, "3": 1.5, "4": 1.7, "5": 2.0 };
  return createApplianceOfType(
    ApplianceTypes.DISHWASHER,
    householdSize,
    [1, 2],
    available,
    frequency,
    invNorm,
    Math.random(),
    0.3,
    0.8,
  );
}

function createWashingMachine(
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.94, "2": 1, "3": 1, "4": 1, "5": 0.97 };
  const frequency = { "1": 1.0, "2": 1.3, "3": 1.6, "4": 1.9, "5": 2.2 };
  return createApplianceOfType(
    ApplianceTypes.WASHING_MACHINE,
    householdSize,
    [2, 3],
    available,
    frequency,
    invNorm,
    Math.random(),
    0.7,
    0.9,
  );
}

function createTumbleDryer(
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.63, "2": 0.63, "3": 0.63, "4": 0.63, "5": 0.63 };
  const frequency = { "1": 0.6, "2": 0.8, "3": 1.0, "4": 1.2, "5": 1.4 };
  return createApplianceOfType(
    ApplianceTypes.TUMBLE_DRYER,
    householdSize,
    [1, 2],
    available,
    frequency,
    invNorm,
    Math.random(),
    2,
    1,
  );
}

function createElectricVehicle(
  householdSize: number,
  invNorm: number,
): Appliance | null {
  const available = { "1": 0.2, "2": 0.2, "3": 0.2, "4": 0.2, "5": 0.2 };
  const frequency = { "1": 1.0, "2": 1.0, "3": 1.0, "4": 1.0, "5": 1.0 };
  const appliance = createApplianceOfType(
    ApplianceTypes.ELECTRIC_VEHICLE,
    householdSize,
    [4, 5],
    available,
    frequency,
    invNorm,
    Math.random(),
    10,
    50,
  );
  if (appliance) appliance.availability = generateEVAvailability();
  return appliance;
}

function createStove(householdSize: number, invNorm: number): Appliance | null {
  const available = { "1": 0.49, "2": 0.49, "3": 0.49, "4": 0.49, "5": 0.49 };
  const frequency = { "1": 2.0, "2": 2.5, "3": 3.0, "4": 3.5, "5": 4.0 };
  return createApplianceOfType(
    ApplianceTypes.STOVE,
    householdSize,
    [1, 2],
    available,
    frequency,
    invNorm,
    Math.random(),
    0.5,
    0.5,
  );
}

function generateEVAvailability(): boolean[] {
  const availability = Array(24).fill(false);
  const chargeStart = getRandomInt(20, 22); // 8 PM to 10 PM
  const chargeDuration = getRandomInt(2, 4); // 2 to 4 hours
  for (let i = 0; i < chargeDuration; i++) {
    availability[(chargeStart + i) % 24] = true;
  }
  return availability;
}

function generateRandomAppliances(householdSize: number): Appliance[] {
  const appliances: Appliance[] = [];
  const invNorm = randomNormal(1, 0.1);

  [
    createDishwasher,
    createWashingMachine,
    createTumbleDryer,
    createStove,
    createElectricVehicle,
  ].forEach((createAppliance) => {
    const appliance = createAppliance(householdSize, invNorm);
    if (appliance) appliances.push(appliance);
  });

  return appliances;
}

function generateHouseholdSize(): number {
  const randint = getRandomInt(1, 100);
  if (randint <= 43) return 1;
  if (randint <= 67) return 2;
  if (randint <= 81) return 3;
  if (randint <= 95) return 4;
  return 5;
}

const defaultEnergyUsage: Record<string, number> = {
  "1": 1600,
  "2": 2500,
  "3": 3400,
  "4": 4300,
  "5": 5000,
};

const createTwinWorld = (
  baseHouseholdCount: number,
  variation: number,
): TwinWorld => {
  const householdCount = getRandomInt(
    Math.max(1, baseHouseholdCount - variation),
    baseHouseholdCount + variation,
  );

  return {
    description: `A twin world consisting of roughly ${householdCount} households.`,
    households: Array.from({ length: householdCount }, (_, i) => {
      const householdSize = generateHouseholdSize();
      const invNorm = randomNormal(1, 0.1);
      const totalEnergyUsage = Math.round(
        invNorm * (defaultEnergyUsage[String(householdSize)] || 0),
      );

      let solarPanels = 0;
      if (Math.random() < 0.38) {
        const invNormSolar = randomNormal(1, 0.1);
        solarPanels = Math.ceil(3 + 2 * householdSize * invNormSolar);
      }

      return {
        name: `Household ${i + 1}`,
        size: householdSize,
        energyUsage: totalEnergyUsage,
        solarPanels,
        appliances: generateRandomAppliances(householdSize),
      };
    }),
  };
};

export const defaultTwinWorlds: { [key: string]: TwinWorld } = {
  "Twin World small": createTwinWorld(25, 5),
  "Twin World large": createTwinWorld(75, 5),
};

const steps: Step[] = $state([
  {
    title: "Twin World",
    options: [
      {
        id: "1",
        label: "Twin World small",
        description: `A small twin world consisting of roughly 25 households. ${TWIN_WORLD_DESCRIPTION}`,
      },
      {
        id: "2",
        label: "Twin World large",
        description: `A large twin world consisting of roughly 75 households. ${TWIN_WORLD_DESCRIPTION}`,
      },
    ],
    formFields: [
      {
        label: "Name",
        description: "Enter the name of your custom twin world",
        type: "input",
        dataType: "string",
        placeholder: "Custom Twin World",
        required: true,
      },
      {
        label: "Description",
        description: "Enter a description of your custom twin world",
        type: "textarea",
        dataType: "string",
        placeholder: "My own twin world",
        required: true,
      },
      {
        label: "Solar Panel Capacity",
        description:
          "Enter the average yield of a single solar panel in a year",
        type: "input",
        dataType: "int",
        placeholder: "340",
        required: true,
        min: 1,
      },
    ],
  },
  {
    title: "Cost Model",
    options: [
      {
        id: "1",
        label: "Fixed Price",
        description:
          "A fixed price for buying and selling energy. The price for buying from the utility is 0.4 and the price for selling is 0.1. The price is determined by 0.25. A higher fixed devisision means a higher trading price.",
      },
      {
        id: "2",
        label: "TEMO",
        description:
          "A price model based on the TEMO model. The price is determined by a formula that compares the energy needed to the various prices available, and returns an internal buying and selling prices",
      },
    ],
    formFields: [
      {
        label: "Name",
        description: "Enter the name of your custom cost model",
        type: "input",
        dataType: "string",
        placeholder: "Custom Cost Model",
        required: true,
      },
      {
        label: "Description",
        description: "Enter a description of your custom cost model",
        type: "textarea",
        placeholder: "My own cost model",
        required: true,
      },
      {
        label: "Price Network Buy Consumer",
        description: "The price for buying energy from the energy provider",
        type: "input",
        dataType: "float",
        placeholder: "0.4",
        required: true,
        min: 0,
        step: 0.1,
      },
      {
        label: "Price Network Sell Consumer",
        description: "The price for selling energy back to the energy provider",
        type: "input",
        dataType: "float",
        placeholder: "0.1",
        required: true,
        min: 0,
        step: 0.1,
      },
      {
        label: "Fixed Price Ratio",
        description:
          "Determines the internal price for selling and buying energy. A higher ratio means that the price will tend towards the buying price",
        type: "input",
        dataType: "float",
        placeholder: "0.5",
        required: true,
        min: 0,
        step: 0.1,
      },
      {
        label: "Cost Model Algorithm",
        description:
          "A custom formula used to determine the internal buying and selling price",
        type: "editor",
        required: true,
        value: `function costModel() {\n\treturn buyCustomer * ratio + sellCustomer * (1 - ratio);\n}\n`,
      },
    ],
  },
  {
    title: "Algorithm",
    options: [
      {
        id: "1",
        label: "Greedy Planning",
        description:
          "An initial planning that puts appliances in their local optimum through a greedy algorithm. Will not optimize further than one pass through all appliances.",
      },
      {
        id: "2",
        label: "Simulated Annealing",
        description:
          "An algorithm that improves on a given algorithm by randomly changing the time of planned in appliances. The conditions for what changes becomes stricter over time, resulting in a further optimized solution.",
      },
    ],
    formFields: [
      {
        label: "Name",
        description: "Enter the name of your custom algorithm",
        type: "input",
        dataType: "string",
        placeholder: "Custom Algorithm",
        required: true,
      },
      {
        label: "Description",
        description: "Enter a description of your custom algorithm",
        type: "textarea",
        placeholder: "My own algorithm",
        required: true,
      },
      {
        label: "Max Temperature",
        description: "Sets the max temperature for your algorithm",
        type: "input",
        dataType: "int",
        placeholder: "10000",
        required: true,
      },
      {
        label: "Custom Algorithm",
        description:
          "A custom algorithm used to determine when an appliance will be planned in",
        type: "editor",
        required: true,
        value: `function run() {\n\treturn true;\n}\n`,
      },
    ],
  },
  {
    title: "Energyflow",
    options: [
      {
        id: "1",
        label: "Energyflow Zoetermeer",
        description:
          "The energy data from a green household in Zoetermeer that is associated with the THUAS.",
      },
    ],
    formFields: [
      {
        label: "Name",
        description: "Enter the name of your custom energyflow",
        type: "input",
        dataType: "string",
        placeholder: "Custom Energy Flow",
        required: true,
      },
      {
        label: "Description",
        description: "Enter a description of your custom energyflow",
        type: "textarea",
        placeholder: "My own energy flow",
        required: true,
      },
      {
        label: "Solar Panels Factor",
        description:
          "The amount of solar panels for the household in the supplied energy table",
        type: "input",
        dataType: "int",
        placeholder: "25",
        required: true,
        min: 0,
      },
      {
        label: "Energy Usage Factor",
        description:
          "The amount of yearly energy used for the household in the supplied energy table",
        type: "input",
        dataType: "int",
        placeholder: "7000",
        required: true,
        min: 0,
      },
      {
        label: "Energyflow CSV",
        description: "Upload a energyflow CSV file to use for the simulation",
        type: "file",
        required: true,
      },
    ],
  },
]);

export function getSteps() {
  function setSteps(steps: Step[]) {
    steps = steps;
  }
  return {
    get steps() {
      return steps;
    },
    setSteps,
  };
}
