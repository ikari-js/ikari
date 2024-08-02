import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";

try {
  execSync("rm -rf dist");
  execSync("tsc -p tsconfig.build.json");
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error);
}

const files = readdirSync("./dist", { recursive: true })
  .filter((file) => typeof file === "string")
  .filter((file) => file.endsWith(".js"))
  .map((file) => `./dist/${file}`);

const output = await Bun.build({
  entrypoints: files,
  target: "bun",
  outdir: "./dist",
  root: "./dist",
  minify: true,
});

if (!output.success) throw new Error(output.logs.join("\n"));
