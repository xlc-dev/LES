<script lang="ts">
  import { getHousehold, getComponent } from "./state.svelte";

  interface Props {
    data: Household;
  }

  const { data }: Props = $props();

  const household = getHousehold();
  const currentComponent = getComponent();

  const hasSolarPanels = (household: Household) => household.solarPanels > 0;
</script>

<button
  class="inline-block cursor-pointer border-0 bg-transparent p-0"
  onclick={() => {
    household.setHousehold(data);
    currentComponent.setComponent("Household");
  }}>
  <svg
    class="block fill-black transition-transform duration-300 hover:scale-110"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="90px"
    height="90px"
    viewBox="0 0 345.804 345.804"
    xml:space="preserve">
    <g>
      <text
        x="50%"
        y="60%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-size="35"
        class="text-black">{data.size}</text>
      <text
        x="50%"
        y="80%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-size="35"
        class="text-3xl text-black">{data.name}</text>

      {#if hasSolarPanels(data)}
        <svg
          id="Layer_1"
          data-name="Layer 1"
          width="90px"
          height="90px"
          x="37%"
          y="25%"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 122.88 122.88"
          ><defs
            ><style>
              .cls-1 {
                fill: #fde047;
              }
            </style></defs
          ><title>sun-color</title><path
            class="cls-1"
            d="M30,13.21A3.93,3.93,0,1,1,36.8,9.27L41.86,18A3.94,3.94,0,1,1,35.05,22L30,13.21Zm31.45,13A35.23,35.23,0,1,1,36.52,36.52,35.13,35.13,0,0,1,61.44,26.2ZM58.31,4A3.95,3.95,0,1,1,66.2,4V14.06a3.95,3.95,0,1,1-7.89,0V4ZM87.49,10.1A3.93,3.93,0,1,1,94.3,14l-5.06,8.76a3.93,3.93,0,1,1-6.81-3.92l5.06-8.75ZM109.67,30a3.93,3.93,0,1,1,3.94,6.81l-8.75,5.06a3.94,3.94,0,1,1-4-6.81L109.67,30Zm9.26,28.32a3.95,3.95,0,1,1,0,7.89H108.82a3.95,3.95,0,1,1,0-7.89Zm-6.15,29.18a3.93,3.93,0,1,1-3.91,6.81l-8.76-5.06A3.93,3.93,0,1,1,104,82.43l8.75,5.06ZM92.89,109.67a3.93,3.93,0,1,1-6.81,3.94L81,104.86a3.94,3.94,0,0,1,6.81-4l5.06,8.76Zm-28.32,9.26a3.95,3.95,0,1,1-7.89,0V108.82a3.95,3.95,0,1,1,7.89,0v10.11Zm-29.18-6.15a3.93,3.93,0,0,1-6.81-3.91l5.06-8.76A3.93,3.93,0,1,1,40.45,104l-5.06,8.75ZM13.21,92.89a3.93,3.93,0,1,1-3.94-6.81L18,81A3.94,3.94,0,1,1,22,87.83l-8.76,5.06ZM4,64.57a3.95,3.95,0,1,1,0-7.89H14.06a3.95,3.95,0,1,1,0,7.89ZM10.1,35.39A3.93,3.93,0,1,1,14,28.58l8.76,5.06a3.93,3.93,0,1,1-3.92,6.81L10.1,35.39Z" /></svg>
      {/if}

      <path
        d="M343.288,159.838L181.905,27.941c-5.242-4.283-12.77-4.283-18.009,0l-41.336,33.79V44.193c0-3.788-3.066-6.848-6.854-6.848
    H75.928c-3.788,0-6.854,3.063-6.854,6.848v61.251L2.516,159.838c-2.933,2.391-3.36,6.711-0.97,9.641
    c1.357,1.654,3.33,2.523,5.32,2.523c1.524,0,3.053-0.511,4.328-1.545l34.55-28.245v172.011c0,3.785,3.066,6.852,6.846,6.852
    h240.626c3.781,0,6.854-3.066,6.854-6.852V142.216l34.55,28.245c1.273,1.037,2.807,1.545,4.326,1.545
    c1.984,0,3.956-0.87,5.314-2.524C346.648,166.549,346.221,162.235,343.288,159.838z M82.779,51.041h26.071v21.888l-26.071,21.31
    V51.041z M286.367,307.369H59.44V131.015l107.596-87.939c3.414-2.791,8.316-2.791,11.731,0l107.6,87.939V307.369z" />
    </g>
  </svg>
</button>
