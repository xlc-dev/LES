<script lang="ts">
  import SchedulableLoadGrid from "./SchedulableLoadGrid.svelte";
  import SortIcon from "./SortIcon.svelte";
  import Filter from "./Filter.svelte";

  import { slide } from "svelte/transition";

  import {
    getStartDate,
    getEndDate,
    getHousehold,
    getStepperData,
    getComponent,
  } from "./state.svelte";

  const currentComponent = getComponent();
  const startDate = getStartDate();
  const endDate = getEndDate();
  const household = getHousehold();
  const stepperData = getStepperData();

  let filters = {
    size: Array.from({ length: 10 }, (_, i) => i + 1),
    energyUsage: Array.from({ length: 10 }, (_, i) => ({ min: i * 1000, max: (i + 1) * 1000 })),
    solarPanels: Array.from({ length: 21 }, (_, i) => i),
    solarYieldYearly: Array.from({ length: 10 }, (_, i) => ({
      min: i * 1000,
      max: (i + 1) * 1000,
    })),
    appliances: ["Dishwasher", "Washing Machine", "Tumble Dryer", "Stove", "Electric Vehicle"],
  };

  interface Range {
    min: number;
    max: number;
  }

  let selectedFilters: Record<string, string[]> = $state({
    size: [],
    energyUsage: [],
    solarPanels: [],
    solarYieldYearly: [],
    appliances: [],
  });

  let expandedRow: number | null = $state(null);
  let sortColumn: string | null = $state(null);
  let sortOrder: string = $state("asc");
  let searchQuery: string = $state("");
  let filteredData: Household[] = $state([]);
  let selectedDate: Date = $state(new Date());
  let formattedDate: string = $derived(new Date(selectedDate).toLocaleDateString("en-US"));
  let setMinDate: Date = $derived(new Date(startDate.startDate * 1000));
  let setMaxDate: Date = $derived(new Date(endDate.endDate * 1000));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const toggleRow = (id: number) => {
    expandedRow = expandedRow === id ? null : id;
  };

  const sortData = (column: string) => {
    if (sortColumn === column) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortOrder = "desc";
    }
    sortColumn = column;
    filteredData = filteredData.slice().sort((a: any, b: any) => {
      if (a[column] < b[column]) return sortOrder === "asc" ? -1 : 1;
      if (a[column] > b[column]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  $effect(() => {
    const parsedSelectedFilters = Object.fromEntries(
      Object.entries(selectedFilters).map(([key, values]) => [
        key,
        values.map((value: string) => {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }),
      ])
    );

    filteredData = stepperData.stepperData.twinworld.households.filter((item: Household) => {
      const matchesSearch =
        !searchQuery ||
        item.id.toString().includes(searchQuery) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSize =
        parsedSelectedFilters.size.length === 0 || parsedSelectedFilters.size.includes(item.size);

      const matchesEnergyUsage =
        parsedSelectedFilters.energyUsage.length === 0 ||
        parsedSelectedFilters.energyUsage.some(
          (range: Range) => item.energyUsage >= range.min && item.energyUsage < range.max
        );

      const matchesSolarPanels =
        parsedSelectedFilters.solarPanels.length === 0 ||
        parsedSelectedFilters.solarPanels.includes(item.solarPanels);

      const matchesSolarYieldYearly =
        parsedSelectedFilters.solarYieldYearly.length === 0 ||
        parsedSelectedFilters.solarYieldYearly.some(
          (range: Range) => item.solarYieldYearly >= range.min && item.solarYieldYearly < range.max
        );

      const matchesAppliances =
        parsedSelectedFilters.appliances.length === 0 ||
        (item.appliances &&
          item.appliances.some((appliance) =>
            parsedSelectedFilters.appliances.includes(appliance.name)
          ));

      return (
        matchesSearch &&
        matchesSize &&
        matchesEnergyUsage &&
        matchesSolarPanels &&
        matchesSolarYieldYearly &&
        matchesAppliances
      );
    });
  });
</script>

<div class="flex flex-col gap-8">
  <Filter
    {filters}
    bind:selectedFilters
    bind:searchQuery
    bind:selectedDate
    {setMinDate}
    {setMaxDate} />

  <div class="overflow-hidden rounded-lg border-4 border-gray-400">
    <table class="min-w-full leading-normal">
      <thead>
        <tr>
          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs tracking-wider text-gray-600 uppercase">
            ID
            <SortIcon
              isSortedAsc={sortColumn === "id" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "id" && sortOrder === "desc"}
              onSort={() => sortData("id")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs tracking-wider text-gray-600 uppercase">
            Name
            <SortIcon
              isSortedAsc={sortColumn === "name" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "name" && sortOrder === "desc"}
              onSort={() => sortData("name")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs tracking-wider text-gray-600 uppercase">
            Size
            <SortIcon
              isSortedAsc={sortColumn === "size" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "size" && sortOrder === "desc"}
              onSort={() => sortData("size")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs tracking-wider text-gray-600 uppercase">
            Energy Usage
            <SortIcon
              isSortedAsc={sortColumn === "energyUsage" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "energyUsage" && sortOrder === "desc"}
              onSort={() => sortData("energyUsage")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs tracking-wider text-gray-600 uppercase">
            Solar Panels
            <SortIcon
              isSortedAsc={sortColumn === "solarPanels" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "solarPanels" && sortOrder === "desc"}
              onSort={() => sortData("solarPanels")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs tracking-wider text-gray-600 uppercase">
            Solar Yield Yearly
            <SortIcon
              isSortedAsc={sortColumn === "solarYieldYearly" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "solarYieldYearly" && sortOrder === "desc"}
              onSort={() => sortData("solarYieldYearly")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs tracking-wider text-gray-600 uppercase">
            Appliances
          </th>
        </tr>
      </thead>

      <tbody>
        {#each filteredData as data}
          <tr
            class="cursor-pointer bg-white text-sm hover:bg-gray-100!"
            onclick={() => toggleRow(data.id)}>
            <td class="px-5 py-5">
              <button
                class="flex cursor-pointer items-center gap-4 text-gray-800 hover:font-bold"
                onclick={() => {
                  household.setHousehold(data);
                  currentComponent.setComponent("Household");
                }}>
                {data.id}
              </button>
            </td>

            <td class="px-5 py-5">
              <button
                class="flex cursor-pointer items-center gap-4 text-gray-800 hover:font-bold"
                onclick={() => {
                  household.setHousehold(data);
                  currentComponent.setComponent("Household");
                }}>
                {data.name}
              </button>
            </td>

            <td class="px-5 py-5 text-gray-800">
              {data.size}
            </td>

            <td class="px-5 py-5 text-gray-800">
              {data.energyUsage}
            </td>

            <td class="px-5 py-5 text-gray-800">
              {data.solarPanels}
            </td>

            <td class="px-5 py-5 text-gray-800">
              {data.solarYieldYearly}
            </td>

            <td class="px-5 py-5 text-gray-800">
              {#each data.appliances! as appliance}
                {appliance.name}
                <br />
              {/each}
            </td>
          </tr>
          {#if expandedRow === data.id}
            <tr class="border-b border-gray-200 bg-white text-sm hover:bg-white">
              <td colspan={7}>
                <div transition:slide class="flex justify-center p-4">
                  {#key formattedDate}
                    <SchedulableLoadGrid
                      appliances={data.appliances}
                      date={formattedDate}
                      dateNoFormat={selectedDate}
                      {hours} />
                  {/key}
                </div>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>
