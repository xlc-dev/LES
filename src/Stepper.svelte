<script lang="ts">
  import { onMount } from "svelte";
  import { getFormData } from "./formdata.svelte";

  const formData = getFormData().formData;

  let editor = $state(false);
  let appData: AppData | null = $state(null);
  let currentStep = $state(0);

  let selectedOptions = $state(Array(formData.length).fill(null));
  let hoveredOption: any = $state(null);

  function loadStorage() {
    if (localStorage.getItem("appData") !== null) {
      const storage = localStorage.getItem("appData");
      if (storage) {
        appData = JSON.parse(storage);
      }
    }
  }

  function wipeStorage() {
    if (localStorage.getItem("appData") !== null) {
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
    if (currentStep < formData.length - 1 && selectedOptions[currentStep] !== null) {
      currentStep += 1;
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      currentStep -= 1;
    }
  }

  function finish() {
    alert("You have completed all steps!");
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

      const currentFormFields = formData[currentStep].formFields;
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
    <div class="flex w-full mb-2">
      {#each formData as step}
        <div class="flex-1 text-center">
          <span class="text-xs font-semibold text-white">{step.title}</span>
        </div>
      {/each}
    </div>

    <div class="flex items-center w-full">
      {#each formData as _, index}
        <div class="flex items-center flex-1">
          {#if index !== 0}
            <div class="flex-1 h-0.5 {selectedOptions[index - 1] ? 'bg-blue-500' : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}

          <button
            class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center focus:outline-hidden z-10
              {selectedOptions[index] ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}
              {selectedOptions[index] && index !== currentStep ? 'hover:bg-sidebar' : ''}
              {index !== currentStep && !selectedOptions[index]
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'}"
            onclick={() => goToStep(index)}
            disabled={!selectedOptions[index] && index !== currentStep}>
            {index + 1}
          </button>

          {#if index !== formData.length - 1}
            <div class="flex-1 h-0.5 {selectedOptions[index] ? 'bg-blue-500' : 'bg-gray-300'}">
            </div>
          {:else}
            <div class="flex-1"></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex w-full mt-2">
      {#each formData as _, index}
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
  <div class="flex flex-col items-center justify-center mx-auto max-w-3xl px-2 py-4 space-y-8">
    <div class="w-full mt-8">
      <div class="flex justify-center space-x-4">
        {#if selectedOptions[currentStep] === null}
          <p>Select an option for {formData[currentStep].title}:</p>
          <div class="flex flex-wrap justify-center gap-4">
            {#each formData[currentStep].options as option}
              <div
                class="relative w-1/3 p-4 rounded-lg border-4 border-gray-300 cursor-pointer"
                onmouseover={() => (hoveredOption = option)}
                onmouseout={() => (hoveredOption = null)}
                onclick={() => selectOption(currentStep, option)}>
                <div class="text-center">
                  <span class="font-semibold text-lg">{option.label}</span>
                </div>

                {#if hoveredOption === option}
                  <div
                    class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-80 rounded-lg p-2">
                    <span class="text-sm text-center">{option.description}</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <p>You have selected: {selectedOptions[currentStep].label}</p>
        {/if}
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="mt-4 flex justify-center gap-4">
      <button
        onclick={previousStep}
        class="bg-gray-300 px-4 py-2 rounded-sm {currentStep === 0
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer'}"
        disabled={currentStep === 0}>
        Previous
      </button>

      {#if currentStep < formData.length - 1}
        <button
          onclick={nextStep}
          class="bg-blue-500 text-white px-4 py-2 rounded-sm {selectedOptions[currentStep] === null
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'}"
          disabled={selectedOptions[currentStep] === null || currentStep === formData.length - 1}>
          Next
        </button>
      {:else}
        <button
          onclick={finish}
          class="bg-les-highlight text-white px-4 py-2 rounded-sm cursor-pointer"
          disabled={selectedOptions[currentStep] === null}>
          Finish
        </button>
      {/if}
    </div>
  </div>
{/snippet}

<div class="flex flex-col items-center justify-center mx-auto max-w-3xl px-2 py-4 space-y-8">
  <button onclick={wipeStorage} class="bg-red-700 text-white px-4 py-2 rounded-sm cursor-pointer">
    Clear Storage
  </button>

  {@render progressbar()}
  {@render optionsCard()}
</div>
