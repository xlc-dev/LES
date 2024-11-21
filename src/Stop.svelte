<script lang="ts">
  import * as XLSX from "xlsx";
  import Chart from "./Chart.svelte";

  import {
    getRuntime,
    getEfficiencyResults,
    getStepperData,
    getTimeDailies,
  } from "./state.svelte";

  const runtime = getRuntime();
  runtime.stopRuntime();
  const efficiencyResults = getEfficiencyResults();
  const stepperData = getStepperData();
  const timeDailies = getTimeDailies();

  function s2ab(s: string): ArrayBuffer {
    const buffer = new ArrayBuffer(s.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff;
    }
    return buffer;
  }

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
        `internalBoughtEnergyPrice x: Day ${dayNumber}, y: ${result.internalBoughtEnergyPrice}`,
      );
      graphData.graph2.push(
        `solarEnergyIndividual x: Day ${dayNumber}, y: ${result.solarEnergyIndividual}`,
      );
      graphData.graph3.push(
        `solarEnergyTotal x: Day ${dayNumber}, y: ${result.solarEnergyTotal}`,
      );
      graphData.graph4.push(
        `totalAmountSaved x: Day ${dayNumber}, y: ${result.totalAmountSaved}`,
      );
    });

    return graphData;
  }

  function processGraphDataAndAddToWorkbook(
    graphData: GraphData,
    workbook: XLSX.WorkBook,
  ): void {
    Object.keys(graphData).forEach((graphKey) => {
      const graphPoints: GraphPoint[] = graphData[
        graphKey as keyof GraphData
      ].map((point: string) => {
        const [xPart, yPart] = point.split(",");
        return {
          X: xPart.split(":")[1].trim(),
          Y: yPart.split(":")[1].trim(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(graphPoints);
      XLSX.utils.book_append_sheet(workbook, worksheet, graphKey);
    });
  }

  function getDashboardData(): DashboardDataItem[] {
    const results = efficiencyResults.efficiencyResults;

    const sumEfficiencyIndividual = results.reduce(
      (acc, result) => acc + result.solarEnergyIndividual,
      0,
    );
    const sumEfficiencyTotal = results.reduce(
      (acc, result) => acc + result.solarEnergyTotal,
      0,
    );
    const sumTotalMoneySaved = results.reduce(
      (acc, result) => acc + result.totalAmountSaved,
      0,
    );
    const sumEfficiencyNoSolar = sumEfficiencyTotal - sumEfficiencyIndividual;

    const stepper = stepperData.stepperData;

    return [
      {
        label: "Number of Households",
        value: stepper?.households.length ?? 0,
      },
      {
        label: "Cost Model Price Network Buy Consumer",
        value: stepper?.costmodel.price_network_buy_consumer ?? 0,
      },
      {
        label: "Cost Model Price Network Sell Consumer",
        value: stepper?.costmodel.price_network_sell_consumer ?? 0,
      },
      {
        label: "Twin World Energy Usage Factor",
        value: stepper?.energyflow.energy_usage_factor ?? 0,
      },
      {
        label: "Twin World Solar Panels Factor",
        value: stepper?.energyflow.solar_panels_factor ?? 0,
      },
      {
        label: "Algorithm Max Temperature",
        value: stepper?.algorithm.max_temperature ?? 0,
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
        value: stepper?.twinworld.name ?? "N/A",
      },
      {
        label: "Selected Cost Model",
        value: stepper?.costmodel.name ?? "N/A",
      },
      {
        label: "Selected Algorithm",
        value: stepper?.algorithm.name ?? "N/A",
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

  function newSessionButton(): void {}
</script>

<div class="mx-auto max-w-3xl pt-8">
  <h1 class="text-center text-4xl font-bold pb-4">
    Statistics for your session
  </h1>
  <Chart />
  <div
    class="relative mb-8 mt-8 grid grid-cols-2 gap-4 rounded-lg bg-white p-4 shadow border-4 border-gray-400 text-les-highlight"
  >
    <p class="absolute left-1/2 mt-4 -translate-x-1/2 transform">
      Runtime: {runtime.runtime} seconds
    </p>
    <div class="col-span-2 mt-8 flex justify-between">
      <button
        class="rounded-lg bg-blue-500 px-6 py-3 transition-colors duration-200 hover:bg-blue-600 text-white"
        onclick={newSessionButton}>New session</button
      >
      <button
        class="rounded-lg bg-blue-500 px-6 py-3 transition-colors duration-200 hover:bg-blue-600 text-white"
        onclick={downloadExcel}>Download</button
      >
    </div>
  </div>
</div>
