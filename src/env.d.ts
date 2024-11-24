/// <reference types="@rsbuild/core/types" />
/// <reference types="svelte" />

type ComponentList = "Dashboard" | "Schedulable Loads" | "Simulation" | "Stop";

type Option = {
  label: string;
  description: string;
  id?: string;
  isCustom?: boolean;
};

type FormField = {
  label: string;
  description?: string;
  type: "input" | "textarea" | "editor";
  dataType?: "string" | "int" | "float";
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
  option: Option;
  formData: any;
};

type Energyflow = {
  headers: string[];
  data: {
    name: string;
    energyUsage: number;
    solarPanels: number;
  }[];
};

type StepperData = {
  steps: {
    title: string;
    selectedOption: Option | null;
    formData: { [key: string]: any } | null;
    twinWorld?: TwinWorld;
    energyflow?: Energyflow;
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
  power: number; // in Watts, gt 0
  duration: number; // in hours, gt 0
  dailyUsage: number; // times used per day, gt 0
};

type Household = {
  name: string; // gt 1
  size: number; // default 1, ge 1 le 5
  energyUsage: number; // in kWh, ge 0
  solarPanels: number; // ge 0
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
  id: number;
  day: number;
  bitmap_plan_energy?: number;
  bitmap_plan_no_energy?: number;
};
