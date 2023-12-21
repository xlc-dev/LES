<script lang="ts">
  import type { HouseholdRead } from "../lib/client";

  export let household: HouseholdRead;
</script>

<h1 class="font-bold text-4xl pb-4 flex items-center gap-4">
  <img src="/house.svg" alt="" class="h-24" />{household.name} Data
</h1>

<div class="flex flex-col gap-12 justify-between">
  <table class="min-w-full leading-normal rounded-lg overflow-hidden">
    <thead>
      <tr>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Name</th>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Size</th>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Energy Usage</th>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Solar Panels</th>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Solar Yield Yearly</th>
      </tr>
    </thead>
    <tbody>
      <tr class="bg-white text-sm">
        <td class="px-5 py-5 border-b border-gray-200">{household.name}</td>
        <td class="px-5 py-5 border-b border-gray-200">{household.size}</td>
        <td class="px-5 py-5 border-b border-gray-200">{household.energy_usage}</td>
        <td class="px-5 py-5 border-b border-gray-200">{household.solar_panels}</td>
        <td class="px-5 py-5 border-b border-gray-200">{household.solar_yield_yearly}</td>
      </tr>
    </tbody>
  </table>
  <table class="min-w-full leading-normal rounded-lg overflow-hidden">
    <thead>
      <tr>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Name</th>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Power</th>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Duration</th>
        <th
          class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs text-gray-600 uppercase tracking-wider"
          >Daily Usage</th>
      </tr>
    </thead>
    <tbody>
      {#each household.appliances as appliance}
        <tr class="bg-white text-sm">
          <td class="px-5 py-5 border-b border-gray-200">{appliance.name}</td>
          <td class="px-5 py-5 border-b border-gray-200">{appliance.power}</td>
          <td class="px-5 py-5 border-b border-gray-200">{appliance.duration}</td>
          <td class="px-5 py-5 border-b border-gray-200">{appliance.daily_usage}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<hr class="my-8 border-black" />
<div>
  <h2 class="font-bold text-4xl">SL View</h2>
</div>
