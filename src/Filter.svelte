<script lang="ts">
  import { slide } from "svelte/transition";
  import { DatePicker } from "date-picker-svelte";

  type FilterOption = string | number | { min: number; max: number };

  interface Props {
    filters: Record<string, FilterOption[]>;
    selectedFilters: Record<string, any>;
    searchQuery: string;
    selectedDate?: Date;
    setMinDate?: Date;
    setMaxDate?: Date;
  }

  let {
    filters = {},
    selectedFilters = $bindable(),
    searchQuery = $bindable(),
    selectedDate = $bindable(),
    setMinDate = new Date(),
    setMaxDate = new Date(),
  }: Props = $props();

  let showDropdown: string | null = $state(null);
  let showDatePicker: boolean = $state(false);

  function handleClickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest(".dropdown-container")) {
      showDropdown = null;
    }
    if (!(event.target as HTMLElement).closest(".date-picker-container")) {
      showDatePicker = false;
    }
  }

  const toggleDropdown = (filterName: string) => {
    showDropdown = showDropdown === filterName ? null : filterName;
  };

  const toReadableName = (camelCase: string) =>
    camelCase.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
</script>

<svelte:window onclick={handleClickOutside} />

<div
  class="flex flex-col gap-4 rounded-lg border-4 border-gray-300 bg-white p-4 lg:flex-row lg:items-center"
  class:lg:gap-4={!selectedDate || !setMinDate || !setMaxDate}
  class:lg:justify-between={selectedDate && setMinDate && setMaxDate}>
  <!-- Search Input -->
  <input
    type="text"
    class="w-full rounded-lg border border-gray-300 px-4 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none sm:w-auto lg:max-w-[300px] lg:flex-grow xl:max-w-[250px]"
    placeholder="Search by ID or NAME"
    bind:value={searchQuery} />

  <!-- Filter Dropdowns -->
  <div class="flex flex-wrap gap-4 lg:flex-nowrap lg:items-center lg:gap-2">
    {#each Object.entries(filters) as [filterName, options]}
      <div class="dropdown-container relative">
        <button
          class="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors duration-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:outline-none lg:w-auto"
          onclick={() => toggleDropdown(filterName)}>
          {toReadableName(filterName)}
        </button>

        {#if showDropdown === filterName}
          <div
            class="absolute left-0 z-10 mt-2 w-56 rounded-lg border bg-white ring-1 shadow-lg ring-black transition-all"
            in:slide={{ duration: 200 }}
            out:slide={{ duration: 200 }}>
            <div class="max-h-60 overflow-y-auto p-2">
              {#each options as option}
                <label
                  class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    class="rounded border-gray-300 focus:ring-blue-500"
                    bind:group={selectedFilters[filterName]}
                    value={typeof option === "object" ? JSON.stringify(option) : option} />
                  {typeof option === "object" ? `${option.min} - ${option.max}` : option}
                </label>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Date Picker -->
  {#if selectedDate && setMinDate && setMaxDate}
    <div class="date-picker-container relative">
      <button
        class="w-full cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white shadow transition-colors duration-300 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 lg:w-auto"
        onclick={() => (showDatePicker = !showDatePicker)}>
        Select Date
      </button>

      {#if showDatePicker}
        <div class="calendar absolute z-20 mt-2 w-72 lg:left-[15%] lg:translate-x-[-50%]">
          <DatePicker
            bind:value={selectedDate}
            min={setMinDate}
            max={setMaxDate}
            on:close={() => (showDatePicker = false)} />
        </div>
      {/if}
    </div>
  {/if}
</div>
