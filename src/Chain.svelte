<script lang="ts">
  import { slide } from "svelte/transition";
  import { getStepperData } from "./state.svelte";
  import Stepper from "./Stepper.svelte";
  import Dashboard from "./Dashboard.svelte";

  interface Props {
    loop: () => void;
  }

  const { loop }: Props = $props();

  const stepperData = getStepperData();

  let done = $state(false);
  let running = $state(false);

  let showChainDropdown = $state(false);

  let chainCount: number = $state(1);
  let currentChainIndex = $state(0);

  let chainIterations: StepperData[] = $state([]);

  function nextChainIteration() {
    if (currentChainIndex < chainCount - 1) {
      currentChainIndex += 1;
    }
  }

  function previousChainIteration() {
    if (currentChainIndex > 0) {
      currentChainIndex -= 1;
    }
  }

  async function runChain() {
    running = true;
    for (let i = 0; i < chainCount; i++) {
      let settings = chainIterations[i];
      settings = settings; // TODO: finish
      loop();
    }
  }

  function handleClickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest(".dropdown-container")) {
      showChainDropdown = false;
    }
  }

  $effect(() => {
    chainIterations = Array.from({ length: chainCount }, () => ({
      twinworld: stepperData.stepperData.twinworld,
      costmodel: stepperData.stepperData.costmodel,
      algo: stepperData.stepperData.algo,
      energyflow: stepperData.stepperData.energyflow,
      energyflowlabel: stepperData.stepperData.energyflowlabel,
    }));
    currentChainIndex = 0;
  });
</script>

<svelte:window onclick={handleClickOutside} />

{#if !done && !running}
  <Stepper onComplete={() => (done = true)} />
{:else if done && !running}
  <div
    class="text-les-highlight mx-auto flex max-w-3xl flex-col items-center justify-center space-y-8 px-2 py-8">
    <div
      class="flex w-full flex-col items-center gap-8 space-y-4 rounded-lg border-4 border-gray-400 bg-white p-4">
      <h1 class="text-center text-4xl font-bold">
        Chaining (Iteration {currentChainIndex + 1} / {chainCount})
      </h1>

      <div class="dropdown-container relative w-full">
        <button
          class="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors duration-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:outline-none"
          onclick={() => (showChainDropdown = !showChainDropdown)}>
          {`Chain length: ${chainCount}`}
        </button>

        {#if showChainDropdown}
          <div
            class="absolute left-0 z-10 mt-2 w-56 rounded-lg border bg-white ring-1 shadow-lg ring-black transition-all lg:w-full"
            in:slide={{ duration: 200 }}
            out:slide={{ duration: 200 }}>
            <div class="max-h-60 overflow-y-auto rounded-lg">
              {#each Array.from({ length: 100 }, (_, i) => i + 1) as num}
                <button
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
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

      <div class="w-full rounded-lg border border-gray-300 bg-gray-50 p-6"></div>

      <div class="flex w-full justify-between">
        <button
          class="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors duration-300 disabled:opacity-50
        {currentChainIndex !== 0 ? 'cursor-pointer hover:bg-gray-400' : 'cursor-not-allowed'}"
          onclick={previousChainIteration}
          disabled={currentChainIndex === 0}>
          Previous
        </button>

        {#if currentChainIndex < chainCount - 1}
          <button
            class="cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-white transition-colors duration-300 hover:bg-blue-600 disabled:opacity-50"
            onclick={nextChainIteration}>
            Next
          </button>
        {:else}
          <button
            class="bg-les-highlight hover:bg-sidebar cursor-pointer rounded-md px-4 py-2 text-white transition-colors duration-300"
            onclick={runChain}>
            Run
          </button>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <Dashboard />
{/if}
