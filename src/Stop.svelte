<script lang="ts">
  import Chart from "./Chart.svelte";
  import { getRuntime, getEfficiencyResults } from "./state.svelte";
  import { downloadExcel } from "./excel.svelte";

  interface Props {
    newSession: () => void;
  }

  const { newSession }: Props = $props();

  const runtime = getRuntime();
  const efficiencyResults = getEfficiencyResults();
</script>

<div class="mx-auto w-full max-w-4xl px-3 pt-8">
  <h1 class="pb-4 text-center text-4xl font-bold">Statistics for your session</h1>
  <Chart />
  <div
    class="text-les-highlight relative mt-8 mb-8 grid grid-cols-2 gap-4 rounded-lg border-4 border-gray-400 bg-white p-4 shadow-sm">
    <table class="col-span-2 w-full text-sm md:text-base">
      <tbody>
        <tr class="border-b border-gray-400">
          <td class="p-2 font-semibold">Total saved by Own Solar Panels:</td>
          <td class="p-2"
            >{efficiencyResults.efficiencyResults
              .reduce((acc, result) => acc + result.solarEnergyIndividual, 0)
              .toFixed(2)} kWh</td>
        </tr>
        <tr class="border-b border-gray-400">
          <td class="p-2 font-semibold">Total saved by Other Households' Solar Panels:</td>
          <td class="p-2"
            >{(
              efficiencyResults.efficiencyResults.reduce(
                (acc, result) => acc + result.solarEnergyTotal,
                0
              ) -
              efficiencyResults.efficiencyResults.reduce(
                (acc, result) => acc + result.solarEnergyIndividual,
                0
              )
            ).toFixed(2)} kWh</td>
        </tr>
        <tr class="border-b border-gray-400">
          <td class="p-2 font-semibold">Total saved by the Community:</td>
          <td class="p-2"
            >{efficiencyResults.efficiencyResults
              .reduce((acc, result) => acc + result.solarEnergyTotal, 0)
              .toFixed(2)} kWh</td>
        </tr>
        <tr class="border-b border-gray-400">
          <td class="p-2 font-semibold">Total Money Saved:</td>
          <td class="p-2"
            >€{efficiencyResults.efficiencyResults
              .reduce((acc, result) => acc + result.totalAmountSaved, 0)
              .toFixed(2)}</td>
        </tr>
        <tr class="border-b border-gray-400">
          <td class="p-2 font-semibold">Runtime:</td>
          <td class="p-2">{runtime.runtime ? runtime.runtime.toFixed(2) : "0.00"} seconds</td>
        </tr>
      </tbody>
    </table>
    <div class="col-span-2 mt-8 flex justify-between">
      <button
        class="cursor-pointer rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors duration-300 hover:bg-blue-600"
        onclick={newSession}>
        New session
      </button>
      <button
        class="cursor-pointer rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors duration-300 hover:bg-blue-600"
        onclick={downloadExcel}>
        Download
      </button>
    </div>
  </div>
</div>
