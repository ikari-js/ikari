import "reflect-metadata";

import {
  Server,
  ServeOptions,
  TLSServeOptions,
  TLSWebSocketServeOptions,
  UnixServeOptions,
  UnixTLSServeOptions,
  UnixTLSWebSocketServeOptions,
  UnixWebSocketServeOptions,
  WebSocketServeOptions,
  Serve as BunServe,
} from "bun";
import Controller from "./src/decorators/controller";

export interface Controller {}

export interface Group {
  prefix: string;
  middlewares?: any[];
  controllers: Controller[];
}

export type Context = {
  req: Request;
  res: Response;
};

export type Handler = (ctx: Context) => Promise<Response>;

export interface Middleware {
  use: (ctx: Context, next: () => void) => void;
  ignoreOn?: string[];
}

export interface Logger {
  log: (msg: string) => void;
  error: (msg: string) => void;
}

export type ErrorHandler = (
  ctx: Context,
  err: Error
) => Response | Promise<Response>;

type BunServeOptions<T> = T extends {
  fetch(
    this: Server,
    request: Request,
    server: Server
  ): Response | Promise<Response>;
}
  ? Omit<T, "fetch">
  : T;

export type Serve<WebSocketDataType = undefined> =
  | BunServeOptions<ServeOptions>
  | TLSServeOptions
  | UnixServeOptions
  | UnixTLSServeOptions
  | WebSocketServeOptions<WebSocketDataType>
  | TLSWebSocketServeOptions<WebSocketDataType>
  | UnixWebSocketServeOptions<WebSocketDataType>
  | UnixTLSWebSocketServeOptions<WebSocketDataType>;

export type Config<WebSocketDataType = undefined> = {
  controllers: Controller[];
  groups?: Group[];
  errorHandler?: ErrorHandler;
  middlewares?: Middleware[];
  logger?: Logger;
  port?: number;
  hostname?: string;
  bunServeOptions?: BunServeOptions<Serve<WebSocketDataType>>;
};

function defaultErrorHandler(_: Context, err: Error) {
  const errorRes = {
    message: err?.message,
    stack: err?.stack,
    cause: err?.cause,
  };
  return new Response(JSON.stringify(errorRes), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

export function Serve(config: Config) {
  if (typeof config !== "object") {
    throw new Error("Config must be an Config object");
  }

  if (!Array.isArray(config.controllers)) {
    throw new Error("Controllers must be an array");
  }

  if (config.controllers.length === 0) {
    throw new Error("Controllers must not be empty");
  }

  if (config.groups && !Array.isArray(config.groups)) {
    throw new Error("Groups must be an array");
  }

  if (config.middlewares && !Array.isArray(config.middlewares)) {
    throw new Error("Middlewares must be an array");
  }

  if (config.logger && typeof config.logger !== "object") {
    throw new Error("Logger must be an object");
  }

  if (config.errorHandler && typeof config.errorHandler !== "function") {
    throw new Error("ErrorHandler must be a function");
  }

  if (config.port && typeof config.port !== "number") {
    throw new Error("Port must be a number");
  }

  if (config.hostname && typeof config.hostname !== "string") {
    throw new Error("Hostname must be a string");
  }

  if (config.bunServeOptions && typeof config.bunServeOptions !== "object") {
    throw new Error("BunServeOptions must be an object");
  }

  if (!config.bunServeOptions) {
    config.bunServeOptions = {};
  }

  const routes = config.controllers.map((controller) => {
    return Reflect.getMetadata("routes", (controller as any).prototype);
  });

  const routesMap = new Map<string, any>();

  routes.flat().forEach((route) => {
    routesMap.set(route.path + ":" + route.method, route);
  });

  console.log(routesMap);
  // TODO: default logger

  (config.bunServeOptions as any as BunServe).fetch = async function (
    this: Server,
    request: Request,
    server: Server
  ): Promise<Response> {
    const url = new URL(request.url);

    const route = routesMap.get(
      url.pathname + ":" + request.method.toLowerCase()
    );
    if (!route) {
      return new Response("Not Found", { status: 404 });
    }

    const ctx: Context = {
      req: request,
      res: new Response(),
    };

    let handleResult;
    try {
      handleResult = await route.target.prototype[route.methodName](ctx);
    } catch (err) {
      // TODO: default error handler do it better
      if (!config.errorHandler) {
        config.errorHandler = defaultErrorHandler;
      }
      return config.errorHandler(ctx, err as Error);
    }

    if (handleResult instanceof Response) {
      return handleResult;
    }

    return new Response(handleResult);
  };
  (config.bunServeOptions as any as ServeOptions).port = config.port || 3001;
  (config.bunServeOptions as any as ServeOptions).hostname =
    config.hostname || "0.0.0.0";

  // TODO use return value of bun.serve to close server and stuff
  Bun.serve(config.bunServeOptions as any as BunServe);
}
