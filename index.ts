import "reflect-metadata";

import { Server, ServeOptions, Serve as BunServe } from "bun";
import { Config, Context } from "./src/type";
import { ServeValidator } from "./src/serve-validator";

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
  new ServeValidator(config).validate();

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
