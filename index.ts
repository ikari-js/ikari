import "reflect-metadata";

import { Server, ServeOptions, Serve as BunServe } from "bun";
import { Config, Context } from "./src/type";

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

  // TODO: check if all controllers are valid Controller type
  if (config.controllers.length === 0) {
    throw new Error("Controllers must not be empty");
  }

  // TODO: check if all controllers are valid Controller type
  if (config.groups && !Array.isArray(config.groups)) {
    throw new Error("Groups must be an array");
  }

  // TODO: check if all controllers are valid Middleware type
  if (config.middlewares && !Array.isArray(config.middlewares)) {
    throw new Error("Middlewares must be an array");
  }

  // TODO: check if logger is valid Logger type
  // TODO: default logger
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
