import { defineConfig } from "@rsbuild/core";
import { pluginSvelte } from "@rsbuild/plugin-svelte";

export default defineConfig({
  plugins: [pluginSvelte()],
  dev: {
    assetPrefix: "/LES/",
  },
  output: {
    assetPrefix: "/LES/",
  },
  html: {
    meta: {
      charset: {
        charset: "UTF-8",
      },
      description:
        "A simulation tool for comparing schedulable load algorithms and twinworlds in a local energy system environment.",
      viewport: "width=device-width, initial-scale=1",
      title: "LES",
    },
  },
});
