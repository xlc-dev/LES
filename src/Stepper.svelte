<script lang="ts">
  import { openDB } from "idb";
  import { onMount } from "svelte";
  import { getDashboard, getStepperData } from "./state.svelte";
  import { readCSV } from "./utils";
  import {
    getFormData,
    isAlgoStep,
    isCostmodelStep,
    isEnergyflowStep,
    isTwinworldStep,
  } from "./formdata.svelte";
  import { generateHouseholdId } from "./twinworld";
  import { generateApplianceId, generateTimeDailiesId } from "./appliance";

  interface Props {
    onComplete: () => void;
  }

  const { onComplete }: Props = $props();

  const formData = getFormData();
  const dashboard = getDashboard();
  const stepperData = getStepperData();

  let currentStep = $state(0);
  let selectedOptions = $state(Array(formData.formData.length).fill(null));
  let hoveredOption: Option | null = $state(null);
  let editingOption: Option | null = $state(null);
  let foldedHouseholds: boolean[] = $state<boolean[]>([]);
  let foldedAppliances: boolean[][] = $state([]);

  const defaultEditorValues: { [key: string]: string } = {
    costmodel: `function costModel() {\n\treturn buyCustomer * ratio + sellCustomer * (1 - ratio);\n}\n`,
    algo: `function run(context) {\n}\n`,
  };

  const ApplianceTypes = [
    "Washing Machine",
    "Tumble Dryer",
    "Dishwasher",
    "Stove",
    "Electric Vehicle",
  ] as const;

  type ApplianceType = (typeof ApplianceTypes)[number];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  function getAvailableApplianceTypes(
    household: Household,
    currentApplianceName?: ApplianceType
  ): ApplianceType[] {
    const existingTypes = household.appliances ? household.appliances.map((a) => a.name) : [];
    return ApplianceTypes.filter(
      (type) => !existingTypes.includes(type) || type === currentApplianceName
    );
  }

  function getSelectedTwinWorld(): TwinWorld | undefined {
    const twinworldItem = formData.formData.find(isTwinworldStep);
    const selectedOption = selectedOptions[formData.formData.indexOf(twinworldItem!)];
    if (twinworldItem && selectedOption) {
      return twinworldItem.twinWorlds[selectedOption.id];
    }
    return undefined;
  }

  function updateFoldedHouseholds(twinWorld: TwinWorld) {
    foldedHouseholds = Array(twinWorld.households.length).fill(false);
    foldedAppliances = twinWorld.households.map((household) =>
      Array(household.appliances?.length).fill(false)
    );
  }

  function addHousehold() {
    const twinWorld = getSelectedTwinWorld();
    if (!twinWorld) return;

    const newHousehold: Household = {
      id: generateHouseholdId(),
      name: "",
      size: 1,
      energyUsage: 0,
      solarPanels: 0,
      solarYieldYearly: 0,
      appliances: [],
    };
    twinWorld.households.push(newHousehold);
    updateFoldedHouseholds(twinWorld);
  }

  function deleteHousehold(index: number) {
    if (!confirm("Are you sure you want to delete this household?")) return;
    const twinWorld = getSelectedTwinWorld();
    if (!twinWorld) return;

    twinWorld.households.splice(index, 1);
    updateFoldedHouseholds(twinWorld);
  }

  function addAppliance(hIndex: number) {
    const twinWorld = getSelectedTwinWorld();
    if (!twinWorld) return;

    const household = twinWorld.households[hIndex];
    const availableTypes = getAvailableApplianceTypes(household);
    if (availableTypes.length === 0) return;

    const newAppliance: Appliance = {
      id: generateApplianceId(),
      name: availableTypes[0],
      power: 0,
      duration: 0,
      dailyUsage: 0,
      timeDaily: daysOfWeek.map((_, index) => ({
        id: generateTimeDailiesId(),
        day: index + 1,
        bitmapWindow: 0,
        bitmapPlanEnergy: 0,
        bitmapPlanNoEnergy: 0,
      })),
    };

    if (!household.appliances) {
      household.appliances = [];
    }
    household.appliances.push(newAppliance);
    foldedAppliances[hIndex].push(false);
  }

  function deleteAppliance(hIndex: number, aIndex: number): void {
    if (!confirm("Are you sure you want to delete this appliance?")) return;
    const twinWorld = getSelectedTwinWorld();
    if (!twinWorld) return;

    const household = twinWorld.households[hIndex];
    household.appliances!.splice(aIndex, 1);

    foldedAppliances[hIndex].splice(aIndex, 1);
  }

  function handleApplianceTypeChange(hIndex: number, aIndex: number, newType: ApplianceType) {
    const twinWorld = getSelectedTwinWorld();
    if (!twinWorld) return;

    const household = twinWorld.households[hIndex];
    const appliance = household.appliances![aIndex];

    const isDuplicate = household.appliances!.some(
      (a, idx) => a.name === newType && idx !== aIndex
    );
    if (isDuplicate) {
      alert(`${newType} has already been added to this household.`);
      return;
    }

    appliance.name = newType;
  }

  function toggleFold(index: number) {
    foldedHouseholds[index] = !foldedHouseholds[index];
  }

  function toggleApplianceFold(hIndex: number, aIndex: number) {
    foldedAppliances[hIndex][aIndex] = !foldedAppliances[hIndex][aIndex];
  }

  function getDefaultEditorValue(stepType: string): string {
    return defaultEditorValues[stepType] || "";
  }

  async function initDB() {
    return openDB("LargeDataStore", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("formData")) {
          db.createObjectStore("formData", { keyPath: "id" });
        }
      },
    });
  }

  async function saveStorage() {
    try {
      const db = await initDB();
      const plainData = JSON.parse(JSON.stringify(formData.formData));
      await db.put("formData", { id: "mainData", data: plainData });
    } catch (error) {
      console.error("Failed to save data to IndexedDB", error);
    }
  }

  async function loadStorage() {
    try {
      const db = await initDB();
      const storedData = await db.get("formData", "mainData");
      if (storedData) {
        formData.setFormData(storedData.data);
      } else {
        await saveStorage();
      }
    } catch (error) {
      console.error("Failed to load data from IndexedDB", error);
    }
  }

  async function wipeStorage() {
    if (!confirm("Are you sure you want to clear all data?")) return;
    try {
      const db = await initDB();
      await db.delete("formData", "mainData");
      location.reload();
    } catch (error) {
      console.error("Failed to wipe storage", error);
    }
  }

  function goToStep(index: number) {
    if (selectedOptions[index] !== null || index <= currentStep) {
      currentStep = index;
      resetForm();
    }
  }

  function selectOption(stepIndex: number, option: any) {
    selectedOptions[stepIndex] = option;
  }

  function nextStep() {
    if (currentStep < formData.formData.length - 1 && selectedOptions[currentStep] !== null) {
      currentStep += 1;
      resetForm();
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      currentStep -= 1;
      resetForm();
    }
  }

  async function validateCSVField(field: FormField): Promise<boolean> {
    if (field.type !== "file" || !(field.value instanceof File)) return true;

    const file: File = field.value;
    const validMimeTypes = ["text/csv", "application/vnd.ms-excel"];
    const validExtensions = [".csv"];

    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isValidType =
      validMimeTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      field.error = "Only CSV files are allowed.";
      return false;
    }

    try {
      const energyflowData = await readCSV(file);
      const requiredHeaders = ["timestamp", "energy_used", "solar_produced"];
      const headersValid = requiredHeaders.every((header) =>
        energyflowData.headers.includes(header)
      );

      if (!headersValid) {
        field.error = `CSV must include headers: ${requiredHeaders.join(", ")}`;
        return false;
      }

      return true;
    } catch (error) {
      field.error = "Invalid CSV format or content.";
      return false;
    }
  }

  async function validateFormFields(fields: FormField[]): Promise<boolean> {
    let isValid = true;

    for (const field of fields) {
      field.error = "";

      if (
        field.required &&
        (field.value === null || field.value === undefined || field.value === "") &&
        field.type !== "editor"
      ) {
        field.error = `${field.label} is required.`;
        isValid = false;
        continue;
      }

      if (field.type === "file") {
        const valid = await validateCSVField(field);
        if (!valid) isValid = false;
        continue;
      }

      if (field.dataType === "int" && !Number.isInteger(Number(field.value))) {
        field.error = `${field.label} must be an integer.`;
        isValid = false;
      } else if (field.dataType === "float" && isNaN(parseFloat(field.value))) {
        field.error = `${field.label} must be a number.`;
        isValid = false;
      }

      if (field.min !== undefined && Number(field.value) < field.min) {
        field.error = `${field.label} must be at least ${field.min}.`;
        isValid = false;
      }
    }

    return isValid;
  }

  async function createOrUpdateCustomItem(e: Event) {
    e.preventDefault();
    const currentStepData = formData.formData[currentStep];
    const currentFormFields = currentStepData.formFields;

    if (document.getElementById("editor")) {
      // @ts-ignore
      const aceEditor = ace.edit("editor");
      const editorField = currentFormFields.find((field) => field.type === "editor");
      if (editorField) {
        editorField.value = aceEditor.getValue();
      }
    }

    const isValid = await validateFormFields(currentFormFields);
    if (!isValid) return;

    const nameField = currentFormFields.find((field) => field.name === "name");
    const descriptionField = currentFormFields.find((field) => field.name === "description");

    if (!nameField || !descriptionField) return;

    const nameValue = nameField.value?.toString().trim() || "";
    const descriptionValue = descriptionField.value?.toString().trim() || "";

    const existingItem = currentStepData.options.find(
      (option) => option.name.toLowerCase() === nameValue.toLowerCase()
    );

    if (existingItem && (!editingOption || existingItem.id !== editingOption.id)) {
      nameField.error = "An item with this name already exists.";
      return;
    }

    if (editingOption && existingItem) {
      existingItem.name = nameValue;
      existingItem.description = descriptionValue;
      existingItem.label = nameValue.replace(/\s+/g, "");

      if (isTwinworldStep(currentStepData)) {
        const solarPanelCapacity =
          Number(currentFormFields.find((field) => field.name === "solarPanelCapacity")?.value) ||
          0;
        currentStepData.twinWorlds[existingItem.id] = {
          ...currentStepData.twinWorlds[existingItem.id],
          name: existingItem.name,
          description: existingItem.description,
          solarPanelCapacity,
        };
      } else if (isCostmodelStep(currentStepData)) {
        const priceNetworkBuyConsumer =
          Number(
            currentFormFields.find((field) => field.name === "priceNetworkBuyConsumer")?.value
          ) || 0;
        const priceNetworkSellConsumer =
          Number(
            currentFormFields.find((field) => field.name === "priceNetworkSellConsumer")?.value
          ) || 0;
        const fixedPriceRatio =
          Number(currentFormFields.find((field) => field.name === "fixedPriceRatio")?.value) || 0;
        const algorithm =
          currentFormFields.find((field) => field.name === "algorithm")?.value?.toString() || "";
        currentStepData.costModels[existingItem.id] = {
          ...currentStepData.costModels[existingItem.id],
          priceNetworkBuyConsumer,
          priceNetworkSellConsumer,
          fixedPriceRatio,
          algorithm,
        };
      } else if (isAlgoStep(currentStepData)) {
        const maxTemperature =
          Number(currentFormFields.find((field) => field.name === "maxTemperature")?.value) || 0;
        const algorithm =
          currentFormFields.find((field) => field.name === "algorithm")?.value?.toString() || "";
        currentStepData.algos[existingItem.id] = {
          ...currentStepData.algos[existingItem.id],
          maxTemperature,
          algorithm,
        };
      } else if (isEnergyflowStep(currentStepData)) {
        const energyflowCsvField = currentFormFields.find(
          (field) => field.name === "energyflowCsv"
        );
        if (energyflowCsvField && energyflowCsvField.value instanceof File) {
          try {
            const energyflowData = await readCSV(energyflowCsvField.value);
            currentStepData.energyflows[existingItem.id] = {
              ...currentStepData.energyflows[existingItem.id],
              solarPanelsFactor: energyflowData.solarPanelsFactor,
              energyUsageFactor: energyflowData.energyUsageFactor,
              headers: energyflowData.headers,
              data: energyflowData.data,
            };
          } catch {
            energyflowCsvField.error = "Invalid CSV file.";
            return;
          }
        } else {
          const solarPanelsFactor =
            Number(currentFormFields.find((field) => field.name === "solarPanelsFactor")?.value) ||
            0;
          const energyUsageFactor =
            Number(currentFormFields.find((field) => field.name === "energyUsageFactor")?.value) ||
            0;
          currentStepData.energyflows[existingItem.id] = {
            ...currentStepData.energyflows[existingItem.id],
            solarPanelsFactor,
            energyUsageFactor,
          };
        }
      }

      editingOption = null;
      await saveStorage();
      resetForm();
    } else {
      const numericIds = currentStepData.options
        .map((o) => parseInt(o.id, 10))
        .filter((id) => !isNaN(id));
      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
      const newId = (maxId + 1).toString();

      const newItem: Option = {
        id: newId,
        name: nameValue,
        description: descriptionValue,
        label: nameValue.replace(/\s+/g, ""),
        isDefault: false,
      };

      currentStepData.options.push(newItem);

      if (isTwinworldStep(currentStepData)) {
        const solarPanelCapacity =
          Number(currentFormFields.find((field) => field.name === "solarPanelCapacity")?.value) ||
          0;
        currentStepData.twinWorlds[newItem.id] = {
          name: newItem.name,
          description: newItem.description,
          solarPanelCapacity,
          households: [],
        };
      } else if (isCostmodelStep(currentStepData)) {
        const priceNetworkBuyConsumer =
          Number(
            currentFormFields.find((field) => field.name === "priceNetworkBuyConsumer")?.value
          ) || 0;
        const priceNetworkSellConsumer =
          Number(
            currentFormFields.find((field) => field.name === "priceNetworkSellConsumer")?.value
          ) || 0;
        const fixedPriceRatio =
          Number(currentFormFields.find((field) => field.name === "fixedPriceRatio")?.value) || 0;
        const algorithmField = currentFormFields.find((field) => field.name === "algorithm");
        let algorithm = "";
        if (algorithmField?.value) {
          algorithm = algorithmField.value.toString();
        } else {
          algorithm = getDefaultEditorValue(currentStepData.stepType);
        }
        currentStepData.costModels[newItem.id] = {
          name: newItem.name,
          description: newItem.description,
          priceNetworkBuyConsumer,
          priceNetworkSellConsumer,
          fixedPriceRatio,
          algorithm,
        };
      } else if (isAlgoStep(currentStepData)) {
        const maxTemperature =
          Number(currentFormFields.find((field) => field.name === "maxTemperature")?.value) || 0;
        const algorithmField = currentFormFields.find((field) => field.name === "algorithm");
        let algorithm = "";
        if (algorithmField?.value) {
          algorithm = algorithmField.value.toString();
        } else {
          algorithm = getDefaultEditorValue(currentStepData.stepType);
        }
        currentStepData.algos[newItem.id] = {
          name: newItem.name,
          description: newItem.description,
          maxTemperature,
          algorithm,
        };
      } else if (isEnergyflowStep(currentStepData)) {
        const energyflowCsvField = currentFormFields.find(
          (field) => field.name === "energyflowCsv"
        );
        if (energyflowCsvField && energyflowCsvField.value instanceof File) {
          try {
            const energyflowData = await readCSV(energyflowCsvField.value);
            currentStepData.energyflows[newItem.id] = {
              solarPanelsFactor: energyflowData.solarPanelsFactor,
              energyUsageFactor: energyflowData.energyUsageFactor,
              headers: energyflowData.headers,
              data: energyflowData.data,
            };
          } catch {
            energyflowCsvField.error = "Invalid CSV file.";
            return;
          }
        } else {
          const solarPanelsFactor =
            Number(currentFormFields.find((field) => field.name === "solarPanelsFactor")?.value) ||
            0;
          const energyUsageFactor =
            Number(currentFormFields.find((field) => field.name === "energyUsageFactor")?.value) ||
            0;
          currentStepData.energyflows[newItem.id] = {
            solarPanelsFactor,
            energyUsageFactor,
            headers: [],
            data: [],
          };
        }
      }

      await saveStorage();
      resetFormFields();
    }
  }

  function resetFormFields() {
    const currentFormFields = formData.formData[currentStep].formFields;
    currentFormFields.forEach((field) => {
      if (field.type !== "editor" && field.type !== "file") {
        field.value = "";
        delete field.error;
      } else if (!editingOption) {
        if (field.type === "editor") {
          field.value = getDefaultEditorValue(formData.formData[currentStep].stepType);
        }
      }
    });
  }

  function resetForm() {
    editingOption = null;
    resetFormFields();
    if (document.getElementById("editor")) {
      const currentStepData = formData.formData[currentStep];
      const editorField = currentStepData.formFields.find((field) => field.type === "editor");
      if (editorField) {
        const defaultValue = editingOption
          ? editorField.value
          : getDefaultEditorValue(currentStepData.stepType);
        // @ts-ignore
        const aceEditor = ace.edit("editor");
        aceEditor.setValue(defaultValue, -1);
      }
    }
  }

  function editOption(option: Option) {
    if (option.isDefault) return;
    editingOption = option;
    const currentStepData = formData.formData[currentStep];
    const currentFormFields = currentStepData.formFields;

    const nameField = currentFormFields.find((field) => field.name === "name");
    const descriptionField = currentFormFields.find((field) => field.name === "description");

    if (nameField) nameField.value = option.name;
    if (descriptionField) descriptionField.value = option.description;

    if (isTwinworldStep(currentStepData)) {
      const twinWorld = currentStepData.twinWorlds[option.id];
      const solarPanelField = currentFormFields.find(
        (field) => field.name === "solarPanelCapacity"
      );
      if (solarPanelField) solarPanelField.value = twinWorld.solarPanelCapacity.toString();
    } else if (isCostmodelStep(currentStepData)) {
      const costModel = currentStepData.costModels[option.id];
      const priceBuyField = currentFormFields.find(
        (field) => field.name === "priceNetworkBuyConsumer"
      );
      const priceSellField = currentFormFields.find(
        (field) => field.name === "priceNetworkSellConsumer"
      );
      const fixedRatioField = currentFormFields.find((field) => field.name === "fixedPriceRatio");
      const algorithmField = currentFormFields.find((field) => field.name === "algorithm");
      if (priceBuyField) priceBuyField.value = costModel.priceNetworkBuyConsumer.toString();
      if (priceSellField) priceSellField.value = costModel.priceNetworkSellConsumer.toString();
      if (fixedRatioField) fixedRatioField.value = costModel.fixedPriceRatio.toString();
      if (algorithmField) algorithmField.value = costModel.algorithm;
    } else if (isAlgoStep(currentStepData)) {
      const algo = currentStepData.algos[option.id];
      const maxTempField = currentFormFields.find((field) => field.name === "maxTemperature");
      const algorithmField = currentFormFields.find((field) => field.name === "algorithm");
      if (maxTempField) maxTempField.value = algo.maxTemperature.toString();
      if (algorithmField) algorithmField.value = algo.algorithm;
    } else if (isEnergyflowStep(currentStepData)) {
      const energyflow = currentStepData.energyflows[option.id];
      const solarPanelsFactorField = currentFormFields.find(
        (field) => field.name === "solarPanelsFactor"
      );
      const energyUsageFactorField = currentFormFields.find(
        (field) => field.name === "energyUsageFactor"
      );
      if (solarPanelsFactorField)
        solarPanelsFactorField.value = energyflow.solarPanelsFactor.toString();
      if (energyUsageFactorField)
        energyUsageFactorField.value = energyflow.energyUsageFactor.toString();
    }
  }

  async function deleteOption(option: Option) {
    if (option.isDefault) return;
    if (!confirm(`Are you sure you want to delete ${option.label}?`)) return;
    const currentStepData = formData.formData[currentStep];
    const optionIndex = currentStepData.options.findIndex((o) => o.id === option.id);
    if (optionIndex !== -1) {
      currentStepData.options.splice(optionIndex, 1);

      if (isTwinworldStep(currentStepData)) {
        delete currentStepData.twinWorlds[option.id];
      } else if (isCostmodelStep(currentStepData)) {
        delete currentStepData.costModels[option.id];
      } else if (isAlgoStep(currentStepData)) {
        delete currentStepData.algos[option.id];
      } else if (isEnergyflowStep(currentStepData)) {
        delete currentStepData.energyflows[option.id];
      }

      await saveStorage();
      if (selectedOptions[currentStep]?.id === option.id) {
        selectedOptions[currentStep] = null;
      }
      resetForm();
    }
  }

  function finish() {
    const twinworldItem = formData.formData.find(isTwinworldStep);
    const costModelItem = formData.formData.find(isCostmodelStep);
    const algoItem = formData.formData.find(isAlgoStep);
    const energyflowItem = formData.formData.find(isEnergyflowStep);

    const mappedOptions: StepperData = {
      twinworld:
        twinworldItem!.twinWorlds[selectedOptions[formData.formData.indexOf(twinworldItem!)]?.id],
      costmodel:
        costModelItem!.costModels[selectedOptions[formData.formData.indexOf(costModelItem!)]?.id],
      algo: algoItem!.algos[selectedOptions[formData.formData.indexOf(algoItem!)]?.id],
      energyflow:
        energyflowItem!.energyflows[
          selectedOptions[formData.formData.indexOf(energyflowItem!)]?.id
        ],
      energyflowlabel: selectedOptions[formData.formData.indexOf(energyflowItem!)].label,
    };

    stepperData.setStepperData(mappedOptions);
    dashboard.setDashboard(true);
    onComplete();
  }

  $effect(() => {
    if (currentStep >= 0 && document.getElementById("editor")) {
      // @ts-ignore
      const aceEditor = ace.edit("editor", {
        mode: "ace/mode/javascript",
        selectionStyle: "text",
        autoScrollEditorIntoView: true,
        animatedScroll: true,
        fontSize: "15px",
      });

      const currentFormFields = formData.formData[currentStep].formFields;
      const editorField = currentFormFields.find((field) => field.type === "editor");
      if (editorField?.value) {
        aceEditor.setValue(editorField.value, -1);
      } else {
        aceEditor.setValue("", -1);
      }
    }
  });

  onMount(async () => {
    await loadStorage();
  });
