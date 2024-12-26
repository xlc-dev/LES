<script lang="ts">
  import Chart from "./Chart.svelte";

  import { getEfficiencyResults, getRuntime, getStepperData } from "./state.svelte";

  const stepperData = getStepperData();
  const efficiencyResults = getEfficiencyResults();
  const runtime = getRuntime();

  let sumEfficiencyIndividual: number = $derived.by(() => {
    const results = efficiencyResults.efficiencyResults;
    return results.reduce((sum, result) => sum + result.solarEnergyIndividual, 0);
  });

  let sumEfficiencyTotal: number = $derived.by(() => {
    const results = efficiencyResults.efficiencyResults;
    return results.reduce((sum, result) => sum + result.solarEnergyTotal, 0);
  });

  let sumTotalMoneySaved: number = $derived.by(() => {
    const results = efficiencyResults.efficiencyResults;
    return results.reduce((sum, result) => sum + result.totalAmountSaved, 0);
  });

  let sumEfficiencyNoSolar: number = $derived(sumEfficiencyTotal - sumEfficiencyIndividual);
</script>

<div class="flex flex-col gap-8">
  <Chart />
  <div
    class="rounded-lg border-4 border-gray-400 bg-white p-4 md:px-20 shadow-sm w-full max-w-7xl mx-auto">
    <table class="w-full text-sm md:text-base">
      <tbody>
        <tr class="border-b border-gray-400">
          <td class="p-2 font-semibold">Number of Households:</td>
          <td class="min-w-40 p-2">
            {stepperData.stepperData.twinworld.households.length}
          </td>
        </tr>
        {#if sumEfficiencyIndividual !== null}
          <tr class="border-b border-gray-400">
            <td class="p-2 font-semibold">Total saved by own solar panels:</td>
            <td class="min-w-40 p-2">{sumEfficiencyIndividual.toFixed(2)} kWh</td>
          </tr>
        {/if}
        {#if sumEfficiencyNoSolar !== null}
          <tr class="border-b border-gray-400">
            <td class="p-2 font-semibold">Total saved by other households' solar panels:</td>
            <td class="min-w-40 p-2">{sumEfficiencyNoSolar.toFixed(2)} kWh</td>
          </tr>
        {/if}
        {#if sumEfficiencyTotal !== null}
          <tr class="border-b border-gray-400">
            <td class="p-2 font-semibold">Total saved by the community:</td>
            <td class="min-w-40 p-2">{sumEfficiencyTotal.toFixed(2)} kWh</td>
          </tr>
        {/if}
        {#if sumTotalMoneySaved !== null}
          <tr class="border-b border-gray-400">
            <td class="p-2 font-semibold">Total money saved:</td>
            <td class="min-w-40 p-2">€{sumTotalMoneySaved.toFixed(2)}</td>
          </tr>
        {/if}
        {#if runtime.runtime !== null}
          <tr>
            <td class="p-2 font-semibold">Runtime:</td>
            <td class="min-w-40 p-2">{runtime.runtime} seconds</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
