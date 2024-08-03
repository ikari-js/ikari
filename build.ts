import { $ } from "bun";
import { readdirSync } from "node:fs";

try {
  await $`rm -rf ./dist`;
  await $`tsc -p tsconfig.build.json`;
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error);
}

const files = readdirSync("./src", { recursive: true })
  .filter((file) => typeof file === "string")
  .filter((file) => (file as string).endsWith(".ts"))
  .map((file) => `./src/${file}`)
  .filter(
    (file) => !file.includes("inject.ts") && !file.includes("service.ts")
  );

const output = await Bun.build({
  entrypoints: files,
  target: "bun",
  outdir: "./dist",
  root: "./src",
  minify: true,
});

if (!output.success) throw new Error(output.logs.join("\n"));
