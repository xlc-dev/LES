<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "./Chart.svelte";
  import Sidebar from "./Sidebar.svelte";

  import { getEfficiencyResults, getRuntime, getStepperData } from "./state.svelte";

  const efficiencyResults = getEfficiencyResults();
  const runtime = getRuntime();
  const stepperData = getStepperData();

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

  onMount(() => {
    runtime.startRuntime();
  });
</script>

<div class="flex gap-8">
  <Sidebar />
  <div class="flex-1 p-8 text-les-highlight">
    <Chart />
    <div class="mb-8 mt-8 rounded-lg border-4 border-gray-400 bg-white p-4 px-20 shadow">
      <table class="w-full">
        <tbody>
          <tr class="border-b border-gray-400">
            <td class="p-2">Number of Households:</td>
            <td class="min-w-40 p-2"
              >{stepperData.stepperData?.steps[0].twinWorld?.households.length}
            </td>
          </tr>
          {#if sumEfficiencyIndividual !== null}
            <tr class="border-b border-gray-400">
              <td class="p-2">Total saved by own solar panels:</td>
              <td class="min-w-40 p-2">{sumEfficiencyIndividual.toFixed(2)} kWh</td>
            </tr>
          {/if}
          {#if sumEfficiencyNoSolar !== null}
            <tr class="border-b border-gray-400">
              <td class="p-2">Total saved by other households' solar panels:</td>
              <td class="min-w-40 p-2">{sumEfficiencyNoSolar.toFixed(2)} kWh</td>
            </tr>
          {/if}
          {#if sumEfficiencyTotal !== null}
            <tr class="border-b border-gray-400">
              <td class="p-2">Total saved by the community:</td>
              <td class="min-w-40 p-2">{sumEfficiencyTotal.toFixed(2)} kWh</td>
            </tr>
          {/if}
          {#if sumTotalMoneySaved !== null}
            <tr class="border-b border-gray-400">
              <td class="p-2">Total money saved:</td>
              <td class="min-w-40 p-2">€{sumTotalMoneySaved.toFixed(2)}</td>
            </tr>
          {/if}
          {#if runtime.runtime !== null}
            <tr>
              <td class="p-2">Runtime:</td>
              <td class="min-w-40 p-2">{runtime.runtime} seconds</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
