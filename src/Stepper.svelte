<script lang="ts">
  import { openDB } from "idb";

  import { onMount } from "svelte";
  import { getDashboard, getStepperData } from "./state.svelte";
  import {
    getFormData,
    isAlgoStep,
    isCostmodelStep,
    isEnergyflowStep,
    isTwinworldStep,
  } from "./formdata.svelte";

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
    const db = await initDB();

    const plainData = JSON.parse(JSON.stringify(formData.formData));
    await db.put("formData", { id: "mainData", data: plainData });

    console.log("Data saved to IndexedDB", plainData);
  }

  async function loadStorage() {
    const db = await initDB();
    const storedData = await db.get("formData", "mainData");
    if (storedData) {
      formData.setFormData(storedData.data);
    } else {
      await saveStorage();
    }
  }

  async function wipeStorage() {
    const db = await initDB();
    await db.delete("formData", "mainData");
    location.reload();
  }

  function goToStep(index: number) {
    if (selectedOptions[index] !== null || index <= currentStep) {
      currentStep = index;
    }
  }

  function selectOption(stepIndex: number, option: any) {
    selectedOptions[stepIndex] = option;
  }

  function nextStep() {
    if (currentStep < formData.formData.length - 1 && selectedOptions[currentStep] !== null) {
      currentStep += 1;
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      currentStep -= 1;
    }
  }

  function validateFormFields(fields: FormField[]): boolean {
    let isValid = true;

    fields.forEach((field) => {
      const value = field.value;

      field.error = "";

      if (field.required && (value === null || value === undefined || value === "")) {
        field.error = `${field.label} is required.`;
        isValid = false;
      }

      if (field.dataType === "int" && !Number.isInteger(Number(value))) {
        field.error = `${field.label} must be an integer.`;
        isValid = false;
      } else if (field.dataType === "float" && isNaN(parseFloat(value))) {
        field.error = `${field.label} must be a number.`;
        isValid = false;
      }

      if (field.min !== undefined && Number(value) < field.min) {
        field.error = `${field.label} must be at least ${field.min}.`;
        isValid = false;
      }
    });

    return isValid;
  }

  async function createCustomItem(e: Event) {
    e.preventDefault();
    const currentFormFields = formData.formData[currentStep].formFields;

    const isValid = validateFormFields(currentFormFields);
    if (!isValid) return;

    const nameField = currentFormFields.find((field) => field.name === "name");
    const descriptionField = currentFormFields.find((field) => field.name === "description");

    if (!nameField || !descriptionField) return;

    const nameValue = nameField.value.trim();
    console.log(nameValue);

    const existingItem = formData.formData[currentStep].options.find(
      (option) => option.name.toLowerCase() === nameValue.toLowerCase()
    );

    if (existingItem) {
      nameField.error = "An item with this name already exists.";
      return;
    }

    const newItem: Option = {
      id: Date.now().toString(),
      name: nameValue,
      description: descriptionField.value.trim(),
      label: `${formData.formData[currentStep].title}`,
    };

    formData.formData[currentStep].options = [...formData.formData[currentStep].options, newItem];

    const currentStepData = formData.formData[currentStep];

    if (isTwinworldStep(currentStepData)) {
      currentStepData.twinWorlds[newItem.id] = {
        name: newItem.name,
        description: newItem.description,
        solarPanelCapacity:
          currentFormFields.find((field) => field.name === "solarPanelCapacity")?.value || 0,
        households: [],
      };
    } else if (isCostmodelStep(currentStepData)) {
      currentStepData.costModels[newItem.id] = {
        name: newItem.name,
        description: newItem.description,
        priceNetworkBuyConsumer:
          currentFormFields.find((field) => field.name === "priceNetworkBuyConsumer")?.value || 0,
        priceNetworkSellConsumer:
          currentFormFields.find((field) => field.name === "priceNetworkSellConsumer")?.value || 0,
        fixedPriceRatio:
          currentFormFields.find((field) => field.name === "fixedPriceRatio")?.value || 0,
        algorithm: currentFormFields.find((field) => field.name === "algorithm")?.value || "",
      };
    } else if (isAlgoStep(currentStepData)) {
      currentStepData.algos[newItem.id] = {
        name: newItem.name,
        description: newItem.description,
        maxTemperature:
          currentFormFields.find((field) => field.name === "maxTemperature")?.value || 0,
        algorithm: currentFormFields.find((field) => field.name === "algorithm")?.value || "",
      };
    } else if (isEnergyflowStep(currentStepData)) {
      currentStepData.energyflows[newItem.id] = {
        solarPanelsFactor:
          currentFormFields.find((field) => field.name === "solarPanelsFactor")?.value || 0,
        energyUsageFactor:
          currentFormFields.find((field) => field.name === "energyUsageFactor")?.value || 0,
        headers: [],
        data: [],
      };
    }

    await saveStorage();
    selectOption(currentStep, newItem);
    currentFormFields.forEach((field) => (field.value = ""));
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
    if (currentStep && document.getElementById("editor")) {
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
            class="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition duration-200 focus:outline-hidden
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
            <button
              class="text-les-highlight transform cursor-pointer font-semibold transition duration-200 ease-in-out hover:scale-105"
              class:text-blue-500!={selectedOptions[currentStep] === option}
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
          {/each}
        </div>
      </div>

      <div class="flex w-full flex-col md:w-1/2 md:pl-2">
        <h2 class="text-les-highlight mb-2 text-center text-3xl font-bold">Description</h2>
        {#if hoveredOption}
          <p class="text-les-highlight">{hoveredOption.description}</p>
        {:else if formData.formData[currentStep].options.length > 0}
          <p class="text-les-highlight">{formData.formData[currentStep].options[0].description}</p>
        {/if}
      </div>
    </div>

    <div class="flex w-full flex-col justify-between space-y-4 pt-4 md:flex-row md:space-y-0">
      <button
        onclick={previousStep}
        class="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors duration-200 disabled:opacity-50
        {currentStep !== 0 ? 'cursor-pointer hover:bg-gray-400' : 'cursor-not-allowed'}"
        disabled={currentStep === 0}>
        Previous
      </button>
      {#if currentStep < formData.formData.length - 1}
        <button
          onclick={nextStep}
          class="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors duration-200 disabled:opacity-50
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
          class="bg-les-highlight hover:bg-sidebar cursor-pointer rounded-md px-4 py-2 text-white transition-colors duration-200"
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
      Custom {formData.formData[currentStep].title}
    </h2>

    <form class="flex flex-wrap gap-4" onsubmit={createCustomItem}>
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
        class="w-full cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600">
        Create
      </button>
    </form>
  </div>
{/snippet}

<div class="mx-auto flex max-w-3xl flex-col items-center justify-center space-y-8 px-2 py-8">
  <button
    onclick={async () => await wipeStorage()}
    class="cursor-pointer rounded-md bg-red-700 px-4 py-2 text-white transition-colors duration-200 hover:bg-red-800">
    Clear Storage
  </button>

  {@render progressbar()}
  {@render optionsCard()}
  {@render cardform()}
</div>
