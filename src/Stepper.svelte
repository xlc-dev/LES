<script lang="ts">
  import { getDashboard, getStepperData } from "./state.svelte";

  let steps: Step[] = $state([
    {
      title: "Twin World",
      options: [
        {
          label: "Twin World small",
          description:
            "A small twin world consisting of roughly 25 households. These are depicting a typical neighborhood and its energy usage and appliances in the Netherlands. Each house consists of 1 to 5 inhabitants. The schedulable appliances are: Washing machine, tumble dryer, dishwasher, kitchen appliances and Electrical Vehicle. The frequency of use and power usage are randomized for each appliance.",
        },
        {
          label: "Twin World large",
          description:
            "A large twin world consisting of roughly 75 households. These are depicting a typical neighborhood and its energy usage and appliances in the Netherlands. Each house consists of 1 to 5 inhabitants. The schedulable appliances are: Washing machine, tumble dryer, dishwasher, kitchen appliances and Electrical Vehicle. The frequency of use and power usage are randomized for each appliance.",
        },
      ],
      formFields: [
        {
          label: "Name",
          description: "Enter the name of your custom twin world",
          type: "input",
          dataType: "string",
          placeholder: "Custom Twin World",
          required: true,
        },
        {
          label: "Description",
          description: "Enter a description of your custom twin world",
          type: "textarea",
          dataType: "string",
          placeholder: "My own twin world",
          required: true,
        },
        {
          label: "Solar Panel Capacity",
          description:
            "Enter the average yield of a single solar panel in a year",
          type: "input",
          dataType: "int",
          placeholder: "340",
          required: true,
          min: 1,
        },
      ],
    },
    {
      title: "Cost Model",
      options: [
        {
          label: "Fixed Price",
          description:
            "A fixed price for buying and selling energy. The price for buying from the utility is 0.4 and the price for selling is 0.1. The price is determined by 0.25. A higher fixed devisision means a higher trading price.",
        },
        {
          label: "TEMO",
          description:
            "A price model based on the TEMO model. The price is determined by a formula that compares the energy needed to the various prices available, and returns an internal buying and selling prices",
        },
      ],
      formFields: [
        {
          label: "Name",
          description: "Enter the name of your custom cost model",
          type: "input",
          dataType: "string",
          placeholder: "Custom Cost Model",
          required: true,
        },
        {
          label: "Description",
          description: "Enter a description of your custom cost model",
          type: "textarea",
          placeholder: "My own cost model",
          required: true,
        },
        {
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
          label: "Price Network Sell Consumer",
          description:
            "The price for selling energy back to the energy provider",
          type: "input",
          dataType: "float",
          placeholder: "0.1",
          required: true,
          min: 0,
          step: 0.1,
        },
        {
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
          label: "Cost Model Algorithm",
          description:
            "A custom formula used to determine the internal buying and selling price",
          type: "editor",
          required: true,
          value: `function costModel() {\n\treturn buyCustomer * ratio + sellCustomer * (1 - ratio);\n}\n`,
        },
      ],
    },
    {
      title: "Algorithm",
      options: [
        {
          label: "Greedy Planning",
          description:
            "An initial planning that puts appliances in their local optimum through a greedy algorithm. Will not optimize further than one pass through all appliances.",
        },
        {
          label: "Simulated Annealing",
          description:
            "An algorithm that improves on a given algorithm by randomly changing the time of planned in appliances. The conditions for what changes becomes stricter over time, resulting in a further optimized solution.",
        },
      ],
      formFields: [
        {
          label: "Name",
          description: "Enter the name of your custom algorithm",
          type: "input",
          dataType: "string",
          placeholder: "Custom Algorithm",
          required: true,
        },
        {
          label: "Description",
          description: "Enter a description of your custom algorithm",
          type: "textarea",
          placeholder: "My own algorithm",
          required: true,
        },
        {
          label: "Max Temperature",
          description: "Sets the max temperature for your algorithm",
          type: "input",
          dataType: "int",
          placeholder: "10000",
          required: true,
        },
        {
          label: "Custom Algorithm",
          description:
            "A custom algorithm used to determine when an appliance will be planned in",
          type: "editor",
          required: true,
          value: `function run() {\n\treturn true;\n}\n`,
        },
      ],
    },
    {
      title: "Energyflow",
      options: [
        {
          label: "Energyflow Zoetermeer",
          description:
            "The energy data from a green household in Zoetermeer that is associated with the THUAS.",
        },
      ],
      formFields: [
        {
          label: "Name",
          description: "Enter the name of your custom energyflow",
          type: "input",
          dataType: "string",
          placeholder: "Custom Energy Flow",
          required: true,
        },
        {
          label: "Description",
          description: "Enter a description of your custom energyflow",
          type: "textarea",
          placeholder: "My own energy flow",
          required: true,
        },
        {
          label: "Solar Panels Factor",
          description:
            "The amount of solar panels for the household in the supplied energy table",
          type: "input",
          dataType: "int",
          placeholder: "25",
          required: true,
          min: 0,
        },
        {
          label: "Energy Usage Factor",
          description:
            "The amount of yearly energy used for the household in the supplied energy table",
          type: "input",
          dataType: "int",
          placeholder: "7000",
          required: true,
          min: 0,
        },
      ],
    },
  ]);

  let editMode: boolean = $state(false);
  let editedOption: Option | null = $state(null);
  let currentStep: number = $state(0);
  let selectedOption: Option | null = $state(null);
  let hoveredOption: Option | null = $state(null);
  let selectedOptions: (Option | null)[] = $state(
    Array(steps.length).fill(null),
  );

  function goToStep(index: number) {
    if (selectedOptions[index] || index === currentStep) {
      currentStep = index;
      selectedOption = selectedOptions[currentStep];
      hoveredOption = null;
    }
  }

  function nextStep() {
    if (selectedOption) {
      selectedOptions[currentStep] = selectedOption;
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        selectedOption = selectedOptions[currentStep];
        hoveredOption = null;
      }
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      currentStep -= 1;
      selectedOption = selectedOptions[currentStep];
      hoveredOption = null;
    }
  }

  function finish() {
    if (selectedOption) {
      selectedOptions[currentStep] = selectedOption;
    }

    const stepperData: StepperData = {
      steps: steps.map((step, index) => {
        const selected = selectedOptions[index];
        return {
          title: step.title,
          selectedOption: selected,
          formData: selected ? getFormData(step.formFields) : null,
        };
      }),
    };

    getStepperData().setStepperData(stepperData);
    getDashboard().setDashboard(true);
  }
  function selectOption(option: Option) {
    selectedOption = option;
  }

  function validateField(field: FormField) {
    if (field.required && (!field.value || field.value.trim() === "")) {
      field.error = "This field is required.";
      return false;
    }

    if (field.value && field.dataType) {
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
      if (
        (field.dataType === "int" || field.dataType === "float") &&
        !isNaN(numValue)
      ) {
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

  function validateForm(fields: FormField[]) {
    let isValid = true;
    for (const field of fields) {
      if (!validateField(field)) {
        isValid = false;
      }
    }
    return isValid;
  }

  function getFormData(fields: FormField[]) {
    const data: any = {};
    for (const field of fields) {
      data[field.label] = field.value;
    }
    return data;
  }

  function submitForm(e: Event) {
    e.preventDefault();
    const fields = steps[currentStep].formFields;
    if (validateForm(fields)) {
      const formData = getFormData(fields);

      if (editMode && editedOption) {
        const editedOptionId = editedOption.id;
        if (!editedOptionId) return;

        const stepIndex = currentStep;
        const key = "customOptionsStep" + stepIndex;
        let customOptions: CustomOption[] = JSON.parse(
          localStorage.getItem(key) || "[]",
        );

        const index = customOptions.findIndex((co) => co.id === editedOptionId);
        if (index !== -1) {
          customOptions[index].option.label = formData["Name"];
          customOptions[index].option.description = formData["Description"];
          customOptions[index].formData = formData;

          localStorage.setItem(key, JSON.stringify(customOptions));

          const optIndex = steps[stepIndex].options.findIndex(
            (opt) => opt.id === editedOptionId,
          );
          if (optIndex !== -1) {
            steps[stepIndex].options[optIndex] = customOptions[index].option;
          }

          if (selectedOption && selectedOption.id === editedOptionId) {
            selectedOption = customOptions[index].option;
          }

          if (
            selectedOptions[currentStep] &&
            selectedOptions[currentStep]?.id === editedOptionId
          ) {
            selectedOptions[currentStep] = customOptions[index].option;
          }

          editMode = false;
          editedOption = null;

          for (const field of fields) {
            field.value = "";
          }
        }
      } else {
        const customOptionId =
          "customOption_" +
          Date.now() +
          "_" +
          Math.random().toString(36).substr(2, 9);
        const customOption: CustomOption = {
          id: customOptionId,
          option: {
            label: formData["Name"],
            description: formData["Description"],
            id: customOptionId,
            isCustom: true,
          },
          formData: formData,
        };

        steps[currentStep].options.push(customOption.option);

        saveCustomOption(currentStep, customOption);

        for (const field of fields) {
          field.value = "";
        }
      }
    }
  }

  function saveCustomOption(stepIndex: number, customOption: CustomOption) {
    const key = "customOptionsStep" + stepIndex;
    let customOptions = JSON.parse(localStorage.getItem(key) || "[]");
    customOptions.push(customOption);
    localStorage.setItem(key, JSON.stringify(customOptions));
  }

  function loadCustomOptions() {
    for (let i = 0; i < steps.length; i++) {
      const key = "customOptionsStep" + i;
      let customOptions: CustomOption[] = JSON.parse(
        localStorage.getItem(key) || "[]",
      );
      for (const customOption of customOptions) {
        steps[i].options.push(customOption.option);
      }
    }
  }

  function deleteCustomOption(option: Option) {
    if (!confirm(`Are you sure you want to delete ${option.label}`)) return;
    const stepIndex = currentStep;
    const key = "customOptionsStep" + stepIndex;
    let customOptions: CustomOption[] = JSON.parse(
      localStorage.getItem(key) || "[]",
    );

    customOptions = customOptions.filter((co) => co.id !== option.id);
    localStorage.setItem(key, JSON.stringify(customOptions));

    steps[stepIndex].options = steps[stepIndex].options.filter(
      (opt) => opt !== option,
    );

    if (selectedOption === option) {
      selectedOption = null;
    }
  }

  function editCustomOption(option: Option) {
    const stepIndex = currentStep;
    const key = "customOptionsStep" + stepIndex;
    let customOptions: CustomOption[] = JSON.parse(
      localStorage.getItem(key) || "[]",
    );

    const customOption = customOptions.find((co) => co.id === option.id);
    if (customOption) {
      const fields = steps[currentStep].formFields;
      for (const field of fields) {
        field.value = customOption.formData[field.label];
      }
      editMode = true;
      editedOption = option;
    }
  }

  function cancelEdit() {
    editMode = false;
    editedOption = null;
    const fields = steps[currentStep].formFields;
    for (const field of fields) {
      field.value = "";
    }
  }

  let editor: HTMLElement | null = $state(null);

  $effect(() => {
    if (!editor || !document.getElementById("editor")) {
      return;
    }
    // @ts-ignore
    let aceEditor = ace.edit("editor", {
      mode: "ace/mode/javascript",
      selectionStyle: "text",
      autoScrollEditorIntoView: true,
      animatedScroll: true,
      fontSize: "15px",
    });
    const currentFormFields = steps[currentStep].formFields;
    const editorField = currentFormFields.find(
      (field) => field.type === "editor",
    );
    if (editorField && editorField.value) {
      aceEditor.setValue(editorField.value, 999);
    }
  });

  loadCustomOptions();
</script>

{#snippet progressBar(
  steps: string[],
  selectedOptions: (Option | null)[],
  currentStep: number,
)}
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
                : 'bg-gray-300'}"
            ></div>
          {:else}
            <div class="flex-1"></div>
          {/if}

          <button
            class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center focus:outline-none z-10
            {selectedOptions[index]
              ? 'bg-les-highlight text-white'
              : 'bg-gray-300 text-gray-600'}
            {selectedOptions[index] && index !== currentStep
              ? 'hover:bg-sidebar'
              : ''}
            disabled:opacity-50"
            onclick={() => goToStep(index)}
            disabled={!selectedOptions[index] && index !== currentStep}
          >
            {index + 1}
          </button>

          {#if index !== steps.length - 1}
            <div
              class="flex-1 h-0.5 {selectedOptions[index]
                ? 'bg-les-highlight'
                : 'bg-gray-300'}"
            ></div>
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
  <div
    class="rounded-lg border-4 border-gray-400 bg-white p-6 w-full shadow-lg"
  >
    <h1 class="text-2xl text-center text-les-highlight font-bold">{title}</h1>
    <div class="flex flex-col lg:flex-row">
      <div class="lg:w-1/2 p-4">
        <h2 class="text-2xl font-semibold mb-4 text-les-highlight">Options</h2>
        <ul class="space-y-2">
          {#each options as option}
            <li class="flex items-center">
              <button
                class="hover:underline {selectedOption &&
                selectedOption.label === option.label
                  ? 'text-sidebar font-bold'
                  : 'text-les-highlight'} flex-1 text-left"
                onmouseenter={() => (hoveredOption = option)}
                onmouseleave={() => (hoveredOption = null)}
                onclick={() => selectOption(option)}
              >
                {option.label}
              </button>
              {#if option.isCustom}
                <button
                  class="text-blue-500 hover:underline ml-2"
                  onclick={() => editCustomOption(option)}
                >
                  Edit
                </button>
                <button
                  class="text-red-500 hover:underline ml-2"
                  onclick={() => deleteCustomOption(option)}
                >
                  Delete
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      </div>

      <div
        class="w-full h-0.5 bg-gray-300 lg:w-0.5 lg:h-72 lg:self-center"
      ></div>

      <div class="lg:w-1/2 p-4">
        <h2 class="text-2xl font-semibold mb-4 text-les-highlight">
          Description
        </h2>
        <p class="text-gray-700">
          {#if hoveredOption}
            {hoveredOption.description}
          {:else if selectedOption}
            {selectedOption.description}
          {:else}
            {options[0].description}
          {/if}
        </p>
      </div>
    </div>
    <div class="flex justify-between mt-4">
      <button
        class="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50 transition-colors duration-200"
        class:cursor-not-allowed={currentStep === 0}
        class:hover:bg-gray-400={currentStep !== 0}
        onclick={previousStep}
        disabled={currentStep === 0}
      >
        Previous
      </button>
      {#if currentStep < steps.length - 1}
        <button
          class="bg-les-highlight text-white px-4 py-2 rounded disabled:opacity-50 transition-colors duration-200"
          class:cursor-not-allowed={!selectedOption}
          class:hover:bg-sidebar={selectedOption}
          onclick={nextStep}
          disabled={!selectedOption}
        >
          Next
        </button>
      {:else}
        <button
          class="bg-les-highlight text-white px-4 py-2 rounded disabled:opacity-50 transition-colors duration-200"
          onclick={finish}
          class:hover:bg-sidebar={selectedOption}
          disabled={!selectedOption}
        >
          Finish
        </button>
      {/if}
    </div>
  </div>
{/snippet}

{#snippet cardforms(title: string, fields: FormField[])}
  <div
    class="rounded-lg border-4 border-gray-400 bg-white p-6 w-full shadow-lg"
  >
    <h1 class="text-2xl text-center text-les-highlight font-bold">
      {editMode ? "Edit Custom " + editedOption?.label : title}
    </h1>
    <form class="space-y-4" onsubmit={submitForm}>
      {#each fields as field}
        <div class="flex flex-col">
          <label
            class="text-les-highlight font-semibold mb-1"
            for={field.label}
          >
            {field.label}
          </label>
          {#if field.description}
            <span class="text-gray-500 text-sm mb-2">{field.description}</span>
          {/if}

          {#if field.type === "input"}
            <input
              type="text"
              class="border-2 border-gray-300 rounded-lg p-2 w-full text-les-highlight"
              placeholder={field.placeholder}
              bind:value={field.value}
              required={field.required}
              oninput={() => validateField(field)}
            />
          {/if}

          {#if field.type === "textarea"}
            <textarea
              class="border-2 border-gray-300 rounded-lg p-2 w-full text-les-highlight"
              placeholder={field.placeholder}
              bind:value={field.value}
              required={field.required}
              rows="5"
              oninput={() => validateField(field)}
            ></textarea>
          {/if}

          {#if field.type === "editor"}
            <div
              bind:this={editor}
              id="editor"
              class="border-2 border-gray-300 rounded-lg p-2 h-64 text-les-highlight"
            ></div>
          {/if}
          {#if field.error}
            <span class="text-red-500 text-sm mt-1">{field.error}</span>
          {/if}
        </div>
      {/each}
      <div class="flex space-x-4">
        <button
          type="submit"
          class="bg-les-highlight text-white px-4 py-2 rounded transition-colors duration-200 hover:bg-sidebar"
        >
          {editMode ? "Update" : "Create"}
        </button>
        {#if editMode}
          <button
            type="button"
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors duration-200 hover:bg-gray-400"
            onclick={cancelEdit}
          >
            Cancel
          </button>
        {/if}
      </div>
    </form>
  </div>
{/snippet}

<div
  class="flex flex-col items-center justify-center mx-auto xl:max-w-6xl max-w-2xl px-2 py-4 space-y-8"
>
  {@render progressBar(
    steps.map((step) => step.title),
    selectedOptions,
    currentStep,
  )}

  {@render cardoptions(steps[currentStep].title, steps[currentStep].options)}
  {@render cardforms(
    "Create Custom " + steps[currentStep].title,
    steps[currentStep].formFields,
  )}
</div>
