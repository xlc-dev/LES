<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { slide } from "svelte/transition";

  import SchedulableLoadGrid from "./SchedulableLoadGrid.svelte";
  import SortIcon from "./SortIcon.svelte";
  import Sidebar from "./Sidebar.svelte";

  import { DatePicker } from "date-picker-svelte";

  import { getStartDate, getEndDate, getHousehold, getStepperData } from "./state.svelte";

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

  let selectedFilters: Household = $state({
    id: 0,
    name: "",
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
  let showDropdown: string | null = $state(null);
  let filteredData: Household[] = $state([]);
  let showDatePicker: boolean = $state(false);
  let selectedDate: Date = $state(new Date());
  let showLegend: boolean = $state(false);
  let formattedDate: string = $derived(new Date(selectedDate).toLocaleDateString("en-US"));
  let setMinDate: Date = $derived(new Date(startDate.startDate * 1000));
  let setMaxDate: Date = $derived(new Date(endDate.endDate * 1000));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const toggleDropdown = (event: Event, filterName: string) => {
    event.stopPropagation();
    showDropdown = showDropdown === filterName ? null : filterName;
  };

  const toggleDatePicker = () => {
    showDatePicker = !showDatePicker;
  };

  const handleClickOutsideFilter = (filterName: string) => {
    return (event: any) => {
      if (!event.target.closest(`#${filterName}-dropdown`)) {
        showDropdown = null;
      }
    };
  };

  const handleClickOutsideDatePicker = (event: any) => {
    if (!event.target.closest(".date-picker-container")) {
      showDatePicker = false;
    }
  };

  const toReadableName = (camelCase: string) => {
    return camelCase.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };

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

  onMount(() => {
    window.addEventListener("click", handleClickOutsideDatePicker);
    document.addEventListener("click", (event: any) => {
      for (const filterName in filters) {
        const filterDropdown = document.getElementById(`${filterName}-dropdown`);
        if (filterDropdown && !filterDropdown.contains(event.target)) {
          showDropdown = null;
        }
      }
    });
    if (setMinDate) {
      selectedDate = setMinDate;
    }
  });

  onDestroy(() => {
    window.removeEventListener("click", handleClickOutsideDatePicker);
  });

  $effect(() => {
    filteredData = stepperData.stepperData!.steps[0].twinWorld!.households.filter(
      (item: Household) => {
        const matchesSearch =
          !searchQuery ||
          item.id.toString().includes(searchQuery) ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSize =
          selectedFilters.size.length === 0 || selectedFilters.size.includes(item.size);
        const matchesEnergyUsage =
          selectedFilters.energyUsage.length === 0 ||
          selectedFilters.energyUsage.some(
            (range) => item.energyUsage >= range.min && item.energyUsage < range.max
          );
        const matchesSolarPanels =
          selectedFilters.solarPanels.length === 0 ||
          selectedFilters.solarPanels.includes(item.solarPanels);
        const matchesSolarYieldYearly =
          selectedFilters.solarYieldYearly.length === 0 ||
          selectedFilters.solarYieldYearly.some(
            (range) => item.solarYieldYearly >= range.min && item.solarYieldYearly < range.max
          );
        const matchesAppliances =
          selectedFilters.appliances?.length === 0 ||
          item.appliances?.some((appliance) =>
            selectedFilters.appliances?.includes(appliance.name)
          );

        return (
          matchesSearch &&
          matchesSize &&
          matchesEnergyUsage &&
          matchesSolarPanels &&
          matchesSolarYieldYearly &&
          matchesAppliances
        );
      }
    );
  });
</script>

<div class="flex flex-col md:flex-row h-screen">
  <Sidebar />
  <div class="flex-1 overflow-auto p-4 text-les-highlight md:ml-64">
    <div class="mb-4 flex items-center justify-between rounded-lg bg-gray-100 p-2">
      <div class="flex space-x-4">
        <input
          type="text"
          class="rounded-md border border-gray-300 px-3 py-2 text-les-highlight"
          placeholder="Search by ID or NAME"
          bind:value={searchQuery} />

        {#each Object.entries(filters) as [filterName, options]}
          <div
            class="relative"
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && toggleDropdown(e, filterName)}
            id={`${filterName}-dropdown`}
            onclick={handleClickOutsideFilter(filterName)}>
            <button
              class="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-les-highlight"
              onclick={(e) => toggleDropdown(e, filterName)}
              onkeydown={(e) => e.key === "Enter" && toggleDropdown(e, filterName)}>
              {toReadableName(filterName)}
            </button>

            {#if showDropdown === filterName}
              <div
                class="absolute left-0 z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                in:slide={{ duration: 500 }}
                out:slide={{ duration: 500 }}>
                <div class="py-1">
                  {#each options as option}
                    <label
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        class="mr-2"
                        bind:group={selectedFilters[filterName]}
                        value={option} />
                      {typeof option === "object" ? `${option.min}-${option.max}` : option}
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
        <button
          class="ml-2 rounded bg-les-gray-500 px-4 py-2 text-white hover:brightness-110"
          onclick={() => (showLegend = !showLegend)}>Legend</button>
        <div class="date-picker-container relative">
          <button
            type="button"
            class="rounded bg-les-blue px-4 py-2 text-white transition-colors duration-200 hover:brightness-110"
            onclick={toggleDatePicker}
            aria-haspopup="dialog"
            aria-expanded={showDatePicker}
            aria-controls="date-picker-dialog">
            Select Date
          </button>

          {#if showDatePicker}
            <div
              id="date-picker-dialog"
              class="calendar absolute z-10 mt-2 rounded shadow-lg"
              role="dialog"
              aria-modal="true">
              <DatePicker
                bind:value={selectedDate}
                min={setMinDate}
                max={setMaxDate}
                on:close={toggleDatePicker} />
            </div>
          {/if}
        </div>
      </div>

      {#if showLegend}
        <div class="fixed inset-0 flex items-center justify-center">
          <button
            onclick={() => (showLegend = !showLegend)}
            class="w-100 legend relative z-10 rounded border border-gray-300 bg-white p-4 shadow-lg">
            <div class="absolute right-2 top-2 p-2 text-xl text-gray-600 hover:text-gray-800">
              <svg
                class="h-4 w-4 fill-current text-black transition-colors duration-200 hover:text-les-highlight"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24">
                <path
                  d="M12 10.586l4.95-4.95a1 1 0 111.414 1.414L13.414 12l4.95 4.95a1 1 0 11-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 11-1.414-1.414L10.586 12 5.636 7.05a1 1 0 111.414-1.414L12 10.586z" />
              </svg>
            </div>
            <div class="mb-2 flex items-center">
              <div class="mr-2 h-4 w-4 bg-gray-700"></div>
              <p>contain the time slots that are unavailable to plan appliances in.</p>
            </div>
            <div class="mb-2 flex items-center">
              <div class="mr-2 h-4 w-4 bg-les-blue"></div>
              <p>contain the time slots that are available to plan appliances in.</p>
            </div>
            <div class="mb-2 flex items-center">
              <div class="mr-2 h-4 w-4 bg-green-700"></div>
              <p>indicate that the planned energy used is drawn from solar panels.</p>
            </div>
            <div class="flex items-center">
              <div class="mr-2 h-4 w-4 bg-les-red"></div>
              <p>indicate that the planned energy used is drawn from the national grid.</p>
            </div>
          </button>
        </div>
      {/if}
    </div>

    <table class="min-w-full overflow-hidden rounded-lg leading-normal">
      <thead>
        <tr>
          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
            ID
            <SortIcon
              isSortedAsc={sortColumn === "id" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "id" && sortOrder === "desc"}
              onSort={() => sortData("id")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
            Name
            <SortIcon
              isSortedAsc={sortColumn === "name" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "name" && sortOrder === "desc"}
              onSort={() => sortData("name")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
            Size
            <SortIcon
              isSortedAsc={sortColumn === "size" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "size" && sortOrder === "desc"}
              onSort={() => sortData("size")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
            Energy Usage
            <SortIcon
              isSortedAsc={sortColumn === "energy_usage" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "energy_usage" && sortOrder === "desc"}
              onSort={() => sortData("energy_usage")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
            Solar Panels
            <SortIcon
              isSortedAsc={sortColumn === "solar_panels" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "solar_panels" && sortOrder === "desc"}
              onSort={() => sortData("solar_panels")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
            Solar Yield Yearly
            <SortIcon
              isSortedAsc={sortColumn === "solar_yield_yearly" && sortOrder === "asc"}
              isSortedDesc={sortColumn === "solar_yield_yearly" && sortOrder === "desc"}
              onSort={() => sortData("solar_yield_yearly")} />
          </th>

          <th
            class="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
            Appliances
          </th>
        </tr>
      </thead>

      <tbody>
        {#each filteredData as data}
          <tr
            class="cursor-pointer bg-white text-sm hover:!bg-gray-100"
            onclick={() => toggleRow(data.id)}>
            <td class="px-5 py-5">
              <button
                class="flex cursor-pointer items-center gap-4 text-gray-800 transition-colors duration-200 hover:!text-les-blue"
                onclick={() => household.setHousehold(data)}>
                {data.id}
              </button>
            </td>

            <td class="px-5 py-5">
              <button
                class="flex cursor-pointer items-center gap-4 text-gray-800 transition-colors duration-200 hover:!text-les-blue"
                onclick={() => household.setHousehold(data)}>
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
                    <!-- <SchedulableLoadGrid -->
                    <!--   appliances={data.appliances} -->
                    <!--   date={formattedDate} -->
                    <!--   dateNoFormat={selectedDate} -->
                    <!--   {hours} /> -->
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
