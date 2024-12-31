<script lang="ts">
  import HouseSVG from "./HouseSVG.svelte";
  import Filter from "./Filter.svelte";

  import { getStepperData } from "./state.svelte";

  const stepperData = getStepperData();

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
    filteredHouseholds = stepperData.stepperData.twinworld.households.filter((h: Household) => {
      const matchesSearch =
        !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSize =
        selectedFilters.size.length === 0 || selectedFilters.size.includes(h.size);

      const matchesSolarPanels =
        selectedFilters.solarPanels.length === 0 ||
        (selectedFilters.solarPanels.includes("Yes") && hasSolarPanels(h)) ||
        (selectedFilters.solarPanels.includes("No") && !hasSolarPanels(h));

      return matchesSearch && matchesSize && matchesSolarPanels;
    });
  });
</script>

<div class="flex flex-col gap-8">
  <Filter {filters} bind:selectedFilters bind:searchQuery />
  <div
    class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-center gap-4 rounded-lg border-4 border-gray-400 bg-white p-2">
    {#each filteredHouseholds as data}
      <HouseSVG {data} />
    {/each}
  </div>
</div>
