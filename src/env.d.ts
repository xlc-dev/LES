/// <reference types="@rsbuild/core/types" />
/// <reference types="svelte" />

interface AppData {
  stepperData: StepperData;
  customOptions: Record<number, CustomOption[]>;
  households: Household[];
}

type Option = {
  id: string;
  description: string;
  label: string;
  isCustom?: boolean;
};

type FormField = {
  label: string;
  description?: string;
  type: "input" | "textarea" | "editor" | "file";
  dataType?: "string" | "int" | "float";
  file?: File;
  placeholder?: string;
  value?: string;
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
};

type Step = {
  title: string;
  options: Option[];
  formFields: FormField[];
};

type StepperData = {
  steps: {
    title: string;
    selectedOption: Option | null;
    formData: Record<string, any> | null;
    twinWorld?: TwinWorld;
    energyflow?: Energyflow;
  }[];
};

type CustomOption = {
  id: string;
  option: Option & { energyflow?: Energyflow };
  formData: Record<string, any>;
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

type Household = {
  id: number;
  name: string;
  size: number;
  energyUsage: number;
  solarPanels: number;
  solarYieldYearly: number;
  appliances?: Appliance[];
};

type TwinWorld = {
  description: string;
  households: Household[];
};

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
