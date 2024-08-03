/* eslint-disable no-console */
import { $ } from "bun";
try {
  await $`rm -rf dist`;
  await $`tsc -p tsconfig.build.json`;

  // const files = readdirSync("./dist")
  //   .filter((file) => file.endsWith(".js"))
  //   .map((file) => `./dist/${file}`);

  // await Bun.build({
  //   entrypoints: files,
  //   target: "bun",
  //   outdir: "./dist",
  //   minify: true,
  // });

  // const decoratorsFiles = readdirSync("./dist/decorators")
  //   .filter((file) => file.endsWith(".js"))
  //   .map((file) => `./dist/decorators/${file}`);

  // await Bun.build({
  //   entrypoints: decoratorsFiles,
  //   target: "bun",
  //   outdir: "./",
  //   minify: true,
  // });

  // const middlewares = readdirSync("./dist/middlewares");
  // middlewares.forEach((middleware) => {
  //   const files = readdirSync(`./dist/middlewares/${middleware}`)
  //     .filter((file) => file.endsWith(".js"))
  //     .map((file) => `./dist/middlewares/${middleware}/${file}`);

  //   Bun.build({
  //     entrypoints: files,
  //     target: "bun",
  //     outdir: `./dist/middlewares/${middleware}`,
  //     minify: true,
  //   });
  // });
} catch (e) {
  console.error(e);
}
