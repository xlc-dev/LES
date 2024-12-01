<script lang="ts">
  import { slide } from "svelte/transition";

  let { filters = {}, selectedFilters = $bindable(), searchQuery = $bindable() } = $props();

  let showDropdown: string | null = $state(null);

  function handleClickOutside(event: any) {
    if (!event.target.closest(".dropdown-container")) {
      showDropdown = null;
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
  class="mb-4 flex items-center justify-between rounded-lg bg-white p-2 text-les-highlight border-4 border-gray-400">
  <div class="flex space-x-4">
    <input
      type="text"
      class="rounded-md border border-gray-300 px-3 py-2"
      placeholder="Search by ID or NAME"
      bind:value={searchQuery} />

    {#each Object.entries(filters) as [filterName, options]}
      <div class="relative dropdown-container">
        <button
          class="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
            class="absolute left-0 z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
            in:slide={{ duration: 500 }}
            out:slide={{ duration: 500 }}>
            <div class="py-1">
              {#each options as option}
                <label class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    class="mr-2"
                    bind:group={selectedFilters[filterName]}
                    value={option} />
                  {option}
                </label>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
