<script lang="ts">
  import { slide } from "svelte/transition";
  import { downloadExcel } from "./excel.svelte";
  import {
    getComponent,
    getDashboard,
    getEfficiencyResults,
    getEndDate,
    getLoopManager,
    getRuntime,
    getStartDate,
    getStepperData,
  } from "./state.svelte";
  import Stepper from "./Stepper.svelte";

  interface Props {
    completed: boolean;
  }

  // @ts-ignore
  let { completed = $bindable() }: Props = $props();

  const stepperData = getStepperData();
  const loopManager = getLoopManager();
  const runtime = getRuntime();
  const efficiencyResults = getEfficiencyResults();
  const startDate = getStartDate();
  const endDate = getEndDate();
  const component = getComponent();
  const dashboard = getDashboard();

  let done = $state(false);
  let showChainDropdown = $state(false);
  let chainCount: number = $state(0);
  let currentChainIndex = $state(0);
  let chainIterations: StepperData[] = $state([]);
  let initial = $state(true);
  let prevChainCount = $state(0);
  let stepperDone = $state(false);
  let hasErrors = $state(false);
  let errors: { [field: string]: string } = $state({});

  const isValidNumber = (value: any) =>
    value !== null && value !== undefined && !isNaN(parseFloat(value)) && isFinite(value);

  function validateField(key: string, value: any, validateFn: (val: any) => string): void {
    const errorMessage = validateFn(value);
    if (errorMessage) {
      errors = { ...errors, [key]: errorMessage };
    } else {
      const { [key]: removed, ...rest } = errors;
      errors = rest;
    }
  }

  function validatePositiveNumber(val: any): string {
    if (val === null || val === undefined || val === "") {
      return "This field is required.";
    } else if (!isValidNumber(val)) {
      return "Please enter a valid number.";
    } else if (Number(val) < 0) {
      return "Please enter a valid positive number.";
    }
    return "";
  }

  function validateCurrentIteration(): boolean {
    errors = {};
    const twinworld = chainIterations[currentChainIndex]?.twinworld;
    if (twinworld) {
      validateField(
        `twinworld-solarPanelCapacity-${currentChainIndex}`,
        twinworld.solarPanelCapacity,
        validatePositiveNumber
      );
    }
    const costmodel = chainIterations[currentChainIndex]?.costmodel;
    if (costmodel) {
      validateField(
        `costmodel-priceNetworkBuyConsumer-${currentChainIndex}`,
        costmodel.priceNetworkBuyConsumer,
        validatePositiveNumber
      );
      validateField(
        `costmodel-priceNetworkSellConsumer-${currentChainIndex}`,
        costmodel.priceNetworkSellConsumer,
        validatePositiveNumber
      );
      validateField(
        `costmodel-fixedPriceRatio-${currentChainIndex}`,
        costmodel.fixedPriceRatio,
        validatePositiveNumber
      );
    }
    const algo = chainIterations[currentChainIndex]?.algo;
    if (algo) {
      validateField(
        `algo-maxTemperature-${currentChainIndex}`,
        algo.maxTemperature,
        validatePositiveNumber
      );
    }
    const energyflow = chainIterations[currentChainIndex]?.energyflow;
    if (energyflow) {
      validateField(
        `energyflow-solarPanelsFactor-${currentChainIndex}`,
        energyflow.solarPanelsFactor,
        validatePositiveNumber
      );
      validateField(
        `energyflow-energyUsageFactor-${currentChainIndex}`,
        energyflow.energyUsageFactor,
        validatePositiveNumber
      );
    }

    return Object.keys(errors).length === 0;
  }

  function nextChainIteration() {
    if (!validateCurrentIteration()) {
      alert("Please correct the errors before proceeding.");
      return;
    }
    if (currentChainIndex < chainCount - 1) {
      currentChainIndex++;
      loadEditors("costmodelalgo", chainIterations[currentChainIndex].costmodel.algorithm);
      loadEditors("algorithm", chainIterations[currentChainIndex].algo.algorithm);
    }
  }

  function previousChainIteration() {
    // Even when going back, you might want to validate—but here we allow going back without validation.
    if (currentChainIndex > 0) {
      currentChainIndex--;
      loadEditors("costmodelalgo", chainIterations[currentChainIndex].costmodel.algorithm);
      loadEditors("algorithm", chainIterations[currentChainIndex].algo.algorithm);
    }
  }

  function handleClickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest(".dropdown-container")) {
      showChainDropdown = false;
    }
  }

  async function runChain() {
    if (!validateCurrentIteration()) {
      alert("Please correct the errors before running the chain.");
      return;
    }
    dashboard.setDashboard(true);
    if (chainIterations.length) {
      stepperData.setStepperData(chainIterations[0]);
    }
    for (let i = 0; i < chainCount; i++) {
      await new Promise<void>((resolve) => {
        if (component.currentComponent !== "Stop") {
          runtime.startRuntime();
          loopManager.startLoop(() => {
            if (i < chainCount - 1) {
              stepperData.setStepperData(chainIterations[i + 1]);
              efficiencyResults.setEfficiencyResults([]);
              startDate.setStartDate(0);
              endDate.setEndDate(0);
            }
            runtime.stopRuntime();
            resolve();
          });
        }
      });
      downloadExcel(`Chain ${i + 1}`);
      if (i < chainCount - 1) nextChainIteration();
    }
    completed = true;
  }

  function loadEditors(id: string, value: string) {
    if (!document.getElementById(id)) return;
    // @ts-ignore - aceEditor is defined in the global scope
    const aceEditor = ace.edit(id, {
      mode: "ace/mode/javascript",
      selectionStyle: "text",
      autoScrollEditorIntoView: true,
      animatedScroll: true,
      fontSize: "15px",
    });

    aceEditor.setValue(value, -1);
  }

  function createIteration(): StepperData {
    return {
      twinworld: { ...stepperData.stepperData.twinworld },
      costmodel: { ...stepperData.stepperData.costmodel },
      algo: { ...stepperData.stepperData.algo },
      energyflow: { ...stepperData.stepperData.energyflow },
      energyflowlabel: stepperData.stepperData.energyflowlabel,
    };
  }

  $effect(() => {
    if (chainCount === 0) return;
    if (!initial && chainCount !== prevChainCount) {
      if (
        confirm(
          "Changing the chain length will erase all your current changes. Do you want to proceed?"
        )
      ) {
        chainIterations = Array.from({ length: chainCount }, createIteration);
        currentChainIndex = 0;
      } else {
        chainCount = prevChainCount;
      }
    } else if (initial) {
      chainIterations = Array.from({ length: chainCount }, createIteration);
    }
    initial = false;
    prevChainCount = chainCount;
    loadEditors("costmodelalgo", chainIterations[currentChainIndex].costmodel.algorithm);
    loadEditors("algorithm", chainIterations[currentChainIndex].algo.algorithm);
  });

  $effect(() => {
    hasErrors = Object.keys(errors).length > 0;
  });