</script>

{#snippet progressbar()}
  <div class="flex w-full flex-col items-center">
    <div class="flex w-full">
      {#each formData.formData as step}
        <div class="flex-1 text-center">
          <span class="text-xs font-semibold text-white">{step.title}</span>
        </div>
      {/each}
    </div>

    <div class="flex w-full items-center">
      {#each formData.formData as _, index}
        <div class="flex flex-1 items-center">
          {#if index !== 0}
            <div class="h-0.5 flex-1 {selectedOptions[index - 1] ? 'bg-blue-500' : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}

          <button
            class="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition duration-300 focus:outline-hidden
              {selectedOptions[index] ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}
              {selectedOptions[index] && index !== currentStep ? 'hover:bg-sidebar' : ''}
              {index !== currentStep && !selectedOptions[index]
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer'}"
            onclick={() => goToStep(index)}
            disabled={!selectedOptions[index] && index !== currentStep}>
            {index + 1}
          </button>

          {#if index !== formData.formData.length - 1}
            <div class="h-0.5 flex-1 {selectedOptions[index] ? 'bg-blue-500' : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="mt-2 flex w-full">
      {#each formData.formData as _, index}
        <div class="flex-1 text-center">
          {#if selectedOptions[index]}
            <span class="text-xs">{selectedOptions[index].label}</span>
          {:else}
            <span class="text-xs">-</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet optionsCard()}
  <div class="flex w-full flex-col space-y-4 rounded-lg border-4 border-gray-400 bg-white p-4">
    <div class="flex w-full flex-col gap-8 md:flex-row">
      <div class="flex w-full flex-col md:w-1/2 md:pr-2">
        <h2 class="text-les-highlight mb-2 text-center text-3xl font-bold">Options</h2>
        <div class="flex flex-col flex-wrap gap-4">
          {#each formData.formData[currentStep].options as option}
            <div class="flex items-center justify-between">
              <button
                class="transform cursor-pointer font-semibold transition duration-300 ease-in-out hover:scale-105
                  {selectedOptions[currentStep] === option
                  ? 'text-blue-500'
                  : 'text-les-highlight'}"
                onmouseover={() => (hoveredOption = option)}
                onmouseout={() => (hoveredOption = null)}
                onfocus={() => (hoveredOption = option)}
                onblur={() => (hoveredOption = null)}
                onclick={() => selectOption(currentStep, option)}
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    selectOption(currentStep, option);
                  }
                }}>
                {option.label}
              </button>
              {#if !option.isDefault}
                <div class="flex space-x-2">
                  <button
                    class="cursor-pointer text-sm text-blue-500 hover:underline"
                    onclick={(e) => {
                      e.stopPropagation();
                      editOption(option);
                    }}>
                    Edit
                  </button>
                  <button
                    class="cursor-pointer text-sm text-red-500 hover:underline"
                    onclick={(e) => {
                      e.stopPropagation();
                      deleteOption(option);
                    }}>
                    Delete
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="flex w-full flex-col md:w-1/2 md:pl-2">
        <h2 class="text-les-highlight mb-2 text-center text-3xl font-bold">Description</h2>
        {#if hoveredOption}
          <p class="text-les-highlight">{hoveredOption.description}</p>
        {:else if formData.formData[currentStep].options.length > 0}
          {#if selectedOptions[currentStep]}
            <p class="text-les-highlight">{selectedOptions[currentStep].description}</p>
          {:else}
            <p class="text-les-highlight">
              {formData.formData[currentStep].options[0].description}
            </p>
          {/if}
        {/if}
      </div>
    </div>

    <div class="flex w-full flex-col justify-between space-y-4 pt-4 md:flex-row md:space-y-0">
      <button
        onclick={previousStep}
        class="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors duration-300 disabled:opacity-50
        {currentStep !== 0 ? 'cursor-pointer hover:bg-gray-400' : 'cursor-not-allowed'}"
        disabled={currentStep === 0}>
        Previous
      </button>
      {#if currentStep < formData.formData.length - 1}
        <button
          onclick={nextStep}
          class="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors duration-300 disabled:opacity-50
          {selectedOptions[currentStep] === null
            ? 'cursor-not-allowed'
            : 'cursor-pointer hover:bg-blue-600'}"
          disabled={selectedOptions[currentStep] === null ||
            currentStep === formData.formData.length - 1}>
          Next
        </button>
      {:else}
        <button
          onclick={finish}
          class="cursor-pointer rounded-md px-4 py-2 text-white transition-colors duration-300"
          class:cursor-not-allowed={selectedOptions[currentStep] === null}
          class:bg-gray-300={selectedOptions[currentStep] === null}
          class:bg-les-highlight={selectedOptions[currentStep] !== null}
          class:hover:bg-sidebar={selectedOptions[currentStep] !== null}
          disabled={selectedOptions[currentStep] === null}>
          Finish
        </button>
      {/if}
    </div>
  </div>
{/snippet}

{#snippet cardform()}
  <div class="flex w-full flex-col space-y-4 rounded-lg border-4 border-gray-400 bg-white p-4">
    <h2 class="text-les-highlight mb-4 text-center text-3xl font-bold">
      {editingOption
        ? `Edit ${formData.formData[currentStep].title}`
        : `Create Custom ${formData.formData[currentStep].title}`}
    </h2>

    <form class="flex flex-wrap gap-4" onsubmit={createOrUpdateCustomItem}>
      {#each formData.formData[currentStep].formFields as field (field.name)}
        <div class="w-full">
          <label class="text-les-highlight mb-1 block font-medium" for={field.name}>
            {field.label}
            {field.required ? "*" : ""}
          </label>
          {#if field.description}
            <p class="mb-2 text-sm text-gray-500">{field.description}</p>
          {/if}

          {#if field.type === "input"}
            <input
              type={field.dataType === "int" || field.dataType === "float" ? "number" : "text"}
              id={field.name}
              bind:value={field.value}
              placeholder={field.placeholder}
              min={field.min}
              step={field.step}
              class="text-les-highlight w-full rounded-lg border-2 p-2 {field.error
                ? 'border-red-500'
                : 'border-gray-300'}" />
          {/if}

          {#if field.type === "textarea"}
            <textarea
              id={field.name}
              bind:value={field.value}
              placeholder={field.placeholder}
              rows="4"
              class="text-les-highlight w-full rounded-lg border-2 p-2 {field.error
                ? 'border-red-500'
                : 'border-gray-300'}"></textarea>
          {/if}

          {#if field.type === "editor"}
            <div
              id="editor"
              class="h-40 w-full rounded-lg border-2 {field.error
                ? 'border-red-500'
                : 'border-gray-300'}">
            </div>
          {/if}

          {#if field.type === "file"}
            <input
              type="file"
              id={field.name}
              accept=".csv,text/csv"
              class="text-les-highlight w-full rounded-lg border-2 p-2 {field.error
                ? 'border-red-500'
                : 'border-gray-300'}" />
          {/if}

          {#if field.error}
            <p class="mt-1 text-sm text-red-500">{field.error}</p>
          {/if}
        </div>
      {/each}

      <button
        type="submit"
        class="w-full cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-white transition-colors duration-300 hover:bg-blue-600">
        {editingOption ? "Update" : "Create"}
      </button>
      {#if editingOption}
        <button
          type="button"
          onclick={resetForm}
          class="mt-2 w-full cursor-pointer rounded-md bg-gray-500 px-4 py-2 text-white transition-colors duration-300 hover:bg-gray-600">
          Cancel
        </button>
      {/if}
    </form>
  </div>
{/snippet}

{#snippet twinWorldCard()}
  {@const twinworld = getSelectedTwinWorld()!}
  <div
    class="text-les-highlight flex w-full flex-col space-y-4 rounded-lg border-4 border-gray-400 bg-white p-6 shadow-lg">
    <h2 class="mb-6 text-center text-2xl font-bold">
      Manage Twin World: {twinworld.name || "No Twin World Selected"}
    </h2>

    <div class="flex flex-col space-y-6">
      <button
        class="flex w-fit cursor-pointer items-center rounded-md bg-blue-500 px-4 py-2 text-white transition duration-300 hover:bg-blue-600"
        onclick={addHousehold}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mr-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4" />
        </svg>
        Add Household
      </button>

      {#each twinworld.households as household, hIndex}
        <div class="flex flex-col space-y-4 rounded-lg border-2 border-gray-300 bg-gray-50 p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button
                class="flex cursor-pointer items-center justify-center rounded-full bg-gray-200 p-2 transition duration-300 hover:bg-gray-300"
                onclick={() => toggleFold(hIndex)}
                aria-label={foldedHouseholds[hIndex] ? "Expand Household" : "Collapse Household"}>
                {#if foldedHouseholds[hIndex]}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z"
                      clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.061 6.29 11.77a.75.75 0 11-1.06-1.06l4.24-4.25a.75.75 0 01-.02 1.06z"
                      clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>
              <input
                type="text"
                bind:value={household.name}
                placeholder="Household Name"
                class="w-3/4 rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <button
              class="flex cursor-pointer items-center text-red-500 transition hover:underline"
              onclick={() => deleteHousehold(hIndex)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mr-1 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
              Delete
            </button>
          </div>

          {#if !foldedHouseholds[hIndex]}
            <div
              class="mt-4 grid grid-cols-1 gap-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 md:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-blue-700" for={`size-${hIndex}`}>
                  Household Size
                </label>
                <input
                  type="number"
                  id={`size-${hIndex}`}
                  bind:value={household.size}
                  min="1"
                  class="w-full rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter number of members" />
              </div>
              <div>
                <label
                  class="mb-1 block text-sm font-medium text-blue-700"
                  for={`energyUsage-${hIndex}`}>
                  Energy Usage (kWh)
                </label>
                <input
                  type="number"
                  id={`energyUsage-${hIndex}`}
                  bind:value={household.energyUsage}
                  min="0"
                  class="w-full rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter energy usage" />
              </div>
              <div>
                <label
                  class="mb-1 block text-sm font-medium text-blue-700"
                  for={`solarPanels-${hIndex}`}>
                  Solar Panels
                </label>
                <input
                  type="number"
                  id={`solarPanels-${hIndex}`}
                  bind:value={household.solarPanels}
                  min="0"
                  class="w-full rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter number of solar panels" />
              </div>
            </div>

            <div class="mt-6 flex flex-col space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-semibold">Appliances</h4>
                <button
                  class="flex items-center rounded-md bg-blue-500 px-3 py-2 text-white transition hover:bg-blue-600"
                  onclick={() => addAppliance(hIndex)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4" />
                  </svg>
                  Add Appliance
                </button>
              </div>
              {#each household.appliances! as appliance, aIndex}
                <div
                  class="flex flex-col space-y-4 rounded-lg border-2 border-gray-300 bg-gray-100 p-5">
                  <div class="flex items-center space-x-3">
                    <button
                      class="flex cursor-pointer items-center justify-center rounded-full bg-gray-200 p-2 transition duration-300 hover:bg-gray-300"
                      onclick={() => toggleApplianceFold(hIndex, aIndex)}
                      aria-label={foldedAppliances[hIndex][aIndex]
                        ? "Expand Appliance"
                        : "Collapse Appliance"}>
                      {#if foldedAppliances[hIndex][aIndex]}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      {:else}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 14l-7 7m0 0l-7-7m7 7V2" />
                        </svg>
                      {/if}
                    </button>

                    <select
                      id={`appliance-select-${hIndex}-${aIndex}`}
                      bind:value={appliance.name}
                      onchange={(e: Event) =>
                        handleApplianceTypeChange(
                          hIndex,
                          aIndex,
                          (e.target as HTMLSelectElement).value as ApplianceType
                        )}
                      class="flex-grow rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option disabled value="">Select Appliance</option>
                      {#each getAvailableApplianceTypes(household, appliance.name) as type}
                        <option value={type}>{type}</option>
                      {/each}
                    </select>

                    <button
                      class="flex cursor-pointer items-center text-red-500 transition hover:underline"
                      onclick={() => deleteAppliance(hIndex, aIndex)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="mr-1 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Delete
                    </button>
                  </div>

                  {#if !foldedAppliances[hIndex][aIndex]}
                    <div class="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label
                          class="mb-1 block text-sm font-medium"
                          for={`power-${hIndex}-${aIndex}`}>
                          Power (W)
                        </label>
                        <input
                          type="number"
                          id={`power-${hIndex}-${aIndex}`}
                          bind:value={appliance.power}
                          min="0"
                          class="w-full rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Enter power in watts" />
                      </div>
                      <div>
                        <label
                          class="mb-1 block text-sm font-medium"
                          for={`duration-${hIndex}-${aIndex}`}>
                          Duration (hours)
                        </label>
                        <input
                          type="number"
                          id={`duration-${hIndex}-${aIndex}`}
                          bind:value={appliance.duration}
                          min="0"
                          class="w-full rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Enter duration in hours" />
                      </div>
                      <div>
                        <label
                          class="mb-1 block text-sm font-medium"
                          for={`dailyUsage-${hIndex}-${aIndex}`}>
                          Daily Usage (times)
                        </label>
                        <input
                          type="number"
                          id={`dailyUsage-${hIndex}-${aIndex}`}
                          bind:value={appliance.dailyUsage}
                          min="0"
                          class="w-full rounded-lg border-2 border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Enter daily usage times" />
                      </div>
                    </div>

                    <div class="mt-4">
                      {#each appliance.timeDaily as time}
                        <div class="mb-4">
                          <label class="mb-2 block font-semibold" for="time-{time.day}">
                            {daysOfWeek[time.day - 1]}
                          </label>
                          <div class="grid grid-cols-6 gap-2">
                            {#each Array(24) as _, hour}
                              <label class="flex items-center space-x-1 text-xs">
                                <input
                                  type="checkbox"
                                  bind:group={time.bitmapWindow}
                                  value={hour}
                                  class="rounded text-blue-600 focus:ring-blue-500" />
                                <span>{hour}:00</span>
                              </label>
                            {/each}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

<div class="mx-auto flex max-w-3xl flex-col items-center justify-center space-y-8 px-2 py-8">
  <button
    onclick={async () => await wipeStorage()}
    class="cursor-pointer rounded-md bg-red-700 px-4 py-2 text-white transition-colors duration-300 hover:bg-red-800">
    Clear Storage
  </button>

  {@render progressbar()}
  {@render optionsCard()}
  {@render cardform()}
  {#if currentStep === 0 && selectedOptions[0] && isTwinworldStep(formData.formData[currentStep]) && !selectedOptions[0].isDefault}
    {@render twinWorldCard()}
  {/if}
</div>
