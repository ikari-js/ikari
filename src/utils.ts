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

export enum StatusCode {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    SEE_OTHER = 303,
    NOT_MODIFIED = 304,
    TEMPORARY_REDIRECT = 307,
    PERMANENT_REDIRECT = 308,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    PAYMENT_REQUIRED = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    REQUEST_TIMEOUT = 408,
    CONFLICT = 409,
    GONE = 410,
    LENGTH_REQUIRED = 411,
    PAYLOAD_TOO_LARGE = 413,
    URI_TOO_LONG = 414,
    UNSUPPORTED_MEDIA_TYPE = 415,
    EXPECTATION_FAILED = 417,
    IM_A_TEAPOT = 418,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
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
  let successMsg = `ikari v${version}`;
  if(!version) 
    successMsg = `ikari`;

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