</script>

<svelte:window onclick={handleClickOutside} />

{#if !stepperDone}
  <Stepper onComplete={() => (stepperDone = true)} />
{:else}
  <div
    class="text-les-highlight mx-auto flex max-w-3xl flex-col items-center justify-center space-y-8 px-2 py-8">
    <div
      class="flex w-full cursor-pointer flex-col items-center gap-8 space-y-4 rounded-lg border-4 border-gray-400 bg-white p-4">
      <h1 class="text-center text-4xl font-bold">
        {#if chainCount > 0}
          Chaining (Iteration {currentChainIndex + 1} / {chainCount})
        {:else}
          Please select a chain length to continue
        {/if}
      </h1>
      <div class="dropdown-container relative w-full">
        <button
          class="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors duration-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:outline-none"
          onclick={() => (showChainDropdown = !showChainDropdown)}>
          Chain length: {chainCount || "Not set"}
        </button>
        {#if showChainDropdown}
          <div
            class="absolute left-0 z-10 mt-2 w-full rounded-lg border bg-white ring-1 shadow-lg ring-black transition-all"
            in:slide={{ duration: 200 }}
            out:slide={{ duration: 200 }}>
            <div class="max-h-60 overflow-y-auto rounded-lg">
              {#each Array.from({ length: 20 }, (_, i) => i + 1) as num}
                <button
                  class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onclick={() => {
                    chainCount = num;
                    showChainDropdown = false;
                  }}>
                  {num}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      {#if chainCount === 0}
        <div class="flex w-full items-center justify-center">
          <p class="text-lg text-gray-600">
            Please select a chain length to start configuring settings.
          </p>
        </div>
      {:else if !done}
        <div class="flex w-full flex-col space-y-6">
          {#if chainIterations[currentChainIndex]}
            {#if chainIterations[currentChainIndex].twinworld}
              <fieldset class="rounded-lg border-2 border-gray-300 p-4">
                <legend class="mb-2 text-2xl font-bold text-gray-800">Twin World</legend>
                <div>
                  <label
                    for="solarCap-{currentChainIndex}"
                    class="mb-1 block text-lg text-gray-700">
                    Solar Panel Capacity
                  </label>
                  <input
                    id="solarCap-{currentChainIndex}"
                    type="number"
                    required
                    min="0"
                    step="any"
                    class="text-les-highlight w-full rounded-lg border-2 border-gray-400 p-2"
                    bind:value={chainIterations[currentChainIndex].twinworld.solarPanelCapacity}
                    oninput={(e) => {
                      const value = +e.currentTarget.value;
                      chainIterations[currentChainIndex].twinworld.solarPanelCapacity = value;
                      validateField(
                        `twinworld-solarPanelCapacity-${currentChainIndex}`,
                        value,
                        validatePositiveNumber
                      );
                    }} />
                  {#if errors[`twinworld-solarPanelCapacity-${currentChainIndex}`]}
                    <p class="text-sm text-red-500">
                      {errors[`twinworld-solarPanelCapacity-${currentChainIndex}`]}
                    </p>
                  {/if}
                </div>
              </fieldset>
            {/if}

            {#if chainIterations[currentChainIndex].costmodel}
              <fieldset class="rounded-lg border-2 border-gray-300 p-4">
                <legend class="mb-2 text-2xl font-bold text-gray-800">Cost Model</legend>
                <div class="mb-4">
                  <label
                    for="priceNetBuy-{currentChainIndex}"
                    class="mb-1 block text-lg text-gray-700">
                    Price Network Buy Consumer
                  </label>
                  <input
                    id="priceNetBuy-{currentChainIndex}"
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    class="text-les-highlight w-full rounded-lg border-2 border-gray-400 p-2"
                    bind:value={
                      chainIterations[currentChainIndex].costmodel.priceNetworkBuyConsumer
                    }
                    oninput={(e) => {
                      const value = +e.currentTarget.value;
                      chainIterations[currentChainIndex].costmodel.priceNetworkBuyConsumer = value;
                      validateField(
                        `costmodel-priceNetworkBuyConsumer-${currentChainIndex}`,
                        value,
                        validatePositiveNumber
                      );
                    }} />

                  {#if errors[`costmodel-priceNetworkBuyConsumer-${currentChainIndex}`]}
                    <p class="text-sm text-red-500">
                      {errors[`costmodel-priceNetworkBuyConsumer-${currentChainIndex}`]}
                    </p>
                  {/if}
                </div>
                <div class="mb-4">
                  <label
                    for="priceNetSell-{currentChainIndex}"
                    class="mb-1 block text-lg text-gray-700">
                    Price Network Sell Consumer
                  </label>
                  <input
                    id="priceNetSell-{currentChainIndex}"
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    class="text-les-highlight w-full rounded-lg border-2 border-gray-400 p-2"
                    bind:value={
                      chainIterations[currentChainIndex].costmodel.priceNetworkSellConsumer
                    }
                    oninput={(e) => {
                      const value = +e.currentTarget.value;
                      chainIterations[currentChainIndex].costmodel.priceNetworkSellConsumer =
                        value;
                      validateField(
                        `costmodel-priceNetworkSellConsumer-${currentChainIndex}`,
                        value,
                        validatePositiveNumber
                      );
                    }} />
                  {#if errors[`costmodel-priceNetworkSellConsumer-${currentChainIndex}`]}
                    <p class="text-sm text-red-500">
                      {errors[`costmodel-priceNetworkSellConsumer-${currentChainIndex}`]}
                    </p>
                  {/if}
                </div>
                <div class="mb-4">
                  <label
                    for="fixPriceRatio-{currentChainIndex}"
                    class="mb-1 block text-lg text-gray-700">
                    Fixed Price Ratio
                  </label>
                  <input
                    id="fixPriceRatio-{currentChainIndex}"
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    class="text-les-highlight w-full rounded-lg border-2 border-gray-400 p-2"
                    bind:value={chainIterations[currentChainIndex].costmodel.fixedPriceRatio}
                    oninput={(e) => {
                      const value = +e.currentTarget.value;
                      chainIterations[currentChainIndex].costmodel.fixedPriceRatio = value;
                      validateField(
                        `costmodel-fixedPriceRatio-${currentChainIndex}`,
                        value,
                        validatePositiveNumber
                      );
                    }} />
                  {#if errors[`costmodel-fixedPriceRatio-${currentChainIndex}`]}
                    <p class="text-sm text-red-500">
                      {errors[`costmodel-fixedPriceRatio-${currentChainIndex}`]}
                    </p>
                  {/if}
                </div>
                {#if chainIterations[currentChainIndex].costmodel.name !== "Fixed Price" && chainIterations[currentChainIndex].costmodel.algorithm !== "TEMO"}
                  <div>
                    <label
                      for="costModelAlgo-{currentChainIndex}"
                      class="mb-1 block text-lg text-gray-700">
                      Algorithm
                    </label>
                    <div
                      id="costmodelalgo"
                      class="text-les-highlight h-40 w-full rounded-lg border-2 border-gray-400 p-2">
                    </div>
                  </div>
                {/if}
              </fieldset>
            {/if}
          
            {#if chainIterations[currentChainIndex].algo}
              <fieldset class="rounded-lg border-2 border-gray-300 p-4">
                <legend class="mb-2 text-2xl font-bold text-gray-800">Algorithm</legend>
                <div class="mb-4">
                  <label
                    for="maxTemp-{currentChainIndex}"
                    class="mb-1 block text-lg text-gray-700">
                    Max Temperature
                  </label>
                  <input
                    id="maxTemp-{currentChainIndex}"
                    type="number"
                    required
                    step="any"
                    min="0"
                    class="text-les-highlight w-full rounded-lg border-2 border-gray-400 p-2"
                    bind:value={chainIterations[currentChainIndex].algo.maxTemperature}
                    oninput={(e) => {
                      const value = +e.currentTarget.value;
                      chainIterations[currentChainIndex].algo.maxTemperature = value;
                      validateField(
                        `algo-maxTemperature-${currentChainIndex}`,
                        value,
                        validatePositiveNumber
                      );
                    }} />

                  {#if errors[`algo-maxTemperature-${currentChainIndex}`]}
                    <p class="text-sm text-red-500">
                      {errors[`algo-maxTemperature-${currentChainIndex}`]}
                    </p>
                  {/if}
                </div>
                {#if chainIterations[currentChainIndex].algo.name !== "Greedy Planning" && chainIterations[currentChainIndex].algo.algorithm !== "Simulated Annealing"}
                  <div>
                    <label
                      for="algoSource-{currentChainIndex}"
                      class="mb-1 block text-lg text-gray-700">
                      Algorithm
                    </label>
                    <div
                      id="algorithm"
                      class="text-les-highlight h-40 w-full rounded-lg border-2 border-gray-400 p-2">
                    </div>
                  </div>
                {/if}
              </fieldset>

              {#if chainIterations[currentChainIndex].energyflow}
                <fieldset class="rounded-lg border-2 border-gray-300 p-4">
                  <legend class="mb-2 text-2xl font-bold text-gray-800">Energyflow</legend>
                  <div class="mb-4">
                    <label
                      for="energyflowPanels-{currentChainIndex}"
                      class="mb-1 block text-lg text-gray-700">
                      Solar Panels Factor
                    </label>
                    <input
                      id="energyflowPanels-{currentChainIndex}"
                      type="number"
                      required
                      step="any"
                      min="0"
                      class="text-les-highlight w-full rounded-lg border-2 border-gray-400 p-2"
                      bind:value={chainIterations[currentChainIndex].energyflow.solarPanelsFactor}
                      oninput={(e) => {
                        const value = +e.currentTarget.value;
                        chainIterations[currentChainIndex].energyflow.solarPanelsFactor = value;
                        validateField(
                          `energyflow-solarPanelsFactor-${currentChainIndex}`,
                          value,
                          validatePositiveNumber
                        );
                      }} />

                    {#if errors[`energyflow-solarPanelsFactor-${currentChainIndex}`]}
                      <p class="text-sm text-red-500">
                        {errors[`energyflow-solarPanelsFactor-${currentChainIndex}`]}
                      </p>
                    {/if}
                  </div>
                  <div>
                    <label
                      for="energyflowUsage-{currentChainIndex}"
                      class="mb-1 block text-lg text-gray-700">
                      Energy Usage Factor
                    </label>
                    <input
                      id="energyflowUsage-{currentChainIndex}"
                      type="number"
                      required
                      step="any"
                      min="0"
                      class="text-les-highlight w-full rounded-lg border-2 border-gray-400 p-2"
                      bind:value={chainIterations[currentChainIndex].energyflow.energyUsageFactor}
                      oninput={(e) => {
                        const value = +e.currentTarget.value;
                        chainIterations[currentChainIndex].energyflow.energyUsageFactor = value;
                        validateField(
                          `energyflow-energyUsageFactor-${currentChainIndex}`,
                          value,
                          validatePositiveNumber
                        );
                      }} />
                    {#if errors[`energyflow-energyUsageFactor-${currentChainIndex}`]}
                      <p class="text-sm text-red-500">
                        {errors[`energyflow-energyUsageFactor-${currentChainIndex}`]}
                      </p>
                    {/if}
                  </div>
                </fieldset>
              {/if}
            {/if}
          {/if}
        </div>
        <div class="flex w-full justify-between">
          <button
            class="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors duration-300 hover:bg-gray-400"
            onclick={previousChainIteration}
            disabled={currentChainIndex === 0 || hasErrors}>
            Previous
          </button>
          {#if currentChainIndex < chainCount - 1}
            <button
              class="cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-white transition-colors duration-300 hover:bg-blue-600 disabled:opacity-50"
              onclick={nextChainIteration}
              disabled={hasErrors}>
              Next
            </button>
          {:else}
            <button
              class="bg-les-highlight hover:bg-sidebar cursor-pointer rounded-md px-4 py-2 text-white transition-colors duration-300"
              onclick={runChain}
              disabled={hasErrors}>
              Run
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
