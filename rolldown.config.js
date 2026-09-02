import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig([
  // Type definitions
  {
    input: "src/index.ts",
    plugins: [
      dts({
        generator: "oxc",
      }),
    ],
    output: [
      {
        dir: "dist",
        format: "esm",
        sourcemap: true,
      },
    ],
  },

  // Node builds
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        minify: true,
        exports: "named",
      },
      {
        file: "dist/index.mjs",
        format: "es",
        sourcemap: true,
        minify: true,
      },
    ],
    platform: "node",
  },
]);
