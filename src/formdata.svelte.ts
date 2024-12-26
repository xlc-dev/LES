import { createTwinWorld } from "./twinworld";
import { readCSV } from "./utils";

const TWIN_WORLD_DESCRIPTION = `
Each house consists of 1 to 5 inhabitants. The schedulable appliances are:
Washing machine, tumble dryer, dishwasher, kitchen appliances, and Electrical Vehicle.
The frequency of use and power usage are randomized for each appliance.
`;

/**
 * Default twin worlds configuration.
 */
const defaultTwinWorlds: { [key: string]: TwinWorld } = {
  "Twin World small": createTwinWorld("Twin World small", 25, 5),
  "Twin World large": createTwinWorld("Twin World large", 75, 5),
};

/**
 * Default cost model configurations.
 */
const defaultCostModels: { [key: string]: CostModel } = {
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

let defaultEnergyflow: Energyflow;
if (import.meta.env.PROD) {
  defaultEnergyflow = await readCSV("/LES/energyflowZoetermeer.csv");
} else {
  defaultEnergyflow = await readCSV("energyflowZoetermeer.csv");
}

/**
 * Default algorithm configurations.
 */
const defaultAlgorithms: { [key: string]: Algo } = {
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

const formData: FormDataStruct[] = $state([
  {
    title: "Twin World",
    stepType: "twinworld",
    options: [
      {
        id: "1",
        name: "twinWorldSmall",
        label: "Twin World small",
        description: `A small twin world consisting of roughly 25 households. ${TWIN_WORLD_DESCRIPTION}`,
      },
      {
        id: "2",
        name: "twinWorldLarge",
        label: "Twin World large",
        description: `A large twin world consisting of roughly 75 households. ${TWIN_WORLD_DESCRIPTION}`,
      },
    ],
    formFields: [
      {
        name: "name",
        label: "Name",
        description: "Enter the name of your custom twin world",
        type: "input",
        dataType: "string",
        placeholder: "Custom Twin World",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        description: "Enter a description of your custom twin world",
        type: "textarea",
        dataType: "string",
        placeholder: "My own twin world",
        required: true,
      },
      {
        name: "solarPanelCapacity",
        label: "Solar Panel Capacity",
        description: "Enter the average yield of a single solar panel in a year",
        type: "input",
        dataType: "int",
        placeholder: "340",
        required: true,
        min: 1,
      },
    ],
    twinWorlds: {
      "1": defaultTwinWorlds["Twin World small"],
      "2": defaultTwinWorlds["Twin World large"],
    },
  },
  {
    title: "Cost Model",
    stepType: "costmodel",
    options: [
      {
        id: "1",
        name: "fixedPrice",
        label: "Fixed Price",
        description:
          "A fixed price for buying and selling energy. The price for buying from the utility is 0.4 and the price for selling is 0.1. The price is determined by 0.25. A higher fixed devisision means a higher trading price.",
      },
      {
        id: "2",
        name: "TEMO",
        label: "TEMO",
        description:
          "A price model based on the TEMO model. The price is determined by a formula that compares the energy needed to the various prices available, and returns an internal buying and selling prices",
      },
    ],
    formFields: [
      {
        label: "Name",
        name: "name",
        description: "Enter the name of your custom cost model",
        type: "input",
        dataType: "string",
        placeholder: "Custom Cost Model",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        description: "Enter a description of your custom cost model",
        type: "textarea",
        placeholder: "My own cost model",
        required: true,
      },
      {
        name: "priceNetworkBuyConsumer",
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
        name: "priceNetworkSellConsumer",
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
        name: "fixedPriceRatio",
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
        name: "algorithm",
        label: "Cost Model Algorithm",
        description: "A custom formula used to determine the internal buying and selling price",
        type: "editor",
        required: true,
        value: `function costModel() {\n\treturn buyCustomer * ratio + sellCustomer * (1 - ratio);\n}\n`,
      },
    ],
    costModels: {
      "1": defaultCostModels["Fixed Price"],
      "2": defaultCostModels["TEMO"],
    },
  },
  {
    title: "Algorithm",
    stepType: "algo",
    options: [
      {
        id: "1",
        name: "greedyPlanning",
        label: "Greedy Planning",
        description:
          "An initial planning that puts appliances in their local optimum through a greedy algorithm. Will not optimize further than one pass through all appliances.",
      },
      {
        id: "2",
        name: "simulatedAnnealing",
        label: "Simulated Annealing",
        description:
          "An algorithm that improves on a given algorithm by randomly changing the time of planned in appliances. The conditions for what changes becomes stricter over time, resulting in a further optimized solution.",
      },
    ],
    formFields: [
      {
        label: "Name",
        name: "name",
        description: "Enter the name of your custom algorithm",
        type: "input",
        dataType: "string",
        placeholder: "Custom Algorithm",
        required: true,
      },
      {
        label: "Description",
        name: "description",
        description: "Enter a description of your custom algorithm",
        type: "textarea",
        placeholder: "My own algorithm",
        required: true,
      },
      {
        label: "Max Temperature",
        name: "maxTemperature",
        description: "Sets the max temperature for your algorithm",
        type: "input",
        dataType: "int",
        placeholder: "10000",
        required: false,
      },
      {
        label: "Custom Algorithm",
        name: "algorithm",
        description: "A custom algorithm used to determine when an appliance will be planned in",
        type: "editor",
        required: true,
        value: `function run(context) {\n}\n`,
      },
    ],
    algos: {
      "1": defaultAlgorithms["Greedy Planning"],
      "2": defaultAlgorithms["Simulated Annealing"],
    },
  },
  {
    title: "Energyflow",
    stepType: "energyflow",
    options: [
      {
        id: "1",
        name: "energyflowZoetermeer",
        label: "Energyflow Zoetermeer",
        description:
          "The energy data from a green household in Zoetermeer that is associated with the THUAS.",
      },
    ],
    formFields: [
      {
        name: "name",
        label: "Name",
        description: "Enter the name of your custom energyflow",
        type: "input",
        dataType: "string",
        placeholder: "Custom Energy Flow",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        description: "Enter a description of your custom energyflow",
        type: "textarea",
        placeholder: "My own energy flow",
        required: true,
      },
      {
        name: "solarPanelsFactor",
        label: "Solar Panels Factor",
        description: "The amount of solar panels for the household in the supplied energy table",
        type: "input",
        dataType: "int",
        placeholder: "25",
        required: true,
        min: 0,
      },
      {
        name: "energyUsageFactor",
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
        name: "energyflowCsv",
        label: "Energyflow CSV",
        description: "Upload a energyflow CSV file to use for the simulation",
        type: "file",
        required: true,
      },
    ],
    energyflows: {
      "1": defaultEnergyflow,
    },
  },
]);

export function getFormData() {
  function setFormData(formData: FormData[]) {
    formData = formData;
  }
  return {
    get formData() {
      return formData;
    },
    setFormData,
  };
}

export function isEnergyflowStep(
  item: FormDataStruct
): item is FormDataStruct & { stepType: "energyflow"; energyflows: Record<string, Energyflow> } {
  return item.stepType === "energyflow";
}

export function isTwinworldStep(
  item: FormDataStruct
): item is FormDataStruct & { stepType: "twinworld"; twinWorlds: Record<string, TwinWorld> } {
  return item.stepType === "twinworld";
}

export function isCostmodelStep(
  item: FormDataStruct
): item is FormDataStruct & { stepType: "costmodel"; costModels: Record<string, CostModel> } {
  return item.stepType === "costmodel";
}

export function isAlgoStep(
  item: FormDataStruct
): item is FormDataStruct & { stepType: "algo"; algos: Record<string, Algo> } {
  return item.stepType === "algo";
}
