<script lang="ts">
  import { getComponent, getStepperData, getRuntime, getLoopManager } from "./state.svelte";

  import Arrows from "/public/arrows.png";
  import Rectangle from "/public/rectangle.png";
  import Adjustment from "/public/adjustment.png";
  import Calendar from "/public/calendar.png";
  import Stop from "/public/stop.png";

  const component = getComponent();
  const stepperData = getStepperData();
  const runtime = getRuntime();
  const loopManager = getLoopManager();

  let isMenuOpen = $state(false);
  let showLegend = $state(false);

  function handleClickOutside(event: any) {
    if (
      !event.target.closest(".sidebar-container") &&
      !event.target.closest(".hamburger-button")
    ) {
      isMenuOpen = false;
    }
  }

  function stop() {
    loopManager.stopLoop();
    runtime.stopRuntime();
    component.setComponent("Stop");
  }
</script>

<svelte:window onclick={handleClickOutside} />

<!-- Mobile Sidebar -->
<div
  class="sidebar-container fixed top-0 left-0 z-50 h-full w-64
          bg-gray-900 transition-transform duration-300
          ease-in-out lg:hidden
          {isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col">
  <div class="grow overflow-auto">
    <div class="bg-les-gray-700 flex w-full items-center gap-3 p-4">
      <img src={Arrows} alt="" class="rotate-180 transform" />
      <p class="font-bold">LES</p>
    </div>
    <div class="mt-4 flex flex-col items-start justify-center gap-3">
      <button
        class="hover:bg-les-gray-700 flex w-full items-center gap-3 p-4 transition-colors duration-200"
        class:bg-les-gray-700={component.currentComponent === "Dashboard"}
        onclick={() => {
          component.setComponent("Dashboard");
          isMenuOpen = false;
        }}>
        <img src={Rectangle} alt="" />
        <p>Dashboard</p>
      </button>
      <button
        class="hover:bg-les-gray-700 flex w-full items-center gap-3 p-4 transition-colors duration-200"
        class:bg-les-gray-700={component.currentComponent === "Simulation"}
        onclick={() => {
          component.setComponent("Simulation");
          isMenuOpen = false;
        }}>
        <img src={Adjustment} alt="" />
        <p>Simulation</p>
      </button>
      <button
        class="hover:bg-les-gray-700 flex w-full items-center gap-3 p-4 transition-colors duration-200"
        class:bg-les-gray-700={component.currentComponent === "Schedulable Loads"}
        onclick={() => {
          component.setComponent("Schedulable Loads");
          isMenuOpen = false;
        }}>
        <img src={Calendar} alt="" />
        <p>Schedulable Loads</p>
      </button>
    </div>
  </div>
  <div class="shrink-0">
    <button
      class="bg-les-highlight hover:bg-les-gray-700 flex w-full items-center gap-3 p-4 text-white transition-colors duration-200"
      aria-label="Show Legend"
      onclick={() => {
        showLegend = !showLegend;
        isMenuOpen = false;
      }}>
      <span>Show Legend</span>
    </button>
    <div class="px-4 py-4">
      <h3 class="pb-4 text-lg font-semibold">Selected Options:</h3>
      <p class="text-gray-400">
        Twin World: {stepperData.stepperData.twinworld.name}
      </p>
      <p class="text-gray-400">
        Cost Model: {stepperData.stepperData.costmodel.name}
      </p>
      <p class="text-gray-400">
        Algorithm: {stepperData.stepperData.algo.name}
      </p>
      <p class="text-gray-400">
        Energyflow: {stepperData.stepperData.energyflowlabel}
      </p>
    </div>
    <button
      id="stop-button"
      class="flex w-full items-center gap-3 bg-red-950 p-4 py-6 transition-colors duration-200 hover:bg-red-800 hover:brightness-110"
      onclick={stop}>
      <img src={Stop} alt="" />
      <p>Stop Simulation</p>
    </button>
  </div>
</div>

<!-- Top Bar for Desktop -->
<div
  class="sticky hidden w-full items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 lg:flex">
  <div class="flex items-center gap-2">
    <img src={Arrows} alt="" class="h-6 w-6 rotate-180 transform" />
    <span class="text-lg font-bold text-white">LES</span>
  </div>
  <nav class="flex items-center space-x-4">
    <button
      class="hover:bg-les-gray-700 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-300 transition-colors duration-200 hover:text-white"
      class:bg-les-highlight={component.currentComponent === "Dashboard"}
      class:text-white={component.currentComponent === "Dashboard"}
      onclick={() => component.setComponent("Dashboard")}>
      <img src={Rectangle} alt="" class="h-4 w-4" />
      <span>Dashboard</span>
    </button>
    <button
      class="hover:bg-les-gray-700 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-300 transition-colors duration-200 hover:text-white"
      class:bg-les-highlight={component.currentComponent === "Simulation"}
      class:text-white={component.currentComponent === "Simulation"}
      onclick={() => component.setComponent("Simulation")}>
      <img src={Adjustment} alt="" class="h-4 w-4" />
      <span>Simulation</span>
    </button>
    <button
      class="hover:bg-les-gray-700 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-300 transition-colors duration-200 hover:text-white"
      class:bg-les-highlight={component.currentComponent === "Schedulable Loads"}
      class:text-white={component.currentComponent === "Schedulable Loads"}
      onclick={() => component.setComponent("Schedulable Loads")}>
      <img src={Calendar} alt="" class="h-4 w-4" />
      <span>Schedulable Loads</span>
    </button>
  </nav>
  <div class="flex items-center space-x-3">
    <div class="mr-2 text-right">
      <div class="flex flex-col space-y-0.5">
        <div class="text-2xs tracking-wider text-gray-400 uppercase">Selected Configuration</div>
        <div class="text-xs leading-tight text-gray-200">
          {stepperData.stepperData.twinworld.name} ·
          {stepperData.stepperData.costmodel.name} ·
          {stepperData.stepperData.algo.name} ·
          {stepperData.stepperData.energyflowlabel}
        </div>
      </div>
    </div>
    <button
      class="bg-les-highlight hover:bg-les-gray-700 flex cursor-pointer items-center gap-1.5 rounded-md px-3
             py-1.5 text-sm text-white transition-colors duration-200"
      onclick={() => (showLegend = !showLegend)}>
      <span>Show Legend</span>
    </button>
    <button
      id="stop-button"
      class="flex cursor-pointer items-center gap-1.5 rounded-md bg-red-950 px-3 py-1.5 text-sm
             text-white transition-colors duration-200 hover:bg-red-900"
      onclick={stop}>
      <img src={Stop} alt="" class="h-4 w-4" />
      <span>Stop</span>
    </button>
  </div>
</div>

<!-- Mobile Hamburger Button -->
<button
  class="bg-les-highlight hamburger-button fixed top-4 left-4 z-50 rounded-sm p-2 lg:hidden"
  class:hidden={isMenuOpen}
  aria-label="Open menu"
  onclick={() => (isMenuOpen = !isMenuOpen)}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-6 w-6 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4 6h16M4 12h16M4 18h16" />
  </svg>
</button>

{#if isMenuOpen}
  <div class="bg-opacity-50 fixed inset-0 z-40 bg-black/90 lg:hidden"></div>
{/if}

{#if showLegend}
  <div
    class="text-les-highlight legend-container absolute top-1/3 left-1/2 z-50 mx-auto w-3/4 max-w-2xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg border-4 border-gray-400 bg-white p-4 shadow-lg lg:w-full">
    <button
      class="text-les-highlight absolute top-0 right-0 cursor-pointer p-2 text-xs transition-colors duration-200 hover:text-blue-500"
      aria-label="Close legend"
      onclick={() => (showLegend = !showLegend)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    <div class="flex flex-col gap-2 p-4">
      <div class="mb-2 flex items-center">
        <div class="mr-2 h-4 w-4 bg-gray-700"></div>
        <p>contain the time slots that are unavailable to plan appliances in.</p>
      </div>
      <div class="mb-2 flex items-center">
        <div class="mr-2 h-4 w-4 bg-blue-700"></div>
        <p>contain the time slots that are available to plan appliances in.</p>
      </div>
      <div class="mb-2 flex items-center">
        <div class="mr-2 h-4 w-4 bg-green-700"></div>
        <p>indicate that the planned energy used is drawn from solar panels.</p>
      </div>
      <div class="flex items-center">
        <div class="mr-2 h-4 w-4 bg-red-700"></div>
        <p>indicate that the planned energy used is drawn from the national grid.</p>
      </div>
    </div>
  </div>
{/if}
