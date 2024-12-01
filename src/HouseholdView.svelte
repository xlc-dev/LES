<script lang="ts">
  import { DatePicker } from "date-picker-svelte";
  import { getEndDate, getStartDate } from "./state.svelte";

  import SchedulableLoadGrid from "./SchedulableLoadGrid.svelte";

  const { household } = $props();

  const endDate = getEndDate();
  const startDate = getStartDate();

  const setMinDate = new Date(startDate.startDate * 1000);
  const setMaxDate: Date = new Date(endDate.endDate * 1000);

  let showDatePicker: boolean = $state(false);
  let selectedDate: Date = $state(new Date(startDate.startDate * 1000));

  let weekDates: Date[] = $state([]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  function handleClickOutsideDatePicker(event: any) {
    if (!event.target.closest(".date-picker-container")) {
      showDatePicker = false;
    }
  }

  $effect(() => {
    if (selectedDate) {
      weekDates = [selectedDate];

      let daysLeft = Math.min(
        6,
        Math.round((setMaxDate.getTime() - selectedDate.getTime()) / (24 * 60 * 60 * 1000))
      );

      for (let i = 1; i <= daysLeft; i++) {
        let nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + i);
        weekDates.push(nextDay);
      }
    }
  });
</script>

<svelte:window onclick={handleClickOutsideDatePicker} />

<div class="flex flex-col gap-12">
  <div class="rounded-lg border-4 border-gray-400 bg-white p-4 shadow w-full max-w-7xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Household Information</h2>
    <div class="grid grid-cols-2 gap-4">
      <div class="font-semibold">Name:</div>
      <div>{household.name}</div>
      <div class="font-semibold">Size:</div>
      <div>{household.size}</div>
      <div class="font-semibold">Energy Usage:</div>
      <div>{household.energy_usage}</div>
      <div class="font-semibold">Solar Panels:</div>
      <div>{household.solar_panels}</div>
      <div class="font-semibold">Solar Yield Yearly:</div>
      <div>{household.solar_yield_yearly}</div>
    </div>
  </div>

  <div class="rounded-lg border-4 border-gray-400 bg-white p-4 shadow w-full max-w-7xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Appliances</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each household.appliances as appliance}
        <div class="border border-gray-300 rounded p-4">
          <div class="font-semibold">{appliance.name}</div>
          <div class="mt-2">
            <div><span class="font-semibold">Power:</span> {appliance.power}</div>
            <div><span class="font-semibold">Duration:</span> {appliance.duration}</div>
            <div><span class="font-semibold">Daily Usage:</span> {appliance.daily_usage}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <h2 class="text-3xl font-bold text-white">Schedulable Load</h2>

  <div class="flex justify-center pt-4">
    <div class="date-picker-container relative">
      <button
        class="rounded bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:brightness-110"
        onclick={(e) => (e.stopPropagation(), (showDatePicker = !showDatePicker))}>
        Select Date
      </button>
      {#if showDatePicker}
        <div class="calendar absolute z-10 mt-2 rounded shadow-lg">
          <DatePicker bind:value={selectedDate} min={setMinDate} max={setMaxDate} />
        </div>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each weekDates as date}
      <div class="rounded-lg border-4 border-gray-400 bg-white p-4 shadow w-full">
        <div class="mt-2 text-center text-gray-500">
          {date.toLocaleDateString("en-US", { weekday: "long" })}
        </div>
        <SchedulableLoadGrid
          appliances={household.appliances}
          date={date.toLocaleDateString("en-US")}
          dateNoFormat={date}
          {hours} />
      </div>
    {/each}
  </div>
</div>
