/// <reference types="@rsbuild/core/types" />
/// <reference types="svelte" />

type FormDataStruct = {
  title: string;
  formFields: FormField[];
  options: Option[];
} & (
  | { stepType: "twinworld"; twinWorlds: Record<string, TwinWorld> }
  | { stepType: "costmodel"; costModels: Record<string, CostModel> }
  | { stepType: "algo"; algos: Record<string, Algo> }
  | { stepType: "energyflow"; energyflows: Record<string, Energyflow> }
);

type Option = {
  id: string;
  name: string;
  label: string;
  description: string;
  isDefault: boolean;
};

interface FormField {
  label: string;
  name: string;
  description: string;
  type: "input" | "textarea" | "editor" | "file";
  dataType?: "string" | "int" | "float";
  placeholder?: string;
  required: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  value?: any;
  error?: string;
}

type StepperData = {
  twinworld: TwinWorld;
  costmodel: CostModel;
  algo: Algo;
  energyflow: Energyflow;
  energyflowlabel: string;
};

type Energyflow = {
  solarPanelsFactor: number;
  energyUsageFactor: number;
  headers: string[];
  data: {
    timestamp: string;
    energy_used: number;
    solar_produced: number;
  }[];
};

type CostModel = {
  name: string;
  description: string;
  priceNetworkBuyConsumer: number;
  priceNetworkSellConsumer: number;
  fixedPriceRatio: number;
  algorithm: string;
};

type Algo = {
  name: string;
  description: string;
  maxTemperature: number;
  algorithm: string;
};

type Household = {
  id: number;
  name: string;
  size: number;
  energyUsage: number;
  solarPanels: number;
  solarPanelType: PanelType;
  solarYieldYearly: number;
  appliances?: Appliance[];
};

type TwinWorld = {
  name: string;
  description: string;
  solarPanelCapacity: number;
  households: Household[];
};

type PanelType = "Good" | "Average" | "Bad";

type ApplianceTypes =
  | "Washing Machine"
  | "Tumble Dryer"
  | "Dishwasher"
  | "Stove"
  | "Electric Vehicle";

type Appliance = {
  id: number;
  name: ApplianceTypes;
  power: number;
  duration: number;
  dailyUsage: number;
  timeDaily: ApplianceTimeDaily[];
};

type ApplianceTimeDaily = {
  id: number;
  day: number;
  bitmapWindow: number;
  bitmapPlanEnergy: number;
  bitmapPlanNoEnergy: number;
};

type EfficiencyResult = {
  solarEnergyIndividual: number;
  solarEnergyTotal: number;
  internalBoughtEnergyPrice: number;
  totalAmountSaved: number;
};
