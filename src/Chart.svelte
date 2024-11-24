<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  import Chart from "chart.js/auto";
  import zoomPlugin from "chartjs-plugin-zoom";

  import { getEfficiencyResults } from "./state.svelte";

  const efficiencyResults = getEfficiencyResults();

  let chartContainers: HTMLCanvasElement[] = $state([]);
  let charts: Chart[] = $state([]);

  const initializeCharts = () => {
    chartContainers.forEach((container, index) => {
      const ctx = container.getContext("2d");
      if (!ctx) {
        console.error(`Failed to get 2D context for chart at index ${index}`);
        return;
      }
      charts[index] = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: getChartLabel(index),
              data: [],
              backgroundColor: getChartFillColor(index),
              borderColor: getChartColor(index),
              fill: true,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: "#",
              },
              title: {
                display: true,
                text: getYAxisChartLabel(index),
              },
            },
            x: {
              ticks: {
                color: "#2a2a3d",
              },
            },
          },
          plugins: {
            legend: {
              onClick: () => {}, // Disable legend click
              onHover: () => {}, // Disable legend hover
              labels: {
                color: "#2a2a3d",
              },
            },
            zoom: {
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },
                mode: "x",
              },
              pan: {
                enabled: true,
                mode: "x",
              },
            },
          },
        },
      });
    });
  };

  /**
   * Update chart data based on efficiency result data.
   * @param {EfficiencyResult[]} data - The efficiency result data.
   */
  export const updateCharts = (data: EfficiencyResult[]) => {
    charts.forEach((chart, index) => {
      const latestData = data;

      // Update chart labels and datasets
      chart.data.labels = latestData.map((_, i) => `Day ${i + 1}`);
      const key = solarDataKeys[index] as keyof EfficiencyResult;
      chart.data.datasets[0].data = latestData.map((item) => item[key] as number);
      chart.update();
    });
  };

  // Keys corresponding to efficiency data properties
  const solarDataKeys: (keyof EfficiencyResult)[] = [
    "solarEnergyIndividual",
    "solarEnergyTotal",
    "internalBoughtEnergyPrice",
    "totalAmountSaved",
  ];

  /**
   * Get the y axis label for the chart based on the chart index.
   * @param {number} index - The index of the chart.
   * @returns {string} - The chart label.
   */
  const getYAxisChartLabel = (index: number): string => {
    const labels: string[] = [
      "Fraction of solar energy used by houses themselves",
      "Fraction of solar energy used by all houses",
      "Price of internal energy (local currency)",
      "Money saved by community (local currency)",
    ];
    return labels[index] || "";
  };

  /**
   * Get the label for the chart based on the chart index.
   * @param {number} index - The index of the chart.
   * @returns {string} - The chart label.
   */
  const getChartLabel = (index: number): string => {
    const labels: string[] = [
      "% Solar Energy (Individual)",
      "% Solar Energy (Total)",
      "Internal Bought Energy Price",
      "Total Amount Saved",
    ];
    return labels[index] || "";
  };

  /**
   * Get the fill color for the chart based on the chart index.
   * @param {number} index - The index of the chart.
   * @returns {string} - The fill color.
   */
  const getChartFillColor = (index: number): string =>
    getColor(index, [
      "rgba(255, 0, 0, 0.2)",
      "rgba(255, 255, 0, 0.2)",
      "rgba(0, 0, 255, 0.2)",
      "rgba(0, 128, 0, 0.2)",
    ]);

  /**
   * Get the border color for the chart based on the chart index.
   * @param {number} index - The index of the chart.
   * @returns {string} - The border color.
   */
  const getChartColor = (index: number): string =>
    getColor(index, ["#f23f44", "#cbba07", "#1565c0", "#15803d"]);

  /**
   * Get color from an array or provide a default if not present.
   * @param {number} index - The index to access in the array.
   * @param {string[]} array - The array of colors.
   * @returns {string} - The color at the specified index.
   */
  const getColor = (index: number, array: string[]): string => array[index];

  onMount(() => {
    initializeCharts();
    updateCharts(efficiencyResults.efficiencyResults);
    Chart.register(zoomPlugin);
  });

  onDestroy(() => {
    charts.forEach((chart) => chart?.destroy());
  });

  $effect(() => {
    if (efficiencyResults.efficiencyResults.length) {
      updateCharts(efficiencyResults.efficiencyResults);
    }
  });
</script>

<div class="grid grid-cols-2 gap-4 rounded-lg border-4 border-gray-400 bg-white p-4">
  {#each Array(4) as _, index (index)}
    <div>
      <canvas bind:this={chartContainers[index]}></canvas>
    </div>
  {/each}
</div>
