import { getRandomInt, shuffleArray } from "./utils";

const TWIN_WORLD_DESCRIPTION = `
Each house consists of 1 to 5 inhabitants. The schedulable appliances are:
Washing machine, tumble dryer, dishwasher, kitchen appliances, and Electrical Vehicle.
The frequency of use and power usage are randomized for each appliance.
`;

const createTwinWorld = (
  baseHouseholdCount: number,
  variation: number,
  description: string,
): TwinWorld => {
  const householdCount = getRandomInt(
    Math.max(1, baseHouseholdCount - variation),
    baseHouseholdCount + variation,
  );

  return {
    description,
    households: Array.from({ length: householdCount }, (_, i) => ({
      name: `Household ${i + 1}`,
      size: getRandomInt(1, 6),
      energyUsage: getRandomInt(3000, 15000),
      solarPanels: getRandomInt(0, 30),
      appliances: generateRandomAppliances(),
    })),
  };
};

function generateEVAvailability(): boolean[] {
  const availability = Array(24).fill(false);
  const chargeStart = getRandomInt(20, 22); // 8 PM to 10 PM
  const chargeDuration = getRandomInt(2, 4); // 2 to 4 hours

  for (let i = 0; i < chargeDuration; i++) {
    const hour = (chargeStart + i) % 24;
    availability[hour] = true;
  }

  return availability;
}

function getRandomHours(possibleHours: number[]): number[] {
  const count = getRandomInt(1, possibleHours.length);
  return shuffleArray(possibleHours).slice(0, count);
}

export const defaultTwinWorlds: { [key: string]: TwinWorld } = {
  "Twin World small": createTwinWorld(
    25,
    5,
    `A small twin world consisting of roughly 25 households. ${TWIN_WORLD_DESCRIPTION}`,
  ),
  "Twin World large": createTwinWorld(
    75,
    5,
    `A large twin world consisting of roughly 75 households. ${TWIN_WORLD_DESCRIPTION}`,
  ),
};

function generateRandomAppliances(): Appliance[] {
  const applianceNames: ApplianceTypes[] = [
    "Washing Machine",
    "Tumble Dryer",
    "Stove",
    "Dishwasher",
    "Electric Vehicle",
  ];

  const appliances: Appliance[] = [];

  applianceNames.forEach((name) => {
    if (name !== "Electric Vehicle") {
      if (Math.random() < 0.8) {
        appliances.push({
          name,
          power: getRandomInt(500, 2000),
          duration: getRandomInt(1, 4),
          dailyUsage: getRandomInt(1, 6),
          availability: generateAvailability(name),
        });
      }
    }
  });

  if (Math.random() < 0.7) {
    const numberOfVehicles = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < numberOfVehicles; i++) {
      appliances.push({
        name: "Electric Vehicle",
        power: getRandomInt(5000, 25000),
        duration: getRandomInt(2, 5),
        dailyUsage: 1,
        availability: generateEVAvailability(),
      });
    }
  }

  return appliances;
}

function generateAvailability(applianceName: string): boolean[] {
  const availability = Array(24).fill(false);
  let activeHours: number[] = [];

  switch (applianceName) {
    case "Washing Machine":
      activeHours = getRandomHours([6, 7, 18, 19]);
      break;
    case "Tumble Dryer":
      activeHours = getRandomHours([7, 8, 19, 20]);
      break;
    case "Stove":
      activeHours = getRandomHours([12, 13, 18, 19]);
      break;
    case "Dishwasher":
      activeHours = getRandomHours([19, 20]);
      break;
    default:
      activeHours = [];
  }

  activeHours.forEach((hour) => {
    availability[hour] = true;
  });

  return availability;
}

const steps: Step[] = $state([
  {
    title: "Twin World",
    options: [
      {
        label: "Twin World small",
        description: `A small twin world consisting of roughly 25 households. ${TWIN_WORLD_DESCRIPTION}`,
      },
      {
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
        label: "Fixed Price",
        description:
          "A fixed price for buying and selling energy. The price for buying from the utility is 0.4 and the price for selling is 0.1. The price is determined by 0.25. A higher fixed devisision means a higher trading price.",
      },
      {
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
        label: "Greedy Planning",
        description:
          "An initial planning that puts appliances in their local optimum through a greedy algorithm. Will not optimize further than one pass through all appliances.",
      },
      {
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
