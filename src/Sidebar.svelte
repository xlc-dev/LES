<script lang="ts">
  import { getComponent, getStepperData } from "./state.svelte";

  const component = getComponent();
  const stepperData = getStepperData();

  let isMenuOpen = $state(false);

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

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

<div
  class="fixed left-0 top-0 h-full w-64 bg-gray-900 z-50
          transition-transform duration-300 ease-in-out
          md:translate-x-0 sidebar-container
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

{#if isMenuOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
{/if}

<button
  class="fixed top-4 left-4 z-50 md:hidden bg-les-highlight p-2 rounded-sm hamburger-button"
  class:hidden={isMenuOpen}
  aria-label="Close menu"
  onclick={toggleMenu}>
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
