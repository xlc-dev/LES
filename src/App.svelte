<svelte:options runes={true} />

<script lang="ts">
  import Stepper from "./Stepper.svelte";
  import Dashboard from "./Dashboard.svelte";
  import Simulation from "./Simulation.svelte";
  import SchedulableLoads from "./SchedulableLoads.svelte";
  import Sidebar from "./Sidebar.svelte";
  import Stop from "./Stop.svelte";
  import HouseholdView from "./HouseholdView.svelte";

  import { getDashboard, getComponent } from "./state.svelte";

  const dashboard = getDashboard();
  const currentComponent = getComponent();
  let started = $state(true);
  let simulationType = $state<"single" | "chain" | null>("single");
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
      class="block w-full rounded-lg bg-blue-500 py-3 transition-colors duration-200 hover:bg-blue-600">
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
    <p class="py-4 text-center text-lg">Please select the simulation you would like to run.</p>

    <div class="flex flex-col gap-4 py-4">
      <button
        onclick={() => {
          simulationType = "single";
        }}
        class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600">
        Single
      </button>
      <button
        onclick={() => {
          simulationType = "chain";
        }}
        class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600">
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
    <Stepper />
  {:else if simulationType === "chain" && !dashboard.startDashboard}
    <!-- <Chain /> -->
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
        <Stop />
      {/if}
    </div>
  {/if}
</main>
