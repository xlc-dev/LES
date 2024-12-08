<script lang="ts">
  import { getComponent, getStepperData } from "./state.svelte";

  const component = getComponent();
  const stepperData = getStepperData();

  let isMenuOpen = $state(false);

  function handleClickOutside(event: any) {
    if (
      !event.target.closest(".sidebar-container") &&
      !event.target.closest(".hamburger-button")
    ) {
      isMenuOpen = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<!-- Mobile Sidebar -->
<div
  class="fixed left-0 top-0 h-full w-64 bg-gray-900 z-50
          transition-transform duration-300 ease-in-out
          lg:hidden sidebar-container
          {isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col">
  <div class="grow overflow-auto">
    <div class="flex w-full items-center gap-3 bg-les-gray-700 p-4">
      <img src="/arrows.png" alt="" class="rotate-180 transform" />
      <p class="font-bold">LES</p>
    </div>
    <div class="mt-4 flex flex-col items-start justify-center gap-3">
      <button
        class={`flex w-full items-center gap-3 p-4 transition-colors duration-200 hover:bg-les-gray-700 ${component.currentComponent === "Dashboard" ? "bg-les-gray-700" : ""}`}
        onclick={() => {
          component.setComponent("Dashboard");
          isMenuOpen = false;
        }}>
        <img src="/rectangle.png" alt="" />
        <p>Dashboard</p>
      </button>
      <button
        class={`flex w-full items-center gap-3 p-4 transition-colors duration-200 hover:bg-les-gray-700 ${component.currentComponent === "Simulation" ? "bg-les-gray-700" : ""}`}
        onclick={() => {
          component.setComponent("Simulation");
          isMenuOpen = false;
        }}>
        <img src="/adjustment.png" alt="" />
        <p>Simulation</p>
      </button>
      <button
        class={`flex w-full items-center gap-3 p-4 transition-colors duration-200 hover:bg-les-gray-700 ${component.currentComponent === "Schedulable Loads" ? "bg-les-gray-700" : ""}`}
        onclick={() => {
          component.setComponent("Schedulable Loads");
          isMenuOpen = false;
        }}>
        <img src="/calendar.png" alt="" />
        <p>Schedulable Loads</p>
      </button>
    </div>
  </div>
  <div class="shrink-0">
    <div class="px-4 py-4">
      <h3 class="pb-4 text-lg font-semibold">Selected Options:</h3>
      <p class="text-gray-400">
        Twin World: {stepperData.stepperData!.steps[0].selectedOption!.label}
      </p>
      <p class="text-gray-400">
        Cost Model: {stepperData.stepperData!.steps[1].selectedOption!.label}
      </p>
      <p class="text-gray-400">
        Algorithm: {stepperData.stepperData!.steps[2].selectedOption!.label}
      </p>
      <p class="text-gray-400">
        Energyflow: {stepperData.stepperData!.steps[3].selectedOption!.label}
      </p>
    </div>
    <button
      id="stop-button"
      class="flex w-full items-center gap-3 bg-red-950 p-4 py-6 transition-colors duration-200 hover:bg-red-800 hover:brightness-110"
      onclick={() => component.setComponent("Stop")}>
      <img src="/stop.png" alt="" />
      <p>Stop Simulation</p>
    </button>
  </div>
</div>

<!-- Top Bar for Desktop -->
<div
  class="hidden lg:flex w-full bg-gray-900 px-4 py-2 items-center justify-between border-b border-gray-800 sticky">
  <div class="flex items-center gap-2">
    <img src="/arrows.png" alt="" class="rotate-180 transform h-6 w-6" />
    <span class="text-lg font-bold text-white">LES</span>
  </div>
  <nav class="flex items-center space-x-4">
    <button
      class={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors duration-200 text-sm cursor-pointer
        ${
          component.currentComponent === "Dashboard"
            ? "bg-les-highlight text-white"
            : "text-gray-300 hover:bg-les-gray-700 hover:text-white"
        }`}
      onclick={() => component.setComponent("Dashboard")}>
      <img src="/rectangle.png" alt="" class="h-4 w-4" />
      <span>Dashboard</span>
    </button>
    <button
      class={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors duration-200 text-sm cursor-pointer
        ${
          component.currentComponent === "Simulation"
            ? "bg-les-highlight text-white"
            : "text-gray-300 hover:bg-les-gray-700 hover:text-white"
        }`}
      onclick={() => component.setComponent("Simulation")}>
      <img src="/adjustment.png" alt="" class="h-4 w-4" />
      <span>Simulation</span>
    </button>
    <button
      class={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors duration-200 text-sm cursor-pointer
        ${
          component.currentComponent === "Schedulable Loads"
            ? "bg-les-highlight text-white"
            : "text-gray-300 hover:bg-les-gray-700 hover:text-white"
        }`}
      onclick={() => component.setComponent("Schedulable Loads")}>
      <img src="/calendar.png" alt="" class="h-4 w-4" />
      <span>Schedulable Loads</span>
    </button>
  </nav>
  <div class="flex items-center space-x-3">
    <div class="text-right mr-2">
      <div class="flex flex-col space-y-0.5">
        <div class="text-2xs text-gray-400 uppercase tracking-wider">Selected Configuration</div>
        <div class="text-xs text-gray-200 leading-tight">
          {stepperData.stepperData!.steps[0].selectedOption!.label} ·
          {stepperData.stepperData!.steps[1].selectedOption!.label} ·
          {stepperData.stepperData!.steps[2].selectedOption!.label} ·
          {stepperData.stepperData!.steps[3].selectedOption!.label}
        </div>
      </div>
    </div>
    <button
      id="stop-button"
      class="flex items-center gap-1.5 bg-red-950 text-white px-3 py-1.5 rounded-md text-sm
             hover:bg-red-900 transition-colors duration-200 cursor-pointer"
      onclick={() => component.setComponent("Stop")}>
      <img src="/stop.png" alt="" class="h-4 w-4" />
      <span>Stop</span>
    </button>
  </div>
</div>

<!-- Mobile Hamburger Button -->
<button
  class="fixed top-4 left-4 z-50 lg:hidden bg-les-highlight p-2 rounded-sm hamburger-button"
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
  <div class="fixed inset-0 bg-black/90 bg-opacity-50 z-40 lg:hidden"></div>
{/if}
