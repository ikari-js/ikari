import { Errorlike, Server, TLSServeOptions } from "bun";
import { Config, Context, Controller, Group, Route } from ".";
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
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD",
  ALL = "ALL",
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

export function startupMessage(
  config: Config,
  bunServe: Server,
  routes: Route[]
) {
  const { version } = JSON.parse(
    fs.readFileSync(import.meta.dir + "/../package.json", "utf-8")
  );

  const schema = (config.serveOptions as TLSServeOptions).tls?.key
    ? "https"
    : "http";
  const hostMsg = `${schema}://${bunServe.hostname}:${bunServe.port}`;
  const handlersMsg = `Handlers ...... ${routes.length}`;
  const pidMsg = `PID ...... ${process.pid}`;
  const handlerMsgAndPidMsg = `${handlersMsg}  ${pidMsg}`;
  let successMsg = `ikari v${version}`;
  if (!version) successMsg = `ikari`;

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
  │${handlerMsgAndPidMsg
    .padStart(
      Math.floor((targetLength - handlerMsgAndPidMsg.length) / 2) +
        handlerMsgAndPidMsg.length
    )
    .padEnd(targetLength)}│
  └${"─".repeat(maxLength + separatorCount)}┘
`;

  return msg;
}

export function returnContextResponse(ctx: Context) {
  if (ctx.method === HttpMethod.HEAD || ctx.method === HttpMethod.OPTIONS) {
    return ctx.getResWithoutBody();
  }
  return ctx.res;
}

export function NotFound(ctx: Context) {
  if (ctx.method === HttpMethod.HEAD) {
    return ctx.status(StatusCode.NOT_FOUND).getResWithoutBody();
  }
  return ctx.json({ message: "Not Found" }, StatusCode.NOT_FOUND).res;
}

//TODO: Tests are missing for this function. We have to test it.
export function getRoutesFromGroups(config: Config, groups: Group[]): Route[] {
  return groups.reduce(
    (result: Route[], { prefix, controllers, middlewares }: Group) => {
      if (prefix) {
        prefix = createPath(prefix).replace(/\/+$/, "");
      }

      controllers.forEach((controller: Controller) => {
        if (controller == null) return;
        if (typeof controller !== "function" && typeof controller !== "object")
          return;
        let routes: Route[] = [];
        if (Reflect.hasMetadata("routes", controller)) {
          routes = Reflect.getMetadata("routes", controller);
        } else {
          routes = Reflect.getMetadata("routes", controller.prototype);
        }

        routes.forEach((route) => {
          if (route == null) return;
          if (typeof route !== "function" && typeof route !== "object") return;

          route.target = controller;
          let path = route.path;
          let before = route.before;
          if (prefix) path = prefix + path;
          if (config.prefix) path = config.prefix + path;
          if (middlewares) {
            before = middlewares.concat(before);
          }

          result.push({ ...route, path, before });
        });
      });

      return result;
    },
    []
  );
}

export function getRoutesFromControllers(
  config: Config,
  controllers: Controller[]
): Route[] {
  return controllers.reduce((result: Route[], controller: Controller) => {
    if (controller == null) return result;
    if (typeof controller !== "function" && typeof controller !== "object")
      return result;

    let routes: Route[] = [];
    if (Reflect.hasMetadata("routes", controller)) {
      routes = Reflect.getMetadata("routes", controller);
    } else {
      routes = Reflect.getMetadata("routes", controller.prototype);
    }

    routes.forEach((route) => {
      if (route == null) return;
      if (typeof route !== "function" && typeof route !== "object") return;

      route.target = controller;
      let path = route.path;
      if (config.prefix) {
        path = config.prefix + path;
      }

      result.push({ ...route, path });
    });

    return result;
  }, []);
}

export function defaultErrorHandler(err: Errorlike) {
  return new Response(
    JSON.stringify({
      message: err?.message,
      stack: err?.stack,
      cause: err?.cause,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
