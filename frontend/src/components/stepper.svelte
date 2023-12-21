<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { stepperData, twdata } from "../lib/stores";
  import * as monaco from 'monaco-editor';

  import {
    SimulateService,
    type SimulationData,
    TwinworldService,
    CostmodelService,
    AlgorithmService,
  } from "../lib/client";

  let currentStep: number = 1;
  let algo1Editor, algo2Editor;

  let algo1Code = '';
  let algo2Code = '';

  let simulationData: SimulationData = {
    algorithm: [],
    twin_world: [],
    cost_model: [],
  };

  let selectedIDs = {
    twin_world: 0,
    cost_model: 0,
    algorithm: 0,
  };

  let submitted: boolean = false;
  let currentDescription: string = "";

  const updateDescription = (description: string) => {
    currentDescription = description;
  };

  onMount(async () => {
    const data: SimulationData = await SimulateService.getDataApiSimulateLoadDataGet();
    simulationData = data;

    const keys = Object.keys(simulationData) as (keyof SimulationData)[];
    currentDescription = simulationData[keys[currentStep - 1]][0]?.description || "";

    algo1Editor = monaco.editor.create(document.getElementById('algo1-editor'), {
      value: '',
      language: 'python',
      lineNumbers: 'on',
      automaticLayout: true,
    });

    algo2Editor = monaco.editor.create(document.getElementById('algo2-editor'), {
      value: '',
      language: 'python',
      lineNumbers: 'on',
      automaticLayout: true,
    });
  });

  const getAlgoCode = (editor) => {
    return editor.getValue();
  };

  const nextStep = async () => {
    const keys = Object.keys(simulationData) as (keyof SimulationData)[];

    if (currentStep === 3) {
      const skippedStep = Object.entries(selectedIDs).find(([_, value]) => value === 0);

      if (skippedStep) {
        const [skippedID] = skippedStep;
        const targetStep = keys.findIndex((key) => key === skippedID);

        if (targetStep !== -1) {
          currentStep = targetStep + 1;
          currentDescription = simulationData[skippedID][0]?.description || "";
          return; // Exit the function after skipping to the specific step
        }
      }
    }

    if (currentStep < keys.length) {
      currentStep += 1;
      currentDescription = simulationData[keys[currentStep - 1]][0]?.description || "";
    }
  };

  const prevStep = () => {
    const keys = Object.keys(simulationData) as (keyof SimulationData)[];
    if (currentStep > 1) {
      currentStep -= 1;
      currentDescription = simulationData[keys[currentStep - 1]][0]?.description || "";
    }
  };

  const isStepCompleted = (step: number): boolean => {
    const keys = Object.keys(selectedIDs) as (keyof typeof selectedIDs)[];
    const currentStepKey = keys[step - 1];
    return selectedIDs[currentStepKey] !== 0;
  };

  const goToStep = (stepNumber: number) => {
    currentStep = stepNumber;
    currentDescription =
      simulationData[Object.keys(simulationData)[currentStep - 1]][0]?.description || "";
  };

  const selectOption = (optionId: number, category: any, optionName: string) => {
    selectedIDs[category] = optionId;
    twdata.update((data) => ({ ...data, [category]: optionName }));
    nextStep();
  };

  const deleteOption = async (optionId: number, category: any) => {
    selectedIDs[category] = 0;
    twdata.update((data) => ({ ...data, [category]: "-" }));
    await deleteOptionBasedOnCategory(category, optionId);
    simulationData = await SimulateService.getDataApiSimulateLoadDataGet();
  };

  const deleteOptionBasedOnCategory = async (category: keyof SimulationData, optionId: number) => {
    switch (category) {
      case "cost_model":
        await CostmodelService.deleteCostmodelApiCostmodelIdDelete(optionId);
        break;
      case "twin_world":
        await TwinworldService.deleteTwinworldApiTwinworldIdDelete(optionId);
        break;
      case "algorithm":
        await AlgorithmService.deleteAlgorithmApiAlgorithmIdDelete(optionId);
        break;
      default:
        break;
    }
  };

  function initMonaco(node, { initialCode, onChange }) {
    const editor = monaco.editor.create(node, {
      value: initialCode,
      language: 'python',
      lineNumbers: 'on',
      automaticLayout: true,
    });

    function handleEditorChange() {
      const newValue = editor.getValue();
      if (validatePythonSyntax(newValue)) {
        onChange(newValue);
        monaco.editor.setModelMarkers(editor.getModel(), 'python', []);
      } else {
        monaco.editor.setModelMarkers(editor.getModel(), 'python', [{
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          message: 'Code is not valid Python syntax',
          severity: monaco.MarkerSeverity.Error
        }]);
      }
    }

    editor.onDidChangeModelContent(handleEditorChange);

    return {
      update({ initialCode }) {
        if (initialCode !== editor.getValue()) {
          editor.setValue(initialCode);
        }
      },
      destroy() {
        editor.dispose();
      },
    };
  }

  function validatePythonSyntax(code) {
    const pythonPattern = /(?:def|class)\s+\w+\s*\(.*\)\s*:\s*|import\s+\w+|from\s+\w+\s+import\s+\w+/;
    return pythonPattern.test(code);
  }

  const uploadCostModel = async (event) => {
    const target = event.target;

    const formData = {
      name: target.name.value,
      description: target.description.value,
      price_network_buy_consumer: target.price_network_buy_consumer.value,
      price_network_sell_consumer: target.price_network_sell_consumer.value,
      fixed_division: target.fixed_division.value,
      stock_time_delta: target.stock_time_delta.value,
      algo_1: algo1Code,
      algo_2: algo2Code,
    };

    try {
      await CostmodelService.postCostmodelApiCostmodelPost(formData);
      submitted = true;
      simulationData = await SimulateService.getDataApiSimulateLoadDataGet();
    } catch (error) {
      console.log(error);
    }
  };

  const uploadTwinWorld = async (event) => {
    const target = event.target;

    const formData = {
      name: target.name.value,
      description: target.description.value,
    };

    try {
      await TwinworldService.postTwinworldApiTwinworldPost(formData);
      submitted = true;
      simulationData = await SimulateService.getDataApiSimulateLoadDataGet();
    } catch (error) {
      console.log(error);
    }
  };

  const uploadAlgorithm = async (event) => {
    const target = event.target;

    const formData = {
      name: target.name.value,
      description: target.description.value,
    };

    try {
      await AlgorithmService.postAlgorithmApiAlgorithmPost(formData);
      submitted = true;
      simulationData = await SimulateService.getDataApiSimulateLoadDataGet();
    } catch (error) {
      console.log(error);
    }
  };

  const startSimulation = async () => {
    await SimulateService.startApiSimulateStartPost({
      algorithm_id: selectedIDs.algorithm,
      twinworld_id: selectedIDs.twin_world,
      costmodel_id: selectedIDs.cost_model,
    }).then((res) => ($stepperData = res));
  };
