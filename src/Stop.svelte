<script lang="ts">
  import * as XLSX from "xlsx";
  import Chart from "./Chart.svelte";

  import { s2ab } from "./utils";

  import {
    getRuntime,
    getEfficiencyResults,
    getStepperData,
    getTimeDailies,
  } from "./state.svelte";

  interface Props {
    newSession: () => void;
  }

  const { newSession }: Props = $props();

  const runtime = getRuntime();
  runtime.stopRuntime();
  const efficiencyResults = getEfficiencyResults();
  const stepperData = getStepperData();
  const timeDailies = getTimeDailies();

  interface GraphData {
    graph1: string[];
    graph2: string[];
    graph3: string[];
    graph4: string[];
  }

  interface GraphPoint {
    X: string;
    Y: string;
  }

  interface DashboardDataItem {
    label: string;
    value: string | number;
  }

  function getGraphData(): GraphData {
    const graphData: GraphData = {
      graph1: [],
      graph2: [],
      graph3: [],
      graph4: [],
    };

    const results = efficiencyResults.efficiencyResults;

    results.forEach((result, index) => {
      const dayNumber = index + 1;
      graphData.graph1.push(
        `internalBoughtEnergyPrice x: Day ${dayNumber}, y: ${result.internalBoughtEnergyPrice}`
      );
      graphData.graph2.push(
        `solarEnergyIndividual x: Day ${dayNumber}, y: ${result.solarEnergyIndividual}`
      );
      graphData.graph3.push(`solarEnergyTotal x: Day ${dayNumber}, y: ${result.solarEnergyTotal}`);
      graphData.graph4.push(`totalAmountSaved x: Day ${dayNumber}, y: ${result.totalAmountSaved}`);
    });

    return graphData;
  }

  function processGraphDataAndAddToWorkbook(graphData: GraphData, workbook: XLSX.WorkBook): void {
    Object.keys(graphData).forEach((graphKey) => {
      const graphPoints: GraphPoint[] = graphData[graphKey as keyof GraphData].map(
        (point: string) => {
          const [xPart, yPart] = point.split(",");
          return {
            X: xPart.split(":")[1].trim(),
            Y: yPart.split(":")[1].trim(),
          };
        }
      );

      const worksheet = XLSX.utils.json_to_sheet(graphPoints);
      XLSX.utils.book_append_sheet(workbook, worksheet, graphKey);
    });
  }

  function getDashboardData(): DashboardDataItem[] {
    const results = efficiencyResults.efficiencyResults;

    const sumEfficiencyIndividual = results.reduce(
      (acc, result) => acc + result.solarEnergyIndividual,
      0
    );
    const sumEfficiencyTotal = results.reduce((acc, result) => acc + result.solarEnergyTotal, 0);
    const sumTotalMoneySaved = results.reduce((acc, result) => acc + result.totalAmountSaved, 0);
    const sumEfficiencyNoSolar = sumEfficiencyTotal - sumEfficiencyIndividual;

    return [
      {
        label: "Number of Households",
        value: stepperData.stepperData.twinworld.households.length,
      },
      {
        label: "Cost Model Price Network Buy Consumer",
        value: stepperData.stepperData.costmodel.priceNetworkBuyConsumer,
      },
      {
        label: "Cost Model Price Network Sell Consumer",
        value: stepperData.stepperData.costmodel.priceNetworkSellConsumer,
      },
      {
        label: "Twin World Energy Usage Factor",
        value: stepperData.stepperData.energyflow.energyUsageFactor,
      },
      {
        label: "Twin World Solar Panels Factor",
        value: stepperData.stepperData.energyflow.solarPanelsFactor,
      },
      {
        label: "Algorithm Max Temperature",
        value: stepperData.stepperData.algo.maxTemperature,
      },
      {
        label: "Total Saved by Own Solar Panels",
        value: `${sumEfficiencyIndividual.toFixed(2)} kWh`,
      },
      {
        label: "Total Saved by Other Households' Solar Panels",
        value: `${sumEfficiencyNoSolar.toFixed(2)} kWh`,
      },
      {
        label: "Total Saved by the Community",
        value: `${sumEfficiencyTotal.toFixed(2)} kWh`,
      },
      {
        label: "Total Money Saved",
        value: `€${sumTotalMoneySaved.toFixed(2)}`,
      },
      {
        label: "Runtime",
        value: `${runtime.runtime ? runtime.runtime.toFixed(2) : "0.00"} seconds`,
      },
      {
        label: "Selected Twin World",
        value: stepperData.stepperData.twinworld.name,
      },
      {
        label: "Selected Cost Model",
        value: stepperData.stepperData.costmodel.name,
      },
      {
        label: "Selected Algorithm",
        value: stepperData.stepperData.algo.name,
      },
      {
        label: "Selected Energyflow",
        value: stepperData.stepperData.energyflowlabel,
      },
    ];
  }

  function downloadExcel(): void {
    const graphData = getGraphData();
    const dashboardData = getDashboardData();
    const workbook = XLSX.utils.book_new();
    const timeDailiesData = timeDailies.timeDailies;
    const timeDailiesSheet = XLSX.utils.json_to_sheet(timeDailiesData);
    XLSX.utils.book_append_sheet(workbook, timeDailiesSheet, "Time Dailies");
    processGraphDataAndAddToWorkbook(graphData, workbook);
    const dashboardSheet = XLSX.utils.json_to_sheet(dashboardData);
    XLSX.utils.book_append_sheet(workbook, dashboardSheet, "Dashboard Data");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "session-data.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="mx-auto w-full max-w-4xl px-3 pt-8">
  <h1 class="pb-4 text-center text-4xl font-bold">Statistics for your session</h1>
  <Chart />
  <div
    class="text-les-highlight relative mt-8 mb-8 grid grid-cols-2 gap-4 rounded-lg border-4 border-gray-400 bg-white p-4 shadow-sm">
    <p class="absolute left-1/2 mt-4 -translate-x-1/2 transform">
      Runtime: {runtime.runtime} seconds
    </p>
    <div class="col-span-2 mt-8 flex justify-between">
      <button
        class="cursor-pointer rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors duration-300 hover:bg-blue-600"
        onclick={newSession}>New session</button>
      <button
        class="cursor-pointer rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors duration-300 hover:bg-blue-600"
        onclick={downloadExcel}>Download</button>
    </div>
  </div>
</div>
