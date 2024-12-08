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

  function handleClickOutside(event: any) {
    if (!event.target.closest(".dropdown-container")) {
      showDropdown = null;
    }
    if (!event.target.closest(".date-picker-container")) {
      showDatePicker = false;
    }
  }

  const toggleDropdown = (filterName: string) => {
    showDropdown = showDropdown === filterName ? null : filterName;
  };

  const toReadableName = (camelCase: string) => {
    return camelCase.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };
</script>

<svelte:window onclick={handleClickOutside} />

<div
  class="flex items-center justify-between rounded-lg bg-white p-2 text-les-highlight border-4 border-gray-400 overflow-y-scroll">
  <div class="flex space-x-4 flex-nowrap">
    <!-- Search Input -->
    <input
      type="text"
      class="rounded-md border border-gray-300 px-3 py-2 flex-shrink-0 min-w-[150px] sm:min-w-[200px] md:min-w-[250px] whitespace-nowrap"
      placeholder="Search by ID or NAME"
      bind:value={searchQuery} />

    <!-- Filter Dropdowns -->
    {#each Object.entries(filters) as [filterName, options]}
      <div class="dropdown-container flex-shrink-0">
        <button
          class="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-les-highlight focus:ring-opacity-50 active:bg-les-highlight whitespace-nowrap cursor-pointer transition-colors duration-200"
          aria-haspopup="true"
          aria-expanded={showDropdown === filterName ? "true" : "false"}
          aria-controls={`${filterName}-dropdown-list`}
          onclick={(e) => {
            e.stopPropagation();
            toggleDropdown(filterName);
          }}>
          {toReadableName(filterName)}
        </button>

        {#if showDropdown === filterName}
          <div
            id={`${filterName}-dropdown-list`}
            class="absolute z-20 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
            in:slide={{ duration: 200 }}
            out:slide={{ duration: 200 }}>
            <div class="py-1 max-h-60 overflow-y-auto custom-scrollbar">
              {#each options as option}
                <label
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    class="mr-2"
                    bind:group={selectedFilters[filterName]}
                    value={typeof option === "object" ? JSON.stringify(option) : option} />
                  {#if typeof option === "object"}
                    {option.min !== undefined && option.max !== undefined
                      ? `${option.min} - ${option.max}`
                      : JSON.stringify(option)}
                  {:else}
                    {option}
                  {/if}
                </label>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <!-- Date Picker (Optional) -->
    {#if selectedDate && setMinDate && setMaxDate}
      <div class="date-picker-container flex-shrink-0">
        <button
          type="button"
          class="rounded-sm bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 active:bg-blue-600 whitespace-nowrap cursor-pointer"
          onclick={() => (showDatePicker = !showDatePicker)}>
          Select Date
        </button>

        {#if showDatePicker}
          <div id="date-picker-dialog" class="calendar absolute z-20 mt-2 rounded-sm shadow-lg">
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
</div>
