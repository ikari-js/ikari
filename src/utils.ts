import { ErrorLike, Server } from "bun";
import { Config, Context, Controller, Group, Route } from ".";
import Container from "typedi";

const VERSION = "0.9.7";

export function createPath(str: string) {
  if (str[0] !== "/") {
    return "/" + str;
  }
  return str;
}

export enum HTTPMethod {
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

export enum HTTPHeaders {
  ContentType = "Content-Type",
  ContentLength = "Content-Length",
  ContentEncoding = "Content-Encoding",
  Accept = "Accept",
  AcceptEncoding = "Accept-Encoding",
  Authorization = "Authorization",
  UserAgent = "User-Agent",
  Connection = "Connection",
  Host = "Host",
  Origin = "Origin",
  Allow = "Allow",
  Vary = "Vary",
  AccessControlAllowOrigin = "Access-Control-Allow-Origin",
  AccessControlAllowMethods = "Access-Control-Allow-Methods",
  AccessControlAllowHeaders = "Access-Control-Allow-Headers",
  AccessControlExposeHeaders = "Access-Control-Expose-Headers",
  AccessControlAllowCredentials = "Access-Control-Allow-Credentials",
  AccessControlMaxAge = "Access-Control-Max-Age",
  AccessControlRequestHeaders = "Access-Control-Request-Headers",
  AccessControlRequestMethod = "Access-Control-Request-Method",
}

export const resetColor = "\x1b[0m";
export const greenColor = "\x1b[32m";
export const blueColor = "\x1b[34m";
export const cyanColor = "\x1b[36m";
export const yellowColor = "\x1b[33m";
export const redColor = "\x1b[31m";
export const magentaColor = "\x1b[35m";

export function startupMessage(
  config: Config,
  bunServe: Server,
  routes: Route[]
) {

  const hostMsg = `${bunServe.url.toString()}`;
  const handlersMsg = `Handlers ...... ${routes.length}`;
  const pidMsg = `PID ...... ${process.pid}`;
  const handlerMsgAndPidMsg = `${handlersMsg}  ${pidMsg}`;
  const successMsg = `ikari v${VERSION}`;

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
  if (ctx.method === HTTPMethod.HEAD || ctx.method === HTTPMethod.OPTIONS) {
    return ctx.getResWithoutBody();
  }
  return ctx.res;
}

export function NotFound(ctx: Context) {
  // TODO not sure about this
  if (ctx.method !== HTTPMethod.OPTIONS) {
    ctx.status(StatusCode.NOT_FOUND);
  }
  return ctx.json({ message: "Not Found" });
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

        if (Container.has(controller)) {
          controller = Container.get(controller);
        }

        routes.forEach((route) => {
          if (route == null) return;
          if (typeof route !== "function" && typeof route !== "object") return;

          route.target = controller[route.fnName].bind(controller);
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

    if (Container.has(controller)) {
      controller = Container.get(controller);
    }

    routes.forEach((route) => {
      if (route == null) return;
      if (typeof route !== "function" && typeof route !== "object") return;

      route.target = controller[route.fnName].bind(controller);
      let path = route.path;
      if (config.prefix) {
        path = config.prefix + path;
      }

      result.push({ ...route, path });
    });

    return result;
  }, []);
}

export function defaultErrorHandler(err: ErrorLike) {
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
