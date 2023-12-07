/* eslint-disable no-console */
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
try {
  execSync("tsc -p tsconfig.build.json");

  const files = readdirSync("./dist")
    .filter((file) => file.endsWith(".js"))
    .map((file) => `./dist/${file}`);

  await Bun.build({
    entrypoints: files,
    target: "bun",
    outdir: "./dist",
    minify: true,
  });

  const decoratorsFiles = readdirSync("./dist/decorators")
    .filter((file) => file.endsWith(".js"))
    .map((file) => `./dist/decorators/${file}`);

  await Bun.build({
    entrypoints: decoratorsFiles,
    target: "bun",
    outdir: "./",
    minify: true,
  });

  const middlewaresFiles = readdirSync("./dist/middlewares")
    .filter((file) => file.endsWith(".js"))
    .map((file) => `./dist/middlewares/${file}`);

  await Bun.build({
    entrypoints: middlewaresFiles,
    target: "bun",
    outdir: "./",
    minify: true,
  });
} catch (e) {
  console.error(e);
}
