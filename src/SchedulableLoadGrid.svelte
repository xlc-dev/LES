<script lang="ts">
  const { appliances, hours, date, dateNoFormat } = $props();

  import { getStartDate } from "./state.svelte";

  const startDate = getStartDate();

  const unixTimestamp = Math.floor(dateNoFormat.getTime() / 1000);

  const getCellColor = (
    bitmap: number,
    hour: number,
    selectedDate: string,
    appliance: Appliance
  ) => {
    const bitmapString = bitmap.toString(2).padStart(24, "0");

    const baseDate = new Date(startDate.startDate * 1000);
    const dateObj = new Date(selectedDate);
    dateObj.setHours(0, 0, 0, 0);

    // Calculate the day number based on the selected date and start date
    const dayNumber = Math.round(
      (dateObj.getTime() - (baseDate.getTime() - 1 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)
    );

    const dayData = appliance.timeDaily.filter((entry) => entry.day === dayNumber + 1);

    // Fallback if user hasn't selected a date that has no timeDailies
    if (dayData.length === 0) {
      return "bg-gray-700";
    }

    const planEnergyBit = (dayData[0].bitmapPlanEnergy >> (23 - hour)) & 1;
    const planNoEnergyBit = (dayData[0].bitmapPlanNoEnergy >> (23 - hour)) & 1;

    if (planEnergyBit === 1) {
      if (bitmapString[hour] !== "1") {
        return "bg-yellow-700";
      }
      return "bg-green-700"; // Green for energy from solar panels
    } else if (planNoEnergyBit === 1) {
      if (bitmapString[hour] !== "1") {
        return "bg-red-950";
      }
      return "bg-red-700"; // Red for energy from the national grid
    }

    // Default to gray for unavailable time slots
    return bitmapString[hour] === "1" ? "bg-blue-700" : "bg-gray-700";
  };
</script>

<div class="flex flex-col items-center">
  <div class="flex w-full justify-start">
    <div class="text-les-highlight w-36 pr-2 text-right text-xs font-bold">Appliances:</div>
    <div class="flex">
      {#each hours as hour}
        <div class="text-les-highlight h-2 w-2 text-center text-xs sm:h-3 sm:w-3 md:h-4 md:w-4">
          {hour}
        </div>
      {/each}
    </div>
  </div>
  {#each appliances as appliance}
    <div class="flex items-center">
      <div class="text-les-highlight w-36 pr-2 text-right text-xs whitespace-nowrap">
        {appliance.name}
      </div>
      {#each hours as hour}
        <div
          class={`border border-white ${getCellColor(
            appliance.timeDaily[(Math.round(unixTimestamp / 86400) + 3) % 7].bitmapWindow,
            hour,
            date,
            appliance
          )} h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4`}>
        </div>
      {/each}
    </div>
  {/each}
</div>
