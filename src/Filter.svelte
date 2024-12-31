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
  class="text-les-highlight flex items-center justify-between overflow-y-scroll rounded-lg border-4 border-gray-400 bg-white p-2">
  <div class="flex flex-nowrap space-x-4">
    <!-- Search Input -->
    <input
      type="text"
      class="min-w-[150px] flex-shrink-0 rounded-md border border-gray-300 px-3 py-2 whitespace-nowrap sm:min-w-[200px] md:min-w-[250px]"
      placeholder="Search by ID or NAME"
      bind:value={searchQuery} />

    <!-- Filter Dropdowns -->
    {#each Object.entries(filters) as [filterName, options]}
      <div class="dropdown-container flex-shrink-0">
        <button
          class="focus:ring-les-highlight focus:ring-opacity-50 active:bg-les-highlight cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 whitespace-nowrap shadow-xs transition-colors duration-300 focus:ring-2 focus:outline-none"
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
            class="ring-opacity-5 absolute z-20 mt-2 w-56 rounded-md bg-white ring-1 shadow-lg ring-black"
            in:slide={{ duration: 200 }}
            out:slide={{ duration: 200 }}>
            <div class="custom-scrollbar max-h-60 overflow-y-auto py-1">
              {#each options as option}
                <label
                  class="flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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

    {#if selectedDate && setMinDate && setMaxDate}
      <div class="date-picker-container flex-shrink-0">
        <button
          type="button"
          class="focus:ring-opacity-50 cursor-pointer rounded-sm bg-blue-500 px-4 py-2 whitespace-nowrap text-white transition-colors duration-300 hover:bg-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none active:bg-blue-600"
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
