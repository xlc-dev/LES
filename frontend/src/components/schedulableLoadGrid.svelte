<script lang="ts">
    export let appliances;
    export let hours;

    const numberOfColumns = 7;

    function getCellColor(bitmap, hour) {
      const bitmapString = bitmap.toString(2).padStart(24, '0');
      return bitmapString[hour] === '1' ? 'bg-blue-600' : 'bg-gray-700';
    }
</script>

<div class="flex flex-col items-center">
    <div class="flex w-full justify-start">
        <div class="w-36 text-right pr-2 font-bold">Appliances:</div>
        <div class="flex">
            {#each hours as hour}
                <div class="w-6 h-6 text-center">{hour}</div>
            {/each}
        </div>
    </div>
    {#each appliances as appliance}
        <div class="flex items-center">
            <div class="w-36 text-right pr-2 whitespace-nowrap">{appliance.name}</div>
            {#each hours as hour}
                <div class={`w-6 h-6 border border-white ${getCellColor(appliance.appliance_windows[0].bitmap_window, hour)}`}></div>
            {/each}
        </div>
    {/each}
</div>