</script>

<div class="max-w-3xl mx-auto pt-8">
  <h1 class="font-bold text-white text-4xl text-center">Local Energy System Simulation</h1>
  <p class="text-white text-xl text-center py-4">
    Welcome to the Local Energy System simulation. Explaination here.
  </p>
  <div class="flex items-center justify-between mt-16">
    {#key selectedIDs}
      {#each Object.keys(simulationData) as stepName, index}
        <div class="relative flex items-center pb-8">
          <button
            class={`h-8 w-8 flex items-center justify-center rounded-full border-2
            ${
              currentStep === index + 1
                ? "bg-les-red-dark border-les-red text-white"
                : isStepCompleted(index + 1)
                  ? "bg-les-highlight border-les-blue hover:bg-les-blue text-white transition-colors duration-200"
                  : "border-gray-300 text-gray-400 hover:bg-les-blue transition-colors duration-200"
            }`}
            on:click={() => goToStep(index + 1)}>
            <span class="text-sm font-bold">
              {#if isStepCompleted(index + 1)}✔{:else}{index + 1}{/if}
            </span>
            <span class="absolute bottom-20 text-xs font-semibold w-20">
              {stepName.charAt(0).toUpperCase() + stepName.slice(1).replace("_", " ")}
            </span>
          </button>
          {#if index < Object.keys(simulationData).length - 1}
            <div
              class={`absolute top-4 left-8 border-t-2 w-[21rem] transition-colors duration-200 ${
                isStepCompleted(index + 1) ? "border-les-blue" : "border-gray-300"
              }`}>
            </div>
          {/if}
          <p class="text-white absolute top-10 transform -translate-x-28 w-64 text-center">
            {#if selectedIDs.twin_world !== 0 && stepName === "twin_world"}
              {$twdata.twin_world}
            {:else if selectedIDs.cost_model !== 0 && stepName === "cost_model"}
              {$twdata.cost_model}
            {:else if selectedIDs.algorithm !== 0 && stepName === "algorithm"}
              {$twdata.algorithm}
            {:else}
              -
            {/if}
          </p>
        </div>
      {/each}
    {/key}
  </div>

  {#each Object.keys(simulationData) as key, index}
    {#if currentStep === index + 1}
      <div class="mt-8 bg-white rounded-lg p-4 min-h-[20em] border-4 border-gray-400 shadow">
        <h2 class="text-3xl font-semibold text-center">
          {key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}
        </h2>
        <div class="flex space-x-4 mt-4" in:fade>
          <div class="w-1/2">
            <h2 class="font-bold text-lg">Option:</h2>
            <div class="border p-4">
              <ul class="flex flex-col gap-4 items-start">
                {#each simulationData[key] as option (option.id)}
                  <div class="flex gap-2 items-center">
                    <button
                      on:click={() => selectOption(option.id, key, option.name)}
                      on:focus={() => updateDescription(option.description)}
                      on:mouseover={() => updateDescription(option.description)}
                      class="cursor-pointer hover:text-les-blue relative flex gap-2 items-center transition-colors duration-200">
                      {option.name}
                    </button>
                    {#if option.id !== 1 && option.id !== 2}
                      <button on:click={() => deleteOption(option.id, key)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          data-slot="icon"
                          class="stroke-les-red hover:stroke-les-red-dark h-4 cursor-pointer">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </button>
                    {/if}
                  </div>
                {/each}
              </ul>
            </div>
          </div>
          <div class="w-1/2">
            <h2 class="font-bold text-lg">Description:</h2>
            <div class="border p-4">
              <p>{currentDescription}</p>
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-8">
          {#if currentStep !== 1}
            <button
              class="px-6 py-3 rounded-lg text-white transition-colors duration-200 bg-les-highlight hover:bg-les-bg-dark"
              on:click={prevStep}>Back</button>
          {/if}
          {#if selectedIDs.algorithm !== 0 && selectedIDs.twin_world !== 0 && selectedIDs.cost_model !== 0}
            <button
              class="px-6 py-3 rounded-lg text-white transition-colors duration-200 bg-les-blue hover:brightness-110"
              on:click={startSimulation}>Start</button>
          {/if}
        </div>
      </div>
    {/if}
  {/each}
  <div class="mt-8 bg-white rounded-lg p-4 mb-8 border-4 border-gray-400 shadow">
    {#if submitted}
      <p class="text-green-600 text-2xl text-center font-bold pt-4 pb-6">Successfully uploaded!</p>
    {/if}
    <p class="font-bold text-lg mb-4">
      Upload Custom {Object.keys(simulationData)[currentStep - 1].charAt(0).toUpperCase() +
    Object.keys(simulationData)[currentStep - 1].slice(1).replace("_", " ")}:
    </p>
    {#if currentStep === 1}
      <form method="post" on:submit|preventDefault={uploadTwinWorld} class="flex flex-col gap-6">
        <label for="name" class="font-bold pt-4">Name:</label>
        <input
          type="text"
          name="name"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required />
        <label for="description" class="font-bold">Description:</label>
        <textarea
          name="description"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required></textarea>
        <button
          type="submit"
          class="py-3 bg-les-bg-dark rounded-lg text-white hover:bg-les-highlight transition-colors duration-200"
        >Submit</button>
      </form>
    {:else if currentStep === 2}
      <form
        method="post"
        on:submit|preventDefault={uploadCostModel}
        class="flex flex-col space-y-3">
        <label for="name" class="font-bold pt-4">Name:</label>
        <input
          type="text"
          name="name"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required />
        <label for="description" class="font-bold">Description:</label>
        <textarea
          name="description"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required
          rows="8"></textarea>
        <div>
          <label for="price_network_buy_consumer" class="font-bold"
          >Price Network Buy Consumer</label>
          <p class="text-sm text-gray-500">
            This is the price for buying from the network as a consumer.
          </p>
        </div>
        <input
          step="any"
          type="number"
          name="price_network_buy_consumer"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required />
        <div>
          <label for="price_network_sell_consumer" class="font-bold"
          >Price Network Sell Consumer</label>
          <p class="text-sm text-gray-500">
            This is the price for selling to the network as a consumer.
          </p>
        </div>
        <input
          step="any"
          type="number"
          name="price_network_sell_consumer"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required />
        <div>
          <label for="fixed_division" class="font-bold">Fixed Division</label>
          <p class="text-sm text-gray-500">This is the fixed division for the cost model.</p>
        </div>
        <input
          step="any"
          type="number"
          name="fixed_division"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600" />
        <div>
          <label for="stock_time_delta" class="font-bold">Stock Time Delta</label>
          <p class="text-sm text-gray-500">This is the stock time delta for the cost model.</p>
        </div>
        <input
          type="number"
          name="stock_time_delta"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600" />
        <div>
          <label for="algo1" class="font-bold">Algorithm 1</label>
          <p class="text-sm text-gray-500">This is the first algorithm for the cost model.</p>
        </div>
        <div use:initMonaco={{ initialCode: algo1Code, onChange: (code) => algo1Code = code }} class="editor-container"></div>
        <label for="algo2" class="font-bold">Algorithm 2</label>
        <div use:initMonaco={{ initialCode: algo2Code, onChange: (code) => algo2Code = code }} class="editor-container"></div>
        <button
          type="submit"
          class="py-3 bg-les-bg-dark rounded-lg text-white hover:bg-les-highlight transition-colors duration-200"
        >Submit</button>
      </form>
    {:else if currentStep === 3}
      <form method="post" on:submit|preventDefault={uploadAlgorithm} class="flex flex-col gap-6">
        <label for="name" class="font-bold pt-4">Name:</label>
        <input
          type="text"
          name="name"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required />
        <label for="description" class="font-bold">Description:</label>
        <textarea
          name="description"
          class="bg-les-frame p-3 rounded-lg border-2 border-gray-400 aria-selected:border-gray-600"
          required></textarea>
        <button
          type="submit"
          class="py-3 bg-les-bg-dark rounded-lg text-white hover:bg-les-highlight transition-colors duration-200"
        >Submit</button>
      </form>
    {/if}
  </div>
</div>

<style>
  .editor-container {
    height: 200px;
    border: 1px solid #ddd;
  }
</style>
