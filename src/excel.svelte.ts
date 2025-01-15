import * as XLSX from "xlsx";
import { s2ab } from "./utils";
import { getRuntime, getEfficiencyResults, getStepperData } from "./state.svelte";

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

/**
 * Downloads the results as an Excel file.
 *
 * @param {string?} name - The name of the Excel file.
 */
export function downloadExcel(name?: string): void {
  const runtime = getRuntime();
  runtime.stopRuntime();
  const efficiencyResults = getEfficiencyResults();
  const stepperData = getStepperData();
  const results = efficiencyResults.efficiencyResults;

  const sumEfficiencyIndividual: number = results.reduce(
    (acc, result) => acc + result.solarEnergyIndividual,
    0
  );

  const sumEfficiencyTotal: number = results.reduce(
    (acc, result) => acc + result.solarEnergyTotal,
    0
  );

  const sumTotalMoneySaved: number = results.reduce(
    (acc, result) => acc + result.totalAmountSaved,
    0
  );

  const sumEfficiencyNoSolar: number = sumEfficiencyTotal - sumEfficiencyIndividual;

  function getGraphData(): GraphData {
    const graphData: GraphData = {
      graph1: [],
      graph2: [],
      graph3: [],
      graph4: [],
    };

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

  function getDashboardData(): Array<{ label: string; value: string | number }> {
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
      { label: "Algorithm Max Temperature", value: stepperData.stepperData.algo.maxTemperature },
      {
        label: "Total Saved by Own Solar Panels",
        value: `${sumEfficiencyIndividual.toFixed(2)} kWh`,
      },
      {
        label: "Total Saved by Other Households' Solar Panels",
        value: `${sumEfficiencyNoSolar.toFixed(2)} kWh`,
      },
      { label: "Total Saved by the Community", value: `${sumEfficiencyTotal.toFixed(2)} kWh` },
      { label: "Total Money Saved", value: `€${sumTotalMoneySaved.toFixed(2)}` },
      {
        label: "Runtime",
        value: `${runtime.runtime ? runtime.runtime.toFixed(2) : "0.00"} seconds`,
      },
      { label: "Selected Twin World", value: stepperData.stepperData.twinworld.name },
      { label: "Selected Cost Model", value: stepperData.stepperData.costmodel.name },
      { label: "Selected Algorithm", value: stepperData.stepperData.algo.name },
      { label: "Selected Energyflow", value: stepperData.stepperData.energyflowlabel },
    ];
  }

  function processGraphDataAndAddToWorkbook(graphData: GraphData, workbook: XLSX.WorkBook): void {
    const graphTabNames: Record<keyof GraphData, string> = {
      graph1: "Internal Energy Price",
      graph2: "Individual Solar Energy",
      graph3: "Total Solar Energy",
      graph4: "Total Money Saved",
    };

    Object.keys(graphData).forEach((graphKey) => {
      const key = graphKey as keyof GraphData;
      const graphPoints: GraphPoint[] = graphData[key].map((point: string) => {
        const [xPart, yPart] = point.split(",");
        return {
          X: xPart.split(":")[1].trim(),
          Y: yPart.split(":")[1].trim(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(graphPoints);
      XLSX.utils.book_append_sheet(workbook, worksheet, graphTabNames[key]);
    });
  }

  const graphData = getGraphData();
  const dashboardData = getDashboardData();
  const workbook = XLSX.utils.book_new();
  const timeDailies: any[] = [];

  stepperData.stepperData.twinworld.households.forEach((household: any) => {
    household.appliances?.forEach((appliance: any) => {
      appliance.timeDaily.forEach((timeDaily: any) => {
        timeDailies.push(timeDaily);
      });
    });
  });

  const timeDailiesSheet = XLSX.utils.json_to_sheet(timeDailies);
  XLSX.utils.book_append_sheet(workbook, timeDailiesSheet, "Time Dailies");

  processGraphDataAndAddToWorkbook(graphData, workbook);
  const dashboardSheet = XLSX.utils.json_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(workbook, dashboardSheet, "Dashboard Data");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
  const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name ? name + ".xlsx" : "session-data.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
