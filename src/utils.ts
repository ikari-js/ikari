import { Server, TLSServeOptions } from "bun";
import { Config, Route } from ".";
import fs from "fs";

export function createPath(str: string) {
  if (str[0] !== "/") {
    return "/" + str;
  }
  return str;
}

export const representationHeaders = [
  "Content-Type",
  "Content-Encoding",
  "Content-Language",
  "Content-Location",
];

export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  PATCH = "patch",
  OPTIONS = "options",
  HEAD = "head",
  ALL = "all",
}

export const resetColor = "\x1b[0m";
export const greenColor = "\x1b[32m";
export const blueColor = "\x1b[34m";
export const cyanColor = "\x1b[36m";

export function startupMessage(config: Config, bunServe: Server, routes: Route[]) {
  const { version } = JSON.parse(fs.readFileSync(import.meta.dir + "/../package.json", "utf-8"))

  const schema = (config.serveOptions as TLSServeOptions).tls?.key
    ? "https"
    : "http";
  const hostMsg = `${schema}://${bunServe.hostname}:${bunServe.port}`;
  const handlersMsg = `Handlers ...... ${routes.length}`;
  const pidMsg = `PID ...... ${process.pid}`;
  const handlerMsgAndPidMsg = `${handlersMsg}  ${pidMsg}`;
  const successMsg = `ikari v${version}`;

  const maxLength = Math.max(
    hostMsg.length,
    handlerMsgAndPidMsg.length,
    successMsg.length
  );

  const separatorCount = 16;
  const targetLength = maxLength + separatorCount;

  const msg = `
  ┌${"─".repeat(maxLength + separatorCount)}┐
  │${greenColor}${successMsg
    .padStart(
      Math.floor((targetLength - successMsg.length) / 2) + successMsg.length
    )
    .padEnd(targetLength)}${resetColor}│
  │${cyanColor}${hostMsg
    .padStart(Math.floor((targetLength - hostMsg.length) / 2) + hostMsg.length)
    .padEnd(targetLength)}${resetColor}│
  │${" ".repeat(maxLength + separatorCount)}│   
  │${handlerMsgAndPidMsg.padStart(Math.floor((targetLength - handlerMsgAndPidMsg.length) / 2) + handlerMsgAndPidMsg.length).padEnd(targetLength)}│
  └${"─".repeat(maxLength + separatorCount)}┘
`;

  return msg;
}
