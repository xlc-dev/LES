<script lang="ts">
  import { DatePicker } from "date-picker-svelte";

  import SchedulableLoadGrid from "./SchedulableLoadGrid.svelte";

  import { getEndDate, getStartDate, getHousehold } from "./state.svelte";
  import { onDestroy } from "svelte";

  const household = getHousehold().household!;
  const setHousehold = getHousehold();
  const endDate = getEndDate();
  const startDate = getStartDate();

  const setMinDate = new Date(startDate.startDate * 1000);
  const setMaxDate: Date = new Date(endDate.endDate * 1000);

  let showDatePicker: boolean = $state(false);
  let selectedDate: Date = $state(setMinDate);
  let formattedDate: string = $derived(new Date(selectedDate).toLocaleDateString("en-US"));

  let weekDates: Date[] = $derived.by(() => {
    let curweekDates = [selectedDate];

    let daysLeft = Math.min(
      6,
      Math.round((setMaxDate.getTime() - selectedDate.getTime()) / (24 * 60 * 60 * 1000))
    );

    for (let i = 1; i <= daysLeft; i++) {
      let nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + i);
      curweekDates.push(nextDay);
    }

    return curweekDates;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  function handleClickOutsideDatePicker(event: any) {
    if (!event.target.closest(".date-picker-container")) {
      showDatePicker = false;
    }
  }

  onDestroy(() => {
    setHousehold.setHousehold(null);
  });
</script>

<svelte:window onclick={handleClickOutsideDatePicker} />

<div class="text-les-highlight flex flex-col gap-12">
  <div
    class="mx-auto w-full max-w-7xl space-y-8 rounded-xl border-4 border-gray-300 bg-white p-8 shadow-lg">
    <div>
      <h1 class="mb-6 text-4xl font-extrabold text-gray-800">Household Information</h1>
      <div
        class="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm transition-shadow duration-300">
        <div class="grid grid-cols-2 gap-6">
          <div class="font-semibold text-gray-600">Name:</div>
          <div class="text-gray-800">{household.name}</div>
          <div class="font-semibold text-gray-600">Size:</div>
          <div class="text-gray-800">{household.size}</div>
          <div class="font-semibold text-gray-600">Energy Usage:</div>
          <div class="text-gray-800">{household.energyUsage}</div>
          <div class="font-semibold text-gray-600">Solar Panels:</div>
          <div class="text-gray-800">{household.solarPanels}</div>
          {#if household.solarYieldYearly > 0}
            <div class="font-semibold text-gray-600">Solar Panel Type:</div>
            <div class="text-gray-800">{household.solarPanelType}</div>
          {/if}
          <div class="font-semibold text-gray-600">Solar Yield Yearly:</div>
          <div class="text-gray-800">{household.solarYieldYearly}</div>
        </div>
      </div>
    </div>

    {#if household.appliances}
      <div>
        <h2 class="mb-6 text-2xl font-bold text-gray-800">Appliances</h2>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {#each household.appliances as appliance}
            <div
              class="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm transition-shadow duration-300">
              <div class="text-lg font-semibold text-gray-700">{appliance.name}</div>
              <div class="mt-3 space-y-2 text-gray-600">
                <div><span class="font-semibold">Power:</span> {appliance.power}</div>
                <div><span class="font-semibold">Duration:</span> {appliance.duration}</div>
                <div><span class="font-semibold">Daily Usage:</span> {appliance.dailyUsage}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div>
      <div class="flex justify-between">
        <h2 class="mb-6 text-3xl font-extrabold text-gray-800">Schedulable Load</h2>
        <div class="relative mb-6">
          <button
            class="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-white transition-transform duration-300 hover:bg-blue-500"
            onclick={(e) => (e.stopPropagation(), (showDatePicker = !showDatePicker))}>
            Select Date
          </button>
          {#if showDatePicker}
            <div
              class="date-picker-container calendar absolute z-10 mt-2 rounded-lg bg-white shadow-lg">
              <DatePicker bind:value={selectedDate} min={setMinDate} max={setMaxDate} />
            </div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {#key selectedDate}
          {#each weekDates as date}
            <div
              class="flex w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div class="mb-3 text-center text-lg font-semibold text-gray-700">
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </div>
              <table>
                <tbody>
                  <tr>
                    <td class="flex items-center justify-center p-4" colspan={7}>
                      <SchedulableLoadGrid
                        appliances={household.appliances}
                        date={date.toLocaleDateString("en-US")}
                        dateNoFormat={date}
                        {hours} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          {/each}
        {/key}
      </div>
    </div>
  </div>
</div>
