<script lang="ts">
  import { onMount } from "svelte";
  import { getDashboard, getStepperData } from "./state.svelte";
  import { getSteps } from "./steps.svelte";
  import { defaultTwinWorlds } from "./twinworld";
  import { isAvailable, setAvailability } from "./timewindow";
  import { readCSV } from "./utils.ts";

  const steps: Step[] = getSteps().steps;
  const stepperData = getStepperData();

  let editor: HTMLElement | null = $state(null);

  let editMode: boolean = $state(false);
  let editedOption: Option | null = $state(null);
  let currentStep: number = $state(0);
  let selectedOption: Option | null = $state(null);
  let hoveredOption: Option | null = $state(null);
  let selectedOptions: (Option | null)[] = $state(Array(steps.length).fill(null));

  let households: Household[] = $state([]);
  let newHouseholdName: string = $state("");
  let editHouseholdId: string | null = $state(null);
  let newApplianceNames: Record<string, string> = $state({});
  let editApplianceIds: Record<string, string | null> = $state({});
  let openAppliances: Record<string, Record<string, boolean>> = $state({});

  let appData: AppData = $state({
    stepperData: {
      steps: steps.map((step) => ({
        title: step.title,
        selectedOption: null,
        formData: null,
        twinWorld: step.title === "Twin World" ? { description: "", households: [] } : undefined,
        energyflow: undefined,
      })),
    },
    customOptions: {},
    households: [],
  });

  function wipestorage() {
    if (localStorage.getItem("appData") !== null) {
      localStorage.clear();
      location.reload();
    }
  }

  function saveAppData() {
    localStorage.setItem("appData", JSON.stringify(appData));
  }

  async function loadDefaultEnergyflow(): Promise<Energyflow | null> {
    try {
      return await readCSV("/energyflowZoetermeer.csv");
    } catch (error) {
      console.error("Error loading default energyflow data:", error);
      return null;
    }
  }

  function loadAppData() {
    const storedData = localStorage.getItem("appData");
    if (storedData) {
      try {
        appData = JSON.parse(storedData);
        stepperData.setStepperData(appData.stepperData);
        households = appData.households;

        for (let i = 0; i < steps.length; i++) {
          const customOptions = appData.customOptions[i] || [];
          for (const customOption of customOptions) {
            steps[i].options.push(customOption.option);
          }
        }
      } catch (error) {
        console.error("Failed to parse appData from localStorage:", error);
        initializeDefaultData();
      }
    } else {
      initializeDefaultData();
    }
  }

  function initializeDefaultData() {
    appData = {
      stepperData: {
        steps: steps.map((step) => ({
          title: step.title,
          selectedOption: null,
          formData: null,
          twinWorld: step.title === "Twin World" ? { description: "", households: [] } : undefined,
          energyflow: undefined,
        })),
      },
      customOptions: {},
      households: [],
    };
    saveAppData();
  }

  function goToStep(index: number) {
    if (selectedOptions[index] || index === currentStep) {
      currentStep = index;
      selectedOption = selectedOptions[currentStep];
      hoveredOption = null;
      editMode = false;
      editedOption = null;
      newHouseholdName = "";
      editHouseholdId = null;
    }
  }

  function nextStep() {
    if (selectedOption) {
      selectedOptions[currentStep] = selectedOption;
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        selectedOption = selectedOptions[currentStep];
        hoveredOption = null;
        editMode = false;
        editedOption = null;
        newHouseholdName = "";
        editHouseholdId = null;
      }
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      currentStep -= 1;
      selectedOption = selectedOptions[currentStep];
      hoveredOption = null;
      editMode = false;
      editedOption = null;
      newHouseholdName = "";
      editHouseholdId = null;
    }
  }

  async function finish() {
    if (selectedOption) {
      selectedOptions[currentStep] = selectedOption;
    }

    const updatedSteps = [];

    for (const [index, step] of steps.entries()) {
      const selected = selectedOptions[index];
      const stepData: {
        title: string;
        selectedOption: Option | null;
        formData: { [key: string]: any } | null;
        twinWorld?: TwinWorld;
        energyflow?: Energyflow;
      } = {
        title: step.title,
        selectedOption: selected,
        formData: selected ? getFormData(step.formFields) : null,
      };

      if (step.title === "Twin World" && selected) {
        if (!selected.isCustom) {
          const twinWorldData =
            defaultTwinWorlds[selected.label as keyof typeof defaultTwinWorlds];
          if (twinWorldData) {
            stepData.twinWorld = twinWorldData;
          }
        } else {
          stepData.twinWorld = {
            description: "Custom Twin World",
            households: households,
          };
        }
      }

      if (index === 3 && selected && selected.label === "Energyflow Zoetermeer") {
        const energyflow = await loadDefaultEnergyflow();
        if (!energyflow) {
          throw new Error("Failed to load default energy flow.");
        }
        stepData.energyflow = energyflow;
      }

      updatedSteps.push(stepData);
    }

    appData.stepperData.steps = updatedSteps;

    stepperData.setStepperData(appData.stepperData);
    appData.households = households;
    saveAppData();
    getDashboard().setDashboard(true);
  }

  function selectOption(option: Option) {
    selectedOption = option;
  }

  function getAvailableAppliances(household: Household): string[] {
    const allAppliances: ApplianceTypes[] = [
      "Washing Machine",
      "Tumble Dryer",
      "Dishwasher",
      "Stove",
      "Electric Vehicle",
    ];
    const addedAppliances = household.appliances?.map((a) => a.name) || [];
    return allAppliances.filter((appliance) => !addedAppliances.includes(appliance));
  }

  function validateField(field: FormField): boolean {
    if (field.required) {
      if (field.type === "file" && !field.file) {
        field.error = "This field is required.";
        return false;
      } else if (field.type !== "file" && (!field.value || field.value.trim() === "")) {
        field.error = "This field is required.";
        return false;
      }
    }

    if (field.type !== "file" && field.value && field.dataType) {
      const value = field.value.trim();
      const numValue = parseFloat(value);
      if (field.dataType === "int" && !/^\d+$/.test(value)) {
        field.error = "Please enter a valid integer.";
        return false;
      }
      if (field.dataType === "float" && isNaN(numValue)) {
        field.error = "Please enter a valid number.";
        return false;
      }
      if ((field.dataType === "int" || field.dataType === "float") && !isNaN(numValue)) {
        if (field.min !== undefined && numValue < field.min) {
          field.error = `Value must be at least ${field.min}.`;
          return false;
        }
        if (field.max !== undefined && numValue > field.max) {
          field.error = `Value must be at most ${field.max}.`;
          return false;
        }
      }
    }

    field.error = "";
    return true;
  }

  function validateForm(fields: FormField[]): boolean {
    let isValid = true;
    for (const field of fields) {
      if (!validateField(field)) {
        isValid = false;
      }
    }
    return isValid;
  }

  function getFormData(fields: FormField[]): { [key: string]: any } {
    const data: any = {};
    for (const field of fields) {
      data[field.label] = field.value;
    }
    return data;
  }

  function handleFileChange(field: FormField, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      field.file = file;
    } else {
      field.file = undefined;
    }
  }

  function submitForm(e: Event) {
    e.preventDefault();
    const fields = steps[currentStep].formFields;

    const editorField = fields.find((field) => field.type === "editor");
    if (editorField && editor) {
      // @ts-ignore
      const aceEditor = ace.edit("editor");
      editorField.value = aceEditor.getValue();
    }

    const nameField = fields.find((f) => f.label === "Name");
    const descriptionField = fields.find((f) => f.label === "Description");

    if (!nameField?.value || !descriptionField?.value) {
      console.error("Name and Description are required to create or edit an option.");
      return;
    }

    const formData = getFormData(fields);
    const fileField = fields.find((field) => field.type === "file");

    const handleNewOrEditedOption = (energyflow?: Energyflow) => {
      if (editMode && editedOption) {
        const customOption = appData.customOptions[currentStep]?.find(
          (co) => co.id === editedOption?.id
        );
        if (customOption) {
          customOption.option.label = nameField.value ?? "";
          customOption.option.description = descriptionField.value ?? "";
          customOption.option.energyflow = energyflow || customOption.option.energyflow;
          customOption.formData = formData;

          saveAppData();

          const optionIndex = steps[currentStep].options.findIndex(
            (opt) => opt.id === editedOption?.id
          );
          if (optionIndex !== -1) {
            steps[currentStep].options[optionIndex] = customOption.option;
          }

          if (selectedOption && selectedOption.id === editedOption.id) {
            selectedOption = customOption.option;
          }

          selectedOptions[currentStep] = customOption.option;
        }
        editMode = false;
        editedOption = null;
      } else {
        const customOptionId =
          "customOption_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        const customOption: CustomOption = {
          id: customOptionId,
          option: {
            label: nameField.value ?? "",
            description: descriptionField.value ?? "",
            id: customOptionId,
            isCustom: true,
            energyflow,
          },
          formData,
        };

        if (!appData.customOptions[currentStep]) {
          appData.customOptions[currentStep] = [];
        }
        appData.customOptions[currentStep].push(customOption);
        steps[currentStep].options.push(customOption.option);
        selectedOption = customOption.option;
        saveAppData();
      }
    };

    if (fileField?.file) {
      readCSV(fileField.file)
        .then((energyflow) => {
          handleNewOrEditedOption(energyflow);
        })
        .catch((error) => {
          console.error("Error reading file:", error);
          fileField.error = `Error reading file: ${error.message}`;
        });
    } else {
      handleNewOrEditedOption();
    }

    if (validateForm(fields)) {
      saveHouseholds();
    }
  }

  function deleteCustomOption(option: Option) {
    if (!confirm(`Are you sure you want to delete ${option.label}?`)) return;
    const stepIndex = currentStep;
    const customOptions = appData.customOptions[stepIndex] || [];

    const updatedCustomOptions = customOptions.filter((co) => co.id !== option.id);
    appData.customOptions[stepIndex] = updatedCustomOptions;
    saveAppData();

    steps[stepIndex].options = steps[stepIndex].options.filter((opt) => opt.id !== option.id);

    if (selectedOption?.id === option.id) {
      selectedOption = null;
    }

    saveHouseholds();
  }

  function editCustomOption(option: Option) {
    const stepIndex = currentStep;
    const customOptions = appData.customOptions[stepIndex] || [];

    const customOption = customOptions.find((co) => co.id === option.id);
    if (customOption) {
      const fields = steps[currentStep].formFields;
      for (const field of fields) {
        field.value = customOption.formData[field.label];

        if (field.type === "editor" && editor) {
          // @ts-ignore
          const aceEditor = ace.edit("editor");
          aceEditor.setValue(customOption.formData[field.label] || "", -1);
        }
      }
      editMode = true;
      editedOption = option;
    }
  }

  function cancelEdit() {
    editMode = false;
    editedOption = null;
    const fields = steps[currentStep].formFields;

    if (editor) {
      // @ts-ignore
      const aceEditor = ace.edit("editor");
      aceEditor.setValue("", -1);
    }

    for (const field of fields) {
      field.value = "";
    }
  }

  function addHousehold() {
    if (!newHouseholdName.trim()) return;
    if (households.find((h) => h.name === newHouseholdName.trim())) return;
    const newHousehold: Household = {
      id: households.length + 1,
      name: newHouseholdName.trim(),
      size: 1,
      energyUsage: 0,
      solarPanels: 0,
      solarYieldYearly: 0,
      appliances: [],
    };
    households.push(newHousehold);
    newHouseholdName = "";
    appData.households = households;
    saveAppData();
  }

  function editHousehold(household: Household) {
    editHouseholdId = household.name;
    newHouseholdName = household.name;
  }

  function updateHousehold() {
    if (!newHouseholdName.trim() || !editHouseholdId) return;
    const existing = households.find(
      (h) => h.name === newHouseholdName.trim() && h.name !== editHouseholdId
    );
    if (existing) return;
    const household = households.find((h) => h.name === editHouseholdId);
    if (household) {
      household.name = newHouseholdName.trim();
      appData.households = households;
      saveAppData();
      editHouseholdId = null;
      newHouseholdName = "";
    }
  }

  function deleteHousehold(household: Household) {
    if (!confirm(`Delete household ${household.name}?`)) return;
    households = households.filter((h) => h.name !== household.name);
    appData.households = households;
    saveAppData();
  }

  function saveHouseholds() {
    // Update the Twin World step with the latest households
    const twinWorldStep = appData.stepperData.steps.find((s) => s.title === "Twin World");
    if (twinWorldStep && twinWorldStep.twinWorld) {
      twinWorldStep.twinWorld.households = [...households];
      appData.stepperData.steps = appData.stepperData.steps.map((s) =>
        s.title === "Twin World" ? twinWorldStep : s
      );
      saveAppData();
    }
  }

  function addAppliance(household: Household) {
    const name = newApplianceNames[household.name] || "";
    if (!name.trim()) return;
    if (household.appliances?.find((a) => a.name === name.trim())) return;
    // TODO: is id here ok?
    const newAppliance: Appliance = {
      id: household.appliances!.length + 1,
      name: name.trim() as ApplianceTypes,
      power: 0,
      duration: 0,
      dailyUsage: 0,
      timeDaily: [],
    };
    if (!household.appliances) {
      household.appliances = [];
    }
    household.appliances.push(newAppliance);
    newApplianceNames = { ...newApplianceNames, [household.name]: "" };
    appData.households = households;
    saveAppData();
  }

  function updateAppliance(household: Household) {
    const name = newApplianceNames[household.name] || "";
    const editId = editApplianceIds[household.name];
    if (!name.trim() || !editId) return;
    for (const h of households) {
      const existing = h.appliances?.find((a) => a.name === name.trim() && a.name !== editId);
      if (existing) return;
    }
    for (const h of households) {
      const appliance = h.appliances?.find((a) => a.name === editId);
      if (appliance) {
        appliance.name = name.trim() as ApplianceTypes;
        appData.households = households;
        saveAppData();
        editApplianceIds = { ...editApplianceIds, [household.name]: null };
        newApplianceNames = { ...newApplianceNames, [household.name]: "" };
        households = [...households];
        break;
      }
    }
  }

  function deleteAppliance(appliance: Appliance, household: Household) {
    if (!confirm(`Delete appliance ${appliance.name}?`)) return;
    household.appliances = household.appliances?.filter((a) => a.name !== appliance.name);
    appData.households = households;
    saveAppData();
  }

  function toggleAvailability(householdName: string, applianceName: string) {
    if (!openAppliances[householdName]) {
      openAppliances = { ...openAppliances, [householdName]: {} };
    }
    openAppliances[householdName][applianceName] = !openAppliances[householdName][applianceName];
    openAppliances = { ...openAppliances };
  }

  function handleAvailabilityChange(appliance: Appliance, hour: number, event: Event) {
    const target = event.target as HTMLInputElement;

    // TODO: this shit doesnt work. it is not specific to a day
    appliance.availability = setAvailability(appliance.availability, hour, target.checked);

    appData.households = households;
    saveAppData();
  }

  $effect(() => {
    if (editor && document.getElementById("editor")) {
      // @ts-ignore
      let aceEditor = ace.edit("editor", {
        mode: "ace/mode/javascript",
        selectionStyle: "text",
        autoScrollEditorIntoView: true,
        animatedScroll: true,
        fontSize: "15px",
      });
      const currentFormFields = steps[currentStep].formFields;
      const editorField = currentFormFields.find((field) => field.type === "editor");
      if (editorField && editorField.value) {
        aceEditor.setValue(editorField.value, -1);
      }
    }
  });

  onMount(() => loadAppData());
