/// <reference types="@rsbuild/core/types" />
/// <reference types="svelte" />

type ComponentList = "Dashboard" | "Schedulable Loads" | "Simulation" | "Stop";

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

type CustomOption = {
  id: string;
  option: Option & { energyflow?: Energyflow };
  formData: Record<string, any>;
};

type Energyflow = {
  headers: string[];
  data: {
    timestamp: string;
    energy_used: number;
    solar_produced: number;
  }[];
};

type StepperData = {
  steps: {
    title: string;
    selectedOption: Option | null;
    formData: Record<string, any> | null;
    twinWorld?: TwinWorld;
  }[];
};

type ApplianceTypes =
  | "Washing Machine"
  | "Tumble Dryer"
  | "Dishwasher"
  | "Stove"
  | "Electric Vehicle";

type Appliance = {
  name: ApplianceTypes;
  power: number;
  duration: number;
  dailyUsage: number;
  availability: boolean[];
};

type Household = {
  name: string;
  size: number;
  energyUsage: number;
  solarPanels: number;
  appliances?: Appliance[];
};

type TwinWorld = {
  description: string;
  households: Household[];
};

type EfficiencyResult = {
  solarEnergyIndividual: number;
  solarEnergyTotal: number;
  internalBoughtEnergyPrice: number;
  totalAmountSaved: number;
};

type ApplianceTimeDaily = {
  day: number;
  bitmap_plan_energy?: number;
  bitmap_plan_no_energy?: number;
};
