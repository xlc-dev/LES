<script lang="ts">
    import {get} from "svelte/store";
    import { blur } from "svelte/transition";

  import Sidebar from "./sidebar.svelte";
  import TitleBar from "./titleBar.svelte";
  import Result from "./result.svelte";
  import SchedulableLoadTable from "./schedulableLoadTable.svelte";
  import Simulation from "./simulation.svelte";
  import StockMarket from "./stockMarket.svelte";
  import Dashboard from "./dashboard.svelte";
  import HomeView from "./homeView.svelte";
  import type {HouseholdRead} from "../lib/client";
  import {activatedHousehold} from "../lib/stores";

  let selectedComponent = null;
  let title = "Schedulable Loads";
  let stop = false;

  let unsubscribe;

  const handleButtonClick = (action: string) => {
    if (unsubscribe) {
      unsubscribe()
    }
    $activatedHousehold = null;
    switch (action) {
      case "Dashboard":
        selectedComponent = Dashboard;
        title = "Dashboard";
        break;
      case "Simulation":
        selectedComponent = Simulation;
        title = "Simulation";
        break;
      case "Schedulable Loads":
        selectedComponent = SchedulableLoadTable;
        title = "Schedulable Loads";
        break;
      case "Stock Market":
        selectedComponent = StockMarket;
        title = "Stock Market";
        break;
      case "Stop":
        stop = true;
        break;
    }
  }
  $: if (
      $activatedHousehold != null
  ) {
      unsubscribe = activatedHousehold.subscribe((e) => {
          title = e.name;
      })
  }

</script>

{#if !stop}
  <Sidebar on:click={(e) => handleButtonClick(e.detail.action)} currentComponent={title} />
  <TitleBar {title} />
  <main class="flex-1 bg-les-frame dark:bg-les-bg-dark ml-64 p-4 min-h-screen" in:blur>
    {#if $activatedHousehold !== null}
      <HomeView household = {$activatedHousehold} />
    {:else if selectedComponent !== null}
      <div in:blur>
        {#key selectedComponent}
          <div in:blur>
            <svelte:component this={selectedComponent} />
          </div>
        {/key}
      </div>
    {:else}
      <SchedulableLoadTable/>
    {/if}
  </main>
{:else}
  <Result />
{/if}
