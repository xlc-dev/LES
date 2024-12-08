<script lang="ts">
  const { appliances, hours, date, dateNoFormat } = $props();

  import { getTimeDailies, getStartDate, getDaysInPlanning } from "./state.svelte";

  const timeDailies = getTimeDailies();
  const startDate = getStartDate();
  const daysInPlanning = getDaysInPlanning();

  const unixTimestamp = Math.floor(dateNoFormat.getTime() / 1000);

  const getCellColor = (
    bitmap: number,
    hour: number,
    selectedDate: string,
    appliance_id: number
  ) => {
    const bitmapString = bitmap.toString(2).padStart(24, "0");

    const baseDate = new Date(startDate.startDate * 1000);
    const dateObj = new Date(selectedDate);
    dateObj.setHours(0, 0, 0, 0);

    // Calculate the day number based on the selected date and start date
    const dayNumber = Math.round(
      (dateObj.getTime() - (baseDate.getTime() - 1 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)
    );

    // Find the corresponding day in timeDailies based on the calculated day number
    // TODO: changed id to day, is this correct?
    const dayData = timeDailies.timeDailies.filter(
      (entry) => entry.day === daysInPlanning.daysInPlanning * (appliance_id - 1) + dayNumber + 1
    );

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
    <div class="w-36 pr-2 text-right text-xs font-bold text-les-highlight">Appliances:</div>
    <div class="flex">
      {#each hours as hour}
        <div class="h-2 w-2 text-center text-xs text-les-highlight sm:h-3 sm:w-3 md:h-4 md:w-4">
          {hour}
        </div>
      {/each}
    </div>
  </div>
  {#each appliances as appliance}
    <div class="flex items-center">
      <div class="w-36 whitespace-nowrap pr-2 text-right text-xs text-les-highlight">
        {appliance.name}
      </div>
      {#each hours as hour}
        <div
          class={`border border-white ${getCellColor(
            appliance.appliance_windows[(Math.round(unixTimestamp / 86400) + 3) % 7].bitmap_window,
            hour,
            date,
            appliance.id
          )} h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4`}>
        </div>
      {/each}
    </div>
  {/each}
</div>

<!-- TODO: add Legend somewhere -->

<!-- <div class="mb-2 flex items-center"> -->
<!--   <div class="mr-2 h-4 w-4 bg-gray-700"></div> -->
<!--   <p>contain the time slots that are unavailable to plan appliances in.</p> -->
<!-- </div> -->
<!-- <div class="mb-2 flex items-center"> -->
<!--   <div class="mr-2 h-4 w-4 bg-les-blue"></div> -->
<!--   <p>contain the time slots that are available to plan appliances in.</p> -->
<!-- </div> -->
<!-- <div class="mb-2 flex items-center"> -->
<!--   <div class="mr-2 h-4 w-4 bg-green-700"></div> -->
<!--   <p>indicate that the planned energy used is drawn from solar panels.</p> -->
<!-- </div> -->
<!-- <div class="flex items-center"> -->
<!--   <div class="mr-2 h-4 w-4 bg-les-red"></div> -->
<!--   <p>indicate that the planned energy used is drawn from the national grid.</p> -->
<!-- </div> -->
