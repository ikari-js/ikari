import { Server, TLSServeOptions } from "bun";
import { Config, Route } from ".";

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
  const schema = (config.serveOptions as TLSServeOptions).tls?.key
    ? "https"
    : "http";
  const hostMsg = `${schema}://${bunServe.hostname}:${bunServe.port}`;
  const handlersMsg = `Handlers: ${routes.length}`;
  const pidMsg = `PID: ${process.pid}`;
  const successMsg = `ikari server started successfully`;

  const maxLength = Math.max(
    hostMsg.length,
    handlersMsg.length,
    pidMsg.length,
    successMsg.length
  );

  const separatorCount = 4;
  const targetLength = maxLength + separatorCount;

  const msg = `
  ┌${"─".repeat(maxLength + separatorCount)}┐
  │${greenColor}${successMsg
    .padStart(
      Math.floor((targetLength - successMsg.length) / 2) + successMsg.length
    )
    .padEnd(targetLength)}${resetColor}│
  │${" ".repeat(maxLength + separatorCount)}│   
  │${cyanColor}${hostMsg
    .padStart(Math.floor((targetLength - hostMsg.length) / 2) + hostMsg.length)
    .padEnd(targetLength)}${resetColor}│
  │${handlersMsg
    .padStart(
      Math.floor((targetLength - handlersMsg.length) / 2) + handlersMsg.length
    )
    .padEnd(targetLength)}│
  │${pidMsg
    .padStart(Math.floor((targetLength - pidMsg.length) / 2) + pidMsg.length)
    .padEnd(targetLength)}│
  └${"─".repeat(maxLength + separatorCount)}┘
`;

  return msg;
}
