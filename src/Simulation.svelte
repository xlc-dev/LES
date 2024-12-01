<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import HouseholdView from "./HouseholdView.svelte";
  import HouseSVG from "./HouseSVG.svelte";
  import Filter from "./Filter.svelte";

  import { getHousehold, getStepperData } from "./state.svelte";

  const stepperData = getStepperData();
  const household = getHousehold();

  let searchQuery: string = $state("");

  const filters = {
    size: Array.from({ length: 10 }, (_, i) => i + 1),
    solarPanels: ["Yes", "No"],
  };

  let selectedFilters: Record<string, (string | number)[]> = $state({
    size: [],
    solarPanels: [],
  });

  let filteredHouseholds: Household[] = $state([]);

  const hasSolarPanels = (household: Household) => household.solarPanels > 0;

  $effect(() => {
    filteredHouseholds = stepperData.stepperData!.steps[0].twinWorld!.households.filter(
      (h: Household) => {
        const matchesSearch =
          !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSize =
          selectedFilters.size.length === 0 || selectedFilters.size.includes(h.size);

        const matchesSolarPanels =
          selectedFilters.solarPanels.length === 0 ||
          (selectedFilters.solarPanels.includes("Yes") && hasSolarPanels(h)) ||
          (selectedFilters.solarPanels.includes("No") && !hasSolarPanels(h));

        return matchesSearch && matchesSize && matchesSolarPanels;
      }
    );
  });
</script>

<div class="flex flex-col md:flex-row h-screen">
  <Sidebar />
  <div class="flex-1 overflow-auto p-4 text-les-highlight md:ml-64">
    <div class="flex flex-col gap-8">
      {#if household.household}
        <HouseholdView household={household.household} />
      {:else}
        <Filter {filters} bind:selectedFilters bind:searchQuery />
        <div
          class="grid grid-cols-8 items-center justify-between gap-4 rounded-lg border-4 border-gray-400 p-2 bg-white">
          {#each filteredHouseholds as data}
            <HouseSVG {household} {data} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
