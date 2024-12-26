<script lang="ts">
  import { onMount } from "svelte";
  import { getDashboard, getStepperData } from "./state.svelte";
  import {
    getFormData,
    isAlgoStep,
    isCostmodelStep,
    isEnergyflowStep,
    isTwinworldStep,
  } from "./formdata.svelte";

  const formData = getFormData();
  const dashboard = getDashboard();
  const stepperData = getStepperData();

  let editor = $state(false);
  let currentStep = $state(0);

  let selectedOptions = $state(Array(formData.formData.length).fill(null));
  let hoveredOption: Option | null = $state(null);

  function loadStorage() {
    const storage = localStorage.getItem("formData");
    if (storage) {
      formData.setFormData(JSON.parse(storage));
    }
  }

  function wipeStorage() {
    if (localStorage.getItem("formData") !== null) {
      localStorage.clear();
      location.reload();
    }
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
  }

  $effect(() => {
    if (editor && document.getElementById("editor")) {
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

  onMount(() => {
    loadStorage();
  });
</script>

{#snippet progressbar()}
  <div class="flex flex-col items-center w-full">
    <div class="flex w-full">
      {#each formData.formData as step}
        <div class="flex-1 text-center">
          <span class="text-xs font-semibold text-white">{step.title}</span>
        </div>
      {/each}
    </div>

    <div class="flex items-center w-full">
      {#each formData.formData as _, index}
        <div class="flex items-center flex-1">
          {#if index !== 0}
            <div class="flex-1 h-0.5 {selectedOptions[index - 1] ? 'bg-blue-500' : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}

          <button
            class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center focus:outline-hidden z-10 transition duration-200
              {selectedOptions[index] ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}
              {selectedOptions[index] && index !== currentStep ? 'hover:bg-sidebar' : ''}
              {index !== currentStep && !selectedOptions[index]
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'}"
            onclick={() => goToStep(index)}
            disabled={!selectedOptions[index] && index !== currentStep}>
            {index + 1}
          </button>

          {#if index !== formData.formData.length - 1}
            <div class="flex-1 h-0.5 {selectedOptions[index] ? 'bg-blue-500' : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex w-full mt-2">
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
  <div class="flex flex-col space-y-4 bg-white border-4 border-gray-400 rounded-lg p-4 w-full">
    <div class="flex flex-col md:flex-row w-full gap-8">
      <div class="flex flex-col w-full md:w-1/2 md:pr-2">
        <h2 class="font-bold mb-2 text-les-highlight text-3xl text-center">Options</h2>
        <div class="flex flex-col flex-wrap gap-4">
          {#each formData.formData[currentStep].options as option}
            <button
              class="font-semibold text-les-highlight transition duration-200 ease-in-out transform hover:scale-105 cursor-pointer"
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

      <div class="flex flex-col w-full md:w-1/2 md:pl-2">
        <h2 class="font-bold mb-2 text-les-highlight text-3xl text-center">Description</h2>
        {#if hoveredOption}
          <p class="text-les-highlight">{hoveredOption.description}</p>
        {:else if formData.formData[currentStep].options.length > 0}
          <p class="text-les-highlight">{formData.formData[currentStep].options[0].description}</p>
        {/if}
      </div>
    </div>

    <div class="pt-4 flex flex-col md:flex-row justify-between w-full space-y-4 md:space-y-0">
      <button
        onclick={previousStep}
        class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md disabled:opacity-50 transition-colors duration-200
        {currentStep !== 0 ? 'hover:bg-gray-400 cursor-pointer' : 'cursor-not-allowed'}"
        disabled={currentStep === 0}>
        Previous
      </button>
      {#if currentStep < formData.formData.length - 1}
        <button
          onclick={nextStep}
          class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors duration-200
          {selectedOptions[currentStep] === null
            ? 'cursor-not-allowed'
            : 'hover:bg-blue-600 cursor-pointer'}"
          disabled={selectedOptions[currentStep] === null ||
            currentStep === formData.formData.length - 1}>
          Next
        </button>
      {:else}
        <button
          onclick={finish}
          class="bg-les-highlight text-white px-4 py-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-sidebar"
          disabled={selectedOptions[currentStep] === null}>
          Finish
        </button>
      {/if}
    </div>
  </div>
{/snippet}

{#snippet cardform()}{/snippet}

<div class="flex flex-col items-center justify-center mx-auto max-w-3xl px-2 py-8 space-y-8">
  <button
    onclick={wipeStorage}
    class="bg-red-700 text-white px-4 py-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-red-800">
    Clear Storage
  </button>

  {@render progressbar()}
  {@render optionsCard()}
  {@render cardform()}
</div>
