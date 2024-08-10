/* eslint-disable no-console */
import { $ } from "bun";
import { build, type Options } from "tsup";

try {
  await $`rm -rf dist`;
 
  const tsupConfig: Options = {
    entry: ["src/**/*.ts"],
    splitting: false,
    sourcemap: false,
    bundle: true,
  } satisfies Options;

  await Promise.all([
    build({
      outDir: "dist/esm",
      format: "esm",
      target: "node20",
      cjsInterop: false,
      ...tsupConfig,
    }),
    build({
      outDir: "dist/cjs",
      format: "cjs",
      target: "node20",
      ...tsupConfig,
    }),
  ]);

  await $`tsc -p tsconfig.build.json`;

} catch (e) {
  console.error(e);
}
