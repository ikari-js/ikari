/* eslint-disable no-console */
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";

execSync("tsc -p tsconfig.build.json");

const files = readdirSync("./dist")
  .filter((file) => file.endsWith(".js"))
  .map((file) => `./dist/${file}`);

let output = await Bun.build({
  entrypoints: files,
  target: "bun",
  outdir: "./dist",
  minify: true,
});

if (!output.success) throw new Error(output.logs.join("\n"));

const decoratorsFiles = readdirSync("./dist/decorators")
  .filter((file) => file.endsWith(".js"))
  .map((file) => `./dist/decorators/${file}`);

output = await Bun.build({
  entrypoints: decoratorsFiles,
  target: "bun",
  outdir: "./dist/decorators",
  minify: true,
});

if (!output.success) throw new Error(output.logs.join("\n"));

const middlewares = readdirSync("./dist/middlewares");

for (const middleware of middlewares) {
  const files = readdirSync(`./dist/middlewares/${middleware}`)
    .filter((file) => file.endsWith(".js"))
    .map((file) => `./dist/middlewares/${middleware}/${file}`);

  const output = await Bun.build({
    entrypoints: files,
    target: "bun",
    outdir: `./dist/middlewares/${middleware}`,
    minify: true,
  });

  if (!output.success) throw new Error(output.logs.join("\n"));
}
