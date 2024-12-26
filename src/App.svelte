<svelte:options runes={true} />

<script lang="ts">
  import Stepper from "./Stepper.svelte";
  import Dashboard from "./Dashboard.svelte";
  import Simulation from "./Simulation.svelte";
  import SchedulableLoads from "./SchedulableLoads.svelte";
  import Sidebar from "./Sidebar.svelte";
  import Stop from "./Stop.svelte";
  import HouseholdView from "./HouseholdView.svelte";

  import {
    getDashboard,
    getComponent,
    getLoopManager,
    getRuntime,
    getStepperData,
    getStartDate,
    getEndDate,
    getDaysInPlanning,
    getHousehold,
    getTimeDailies,
    getEfficiencyResults,
  } from "./state.svelte";

  const dashboard = getDashboard();
  const currentComponent = getComponent();
  const loopManager = getLoopManager();
  const runtime = getRuntime();
  const stepperData = getStepperData();
  const startDate = getStartDate();
  const endDate = getEndDate();
  const daysInPlanning = getDaysInPlanning();
  const household = getHousehold();
  const timeDailies = getTimeDailies();
  const efficiencyResults = getEfficiencyResults();

  let started = $state(false);
  let completed = $state(false);
  let simulationType = $state<"single" | "chain" | null>(null);

  function loop() {
    runtime.startRuntime();
    loopManager.startLoop(() => {
      runtime.stopRuntime();
      completed = true;
    });
  }

  function newSession() {
    started = false;
    completed = false;
    simulationType = null;
    dashboard.setDashboard(false);
    runtime.stopRuntime();
    // @ts-ignore
    stepperData.setStepperData({});
    currentComponent.setComponent("Dashboard");
    startDate.setStartDate(0);
    endDate.setEndDate(0);
    daysInPlanning.setDaysInPlanning(0);
    household.setHousehold(null);
    timeDailies.setTimeDailies([]);
    efficiencyResults.setEfficiencyResults([]);
  }
</script>

<svelte:head>
  <title>Local Energy System</title>
  <meta
    name="description"
    content="A simulation tool for comparing schedulable load algorithms and twinworlds in a local energy system environment." />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="/favicon.png" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.36.5/ace.min.js"></script>
</svelte:head>

{#snippet msg()}
  <div class="mx-auto max-w-2xl p-8">
    <img src="/homepagelogo.png" class="w-75 mx-auto rounded-lg" alt="LES Logo" />
    <h1 class="pt-4 text-center text-4xl font-bold">Local Energy System Simulation</h1>
    <p class="py-4 text-center text-lg">
      Welcome to the LES Research application. You can determine the efficiency of algorithms and
      cost models by creating your own simulations. Please continue with the following steps to set
      up the environment you would like to research.
    </p>
    <button
      onclick={() => {
        started = true;
      }}
      class="block w-full rounded-lg bg-blue-500 py-3 transition-colors duration-200 hover:bg-blue-600 cursor-pointer">
      Get started
    </button>
    <p class="py-4 text-center text-sm">
      This platform is developed for the UNESCO Chair of AI & DS for Society of the Hague
      University of Applied Sciences.
      <!-- If you try this tool then please -->
      <!--      send any comments or feedback to Dr. Hani Alers: <a -->
      <!--        href="mailto:hal@hhs.nl" -->
      <!--        class="hover:underline text-les-blue">hal@hhs.nl</a> -->
    </p>
  </div>
{/snippet}

{#snippet choices()}
  <div class="mx-auto max-w-2xl p-8">
    <h1 class="text-center text-4xl font-bold">Select your simulation type</h1>
    <p class="py-4 text-center text-lg">
      Please select the simulation type you would like to run.
    </p>

    <div class="flex flex-col gap-4 py-4">
      <button
        onclick={() => {
          simulationType = "single";
        }}
        class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600 cursor-pointer">
        Single
      </button>
      <button
        onclick={() => {
          simulationType = "chain";
        }}
        class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600 cursor-pointer">
        Chain
      </button>
    </div>
  </div>
{/snippet}

<main class="min-h-screen bg-les-gray-500 text-white">
  {#if !started && !dashboard.startDashboard}
    {@render msg()}
  {:else if !simulationType && !dashboard.startDashboard}
    {@render choices()}
  {:else if simulationType === "single" && !dashboard.startDashboard}
    <Stepper onComplete={loop} />
  {:else if simulationType === "chain" && !dashboard.startDashboard}
    <Stepper onComplete={loop} />
  {:else}
    <div class="flex md:flex-col h-screen">
      {#if currentComponent.currentComponent !== "Stop"}
        <Sidebar />
        <div class="flex-1 overflow-auto p-4 text-les-highlight">
          {#if currentComponent.currentComponent === "Dashboard"}
            <Dashboard />
          {:else if currentComponent.currentComponent === "Simulation"}
            <Simulation />
          {:else if currentComponent.currentComponent === "Schedulable Loads"}
            <SchedulableLoads />
          {:else if currentComponent.currentComponent === "Household"}
            <HouseholdView />
          {/if}
        </div>
      {/if}
      {#if currentComponent.currentComponent === "Stop"}
        <Stop {newSession} />
      {/if}
    </div>
  {/if}

  {#if completed}
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-gray-900 opacity-75"></div>
      <div
        class="relative rounded-lg bg-white p-8 shadow-2xl border-4 border-gray-400 text-les-highlight">
        <p class="mb-4 text-2xl font-bold">Simulation finished</p>
        <div class="flex justify-between">
          <button
            class="mt-4 rounded-lg bg-blue-500 p-2 text-white transition duration-200 hover:bg-blue-600 cursor-pointer"
            onclick={() => {
              completed = false;
              runtime.stopRuntime();
            }}>
            Continue
          </button>
          <button
            class="mt-4 rounded-lg bg-blue-500 p-2 text-white transition duration-200 hover:bg-blue-600 cursor-pointer"
            onclick={() => {
              completed = false;
              currentComponent.setComponent("Stop");
            }}>
            View Result
          </button>
        </div>
      </div>
    </div>
  {/if}
</main>
