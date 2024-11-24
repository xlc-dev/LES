<script lang="ts">
  import { getComponent, getStepperData } from "./state.svelte";

  const component = getComponent();
  const stepperData = getStepperData();
</script>

<div class="flex min-h-screen w-64 flex-col justify-between bg-gray-900">
  <div>
    <div class="flex w-full items-center gap-3 bg-les-gray-700 p-4">
      <img src="/arrows.png" alt="" class="rotate-180 transform" />
      <p class="font-bold">LES</p>
    </div>

    <div class="mt-4 flex flex-col items-start justify-center gap-3">
      <button
        class={`flex w-full items-center gap-3 p-4 transition-colors duration-200 hover:bg-les-gray-700 ${component.currentComponent === "Dashboard" ? "bg-les-gray-700" : ""}`}
        on:click={() => component.setComponent("Dashboard")}>
        <img src="/rectangle.png" alt="" />
        <p>Dashboard</p>
      </button>

      <button
        class={`flex w-full items-center gap-3 p-4 transition-colors duration-200 hover:bg-les-gray-700 ${component.currentComponent === "Simulation" ? "bg-les-gray-700" : ""}`}
        on:click={() => component.setComponent("Simulation")}>
        <img src="/adjustment.png" alt="" />
        <p>Simulation</p>
      </button>

      <button
        class={`flex w-full items-center gap-3 p-4 transition-colors duration-200 hover:bg-les-gray-700 ${component.currentComponent === "Schedulable Loads" ? "bg-les-gray-700" : ""}`}
        on:click={() => component.setComponent("Schedulable Loads")}>
        <img src="/calendar.png" alt="" />
        <p>Schedulable Loads</p>
      </button>
    </div>
  </div>

  <div class="mt-auto">
    <div class="px-4">
      <h3 class="pb-4 text-lg font-semibold">Selected Options:</h3>
      <p class="text-gray-400">
        Twin World: {stepperData.stepperData!.steps[0]?.selectedOption!.label}
      </p>
      <p class="text-gray-400">
        Cost Model: {stepperData.stepperData!.steps[1]?.selectedOption!.label}
      </p>
      <p class="text-gray-400">
        Algorithm: {stepperData.stepperData!.steps[2]?.selectedOption!.label}
      </p>
      <p class="text-gray-400">
        Energyflow: {stepperData.stepperData!.steps[3]?.selectedOption!.label}
      </p>
    </div>

    <button
      id="stop-button"
      class="mt-4 flex w-full items-center gap-3 bg-red-950 p-4 py-6 transition-colors duration-200 hover:bg-red-800 hover:brightness-110"
      on:click={() => component.setComponent("Stop")}>
      <img src="/stop.png" alt="" />
      <p>Stop Simulation</p>
    </button>
  </div>
</div>