</script>

{#snippet progressBar(steps: string[], selectedOptions: (Option | null)[], currentStep: number)}
  <div class="flex flex-col items-center w-full">
    <div class="flex w-full mb-2">
      {#each steps as step}
        <div class="flex-1 text-center">
          <span class="text-xs font-semibold text-white">{step}</span>
        </div>
      {/each}
    </div>

    <div class="flex items-center w-full">
      {#each steps as _, index}
        <div class="flex items-center flex-1">
          {#if index !== 0}
            <div
              class="flex-1 h-0.5 {selectedOptions[index - 1]
                ? 'bg-les-highlight'
                : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}

          <button
            class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center focus:outline-hidden z-10
            {selectedOptions[index] ? 'bg-les-highlight text-white' : 'bg-gray-300 text-gray-600'}
            {selectedOptions[index] && index !== currentStep ? 'hover:bg-sidebar' : ''}
            disabled:opacity-50"
            onclick={() => goToStep(index)}
            disabled={!selectedOptions[index] && index !== currentStep}>
            {index + 1}
          </button>

          {#if index !== steps.length - 1}
            <div
              class="flex-1 h-0.5 {selectedOptions[index] ? 'bg-les-highlight' : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex w-full mt-2">
      {#each steps as _, index}
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

{#snippet cardoptions(title: string, options: Option[])}
  <div class="rounded-lg border-4 border-gray-400 bg-white p-6 w-full shadow-lg">
    <h1 class="text-2xl text-center text-les-highlight font-bold">{title}</h1>
    <div class="flex flex-col lg:flex-row">
      <div class="lg:w-1/2 p-4">
        <h2 class="text-2xl font-semibold mb-4 text-les-highlight">Options</h2>
        <ul class="space-y-2">
          {#each options as option}
            <li class="flex items-center">
              <button
                class="cursor-pointer hover:underline {selectedOption &&
                selectedOption.label === option.label
                  ? 'text-sidebar font-bold'
                  : 'text-les-highlight'} flex-1 text-left"
                onmouseenter={() => (hoveredOption = option)}
                onmouseleave={() => (hoveredOption = null)}
                onclick={() => selectOption(option)}>
                {option.label}
              </button>
              {#if option.isCustom}
                <button
                  class="text-les-highlight hover:underline ml-2"
                  onclick={() => editCustomOption(option)}>
                  Edit
                </button>
                <button
                  class="text-red-500 hover:underline ml-2"
                  onclick={() => deleteCustomOption(option)}>
                  Delete
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      </div>

      <div class="w-full h-0.5 bg-gray-300 lg:w-0.5 lg:h-72 lg:self-center"></div>

      <div class="lg:w-1/2 p-4">
        <h2 class="text-2xl font-semibold mb-4 text-les-highlight">Description</h2>
        <p class="text-gray-700">
          {#if hoveredOption}
            {hoveredOption.description}
          {:else if selectedOption}
            {selectedOption.description}
          {:else}
            {options[0]?.description}
          {/if}
        </p>
      </div>
    </div>
    <div class="flex justify-between mt-4">
      <button
        class="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50 transition-colors duration-200
        {currentStep !== 0 ? 'hover:bg-gray-400 cursor-pointer' : 'cursor-not-allowed'}"
        onclick={previousStep}
        disabled={currentStep === 0}>
        Previous
      </button>
      {#if currentStep < steps.length - 1}
        <button
          class="bg-les-highlight text-white px-4 py-2 rounded disabled:opacity-50 transition-colors duration-200
          {selectedOption ? 'hover:bg-sidebar cursor-pointer' : 'cursor-not-allowed'}"
          onclick={nextStep}
          disabled={!selectedOption}>
          Next
        </button>
      {:else}
        <button
          class="bg-les-highlight text-white px-4 py-2 rounded disabled:opacity-50 transition-colors duration-200
          {selectedOption ? 'hover:bg-sidebar cursor-pointer' : 'cursor-not-allowed'}"
          onclick={async () => await finish()}
          disabled={!selectedOption}>
          Finish
        </button>
      {/if}
    </div>
  </div>
{/snippet}

{#snippet cardforms(title: string, fields: FormField[])}
  <div class="rounded-lg border-4 border-gray-400 bg-white p-6 w-full shadow-lg">
    <h1 class="text-2xl text-center text-les-highlight font-bold">
      {editMode ? "Edit Custom " + editedOption?.label : title}
    </h1>
    <form class="space-y-4" onsubmit={submitForm}>
      {#each fields as field}
        <div class="flex flex-col">
          <label class="text-les-highlight font-semibold mb-1" for={field.label}>
            {field.label}
          </label>
          {#if field.description}
            <span class="text-gray-500 text-sm mb-2">{field.description}</span>
          {/if}

          {#if field.type === "input"}
            <input
              type="text"
              class="border-2 border-gray-300 rounded-lg p-2 w-full text-les-highlight focus:outline-hidden focus:ring-2 focus:ring-les-highlight"
              placeholder={field.placeholder}
              bind:value={field.value}
              required={field.required}
              oninput={() => validateField(field)} />
          {/if}

          {#if field.type === "textarea"}
            <textarea
              class="border-2 border-gray-300 rounded-lg p-2 w-full text-les-highlight focus:outline-hidden focus:ring-2 focus:ring-les-highlight"
              placeholder={field.placeholder}
              bind:value={field.value}
              required={field.required}
              rows="5"
              oninput={() => validateField(field)}></textarea>
          {/if}

          {#if field.type === "editor"}
            <div
              bind:this={editor}
              id="editor"
              class="border-2 border-gray-300 rounded-lg p-2 h-64 text-les-highlight">
            </div>
          {/if}
          {#if field.error}
            <span class="text-red-500 text-sm mt-1">{field.error}</span>
          {/if}

          {#if field.type === "file"}
            <input
              type="file"
              class="border-2 border-gray-300 rounded-lg p-2 w-full text-les-highlight focus:outline-hidden focus:ring-2 focus:ring-les-highlight"
              onchange={(event) => handleFileChange(field, event)} />
            {#if field.file}
              <span class="text-green-500 text-sm mt-1">Selected File: {field.file.name}</span>
            {/if}
          {/if}
        </div>
      {/each}
      <div class="flex space-x-4">
        <button
          type="submit"
          class="bg-les-highlight text-white px-4 py-2 rounded-sm transition-colors duration-200 hover:bg-sidebar cursor-pointer">
          {editMode ? "Update" : "Create"}
        </button>
        {#if editMode}
          <button
            type="button"
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded-sm transition-colors duration-200 hover:bg-gray-400 cursor-pointer"
            onclick={cancelEdit}>
            Cancel
          </button>
        {/if}
      </div>
    </form>
  </div>
{/snippet}

{#snippet customTwinWorld()}
  <div class="rounded-lg border-4 border-gray-400 bg-white p-4 shadow-lg w-full">
    <h2 class="text-xl text-center text-les-highlight font-bold mb-4">Households</h2>
    <div class="space-y-4">
      <div>
        <input
          type="text"
          class="border-2 border-gray-300 rounded-lg p-2 w-full text-les-highlight focus:outline-hidden focus:ring-2 focus:ring-les-highlight"
          placeholder="Household Name"
          bind:value={newHouseholdName}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              editHouseholdId ? updateHousehold() : addHousehold();
            }
          }} />
        {#if households.some((h) => h.name === newHouseholdName.trim())}
          <span class="text-red-500 text-sm mt-1">Household name already exists.</span>
        {/if}
        {#if editHouseholdId}
          <div class="flex space-x-2 mt-2">
            <button
              class="bg-les-highlight text-white px-3 py-1 rounded-sm hover:bg-sidebar transition cursor-pointer"
              onclick={updateHousehold}>
              Update
            </button>
            <button
              class="bg-gray-300 text-gray-700 px-3 py-1 rounded-sm hover:bg-gray-400 transition cursor-pointer"
              onclick={() => {
                editHouseholdId = null;
                newHouseholdName = "";
              }}>
              Cancel
            </button>
          </div>
        {:else}
          <button
            class={`text-white px-3 py-1 rounded transition w-full mt-2 cursor-pointer
              ${
                households.some((h) => h.name === newHouseholdName.trim()) ||
                !newHouseholdName.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-les-highlight cursor-pointer hover:bg-sidebar"
              }`}
            onclick={addHousehold}
            disabled={households.some((h) => h.name === newHouseholdName.trim()) ||
              !newHouseholdName.trim()}>
            Add
          </button>
        {/if}
      </div>
      <ul class="space-y-3">
        {#each households as household}
          <li class="border border-gray-300 p-3 rounded-sm">
            <div class="flex justify-between items-center">
              <span class="font-semibold text-les-highlight">
                {household.name}
              </span>
              <div class="space-x-1">
                <button
                  class="text-les-highlight text-sm hover:underline cursor-pointer"
                  onclick={() => editHousehold(household)}>
                  Edit
                </button>
                <button
                  class="text-red-500 text-sm hover:underline cursor-pointer"
                  onclick={() => deleteHousehold(household)}>
                  Delete
                </button>
              </div>
            </div>
            <div class="mt-2 ml-2">
              <h3 class="font-semibold text-les-highlight text-sm mb-1">Appliances</h3>
              <select
                class="border border-gray-300 rounded-sm p-2 w-full text-les-highlight focus:outline-hidden focus:ring-3 focus:ring-les-highlight text-sm"
                bind:value={newApplianceNames[household.name]}
                onkeydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    editApplianceIds[household.name]
                      ? updateAppliance(household)
                      : addAppliance(household);
                  }
                }}>
                <option disabled value="">Select Appliance</option>
                {#each getAvailableAppliances(household) as appliance}
                  <option value={appliance}>{appliance}</option>
                {/each}
              </select>
              <button
                class={`text-white px-2 py-1 rounded transition w-full mt-1 text-sm
                    ${!newApplianceNames[household.name]?.trim() ? "bg-gray-400 cursor-not-allowed" : "bg-les-highlight cursor-pointer hover:bg-sidebar"}`}
                onclick={() => addAppliance(household)}
                disabled={!newApplianceNames[household.name]?.trim()}>
                Add
              </button>
              <ul class="space-y-1 mt-2">
                {#each household.appliances! as appliance}
                  <li class="border border-gray-200 p-2 rounded-sm">
                    <div class="flex justify-between items-center">
                      <span class="text-les-highlight text-sm font-bold">
                        {appliance.name}
                      </span>
                      <button
                        class="text-red-500 text-xs hover:underline cursor-pointer"
                        onclick={() => deleteAppliance(appliance, household)}>
                        Delete
                      </button>
                    </div>
                    <button
                      class="mt-2 text-les-highlight text-sm underline cursor-pointer"
                      onclick={() => toggleAvailability(household.name, appliance.name)}>
                      {openAppliances[household.name]?.[appliance.name]
                        ? "Hide Availability"
                        : "Show Availability"}
                    </button>
                    {#if openAppliances[household.name]?.[appliance.name]}
                      <div class="mt-2">
                        <div class="grid grid-cols-6 gap-1">
                          {#each Array(24) as _, hour}
                            <label class="flex items-center text-les-highlight text-xs gap-1">
                              <input
                                type="checkbox"
                                checked={isAvailable(appliance.availability, hour)}
                                onchange={(e) => handleAvailabilityChange(appliance, hour, e)} />
                              <p>{hour}:00</p>
                            </label>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/snippet}

<div class="flex flex-col items-center justify-center mx-auto max-w-3xl px-2 py-4 space-y-8">
  <button onclick={wipestorage} class="bg-red-700 text-white px-4 py-2 rounded-sm cursor-pointer"
    >Clear Storage</button>

  {@render progressBar(
    steps.map((step) => step.title),
    selectedOptions,
    currentStep
  )}

  {@render cardoptions(steps[currentStep].title, steps[currentStep].options)}
  {@render cardforms("Create Custom " + steps[currentStep].title, steps[currentStep].formFields)}
  {#if steps[currentStep].title === "Twin World" && selectedOption?.isCustom}
    {@render customTwinWorld()}
  {/if}
</div>
