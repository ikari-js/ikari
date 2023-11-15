import "reflect-metadata";

import { Server, ServeOptions, Serve as BunServe } from "bun";
import { Config, Controller, KyteServer, Route } from "./src/type";
import { ServeValidator } from "./src/serve-validator";
import { Context, Routes } from "./context";
import DefaultLogger from "./src/logger";
import { HttpMethod } from "./src/methods";

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

const bannedProps = [
  "fetch",
  "publish",
  "reload",
  "upgrade",
  "requestIP",
  "pendingWebsockets",
];

export function Serve(config: Config) {
  if (!Bun) {
    throw new Error("Please install bun first");
  }

  new ServeValidator(config).validate();

  if (!config.errorHandler) {
    config.errorHandler = defaultErrorHandler;
  }

  if (!config.logger) {
    config.logger = new DefaultLogger();
  }

  if (!config.bunServeOptions) {
    config.bunServeOptions = {};
  }

  const routes = config.controllers.map((controller: Controller) => {
    return Reflect.getMetadata("routes", controller.prototype) as Route[];
  });

  const routesMap = new Map<string, Map<string, Route>>();
  const routesWithParamsMap = new Map<string, Map<string, Route>>();

  routes.flat().forEach((route) => {
    if (!route.pathHasParams) {
      const r = routesMap.get(route.path);
      if (r) {
        r.set(route.method, route);
      } else {
        const newMap = new Map<string, Route>();
        routesMap.set(route.path, newMap.set(route.method, route));
      }
    } else {
      // TODO: need to improve this with more path param separators
      // /example/:id/:name
      route.path =
        route.path.replace(/:([^\/]+)/g, (_, paramName) => {
          return `(?<${paramName}>[^\/]+)`;
        }) + "$";

      const r = routesWithParamsMap.get(route.path);
      if (r) {
        r.set(route.method, route);
      } else {
        const newMap = new Map<string, Route>();
        routesWithParamsMap.set(route.path, newMap.set(route.method, route));
      }
    }
  });

  (config.bunServeOptions as any as BunServe).fetch = async function (
    this: Server,
    request: Request,
    server: Server
  ) {
    // TODO delete last / from url MAKE THIS OPTIONAL
    const url = new URL(request.url.replace(/\/$/, ""));
    const reqMethod = request.method.toLowerCase();
    let ctx = new Context(server, request);
    let params: { [key: string]: string } = {};
    try {
      let possibleRoutes = routesMap.get(url.pathname);
      if (!possibleRoutes) {
        for (const [path, r] of routesWithParamsMap.entries()) {
          const match = url.pathname.match(path);
          if (match) {
            params = match.groups ? match.groups : {};
            possibleRoutes = r;
            break;
          }
        }
      }

      // TODO maybe there is a bug in here
      if (!possibleRoutes) {
        return NotFound(ctx);
      }

      // TODO maybe there is a bug in here
      const route = possibleRoutes?.get(reqMethod);
      if (!route && reqMethod === HttpMethod.OPTIONS) {
        ctx.set("Allow", [...possibleRoutes.keys()].join(", ").toUpperCase());
        return NotAllowed(ctx);
      }

      // TODO maybe there is a bug in here
      if (!route) {
        return NotAllowed(ctx);
      }

      ctx.params = params;
      ctx.routes = new Routes([
        ...route.before,
        route.target.prototype[route.fnName],
        ...route.after,
      ]);

      // TODO maybe there is a bug in here
      while (ctx.routes.hasNext()) {
        const fnIndex = ctx.routes.currentIndex;
        const fn = ctx.routes.currentHandler();
        if (!fn) {
          break;
        }

        await fn(ctx);

        if (fnIndex === ctx.routes.currentIndex) {
          break;
        }
      }
      // TODO can all methods handler head or options requests?
      if (reqMethod === "head" || reqMethod === "options") {
        return ctx.getResWithoutBody();
      }

      return ctx.res;
    } catch (err) {
      return config.errorHandler!(ctx as Context, err as Error);
    } finally {
      config.logger?.logger!(ctx as Context);
    }
  };

  (config.bunServeOptions as any as ServeOptions).port = config.port || 3000;
  (config.bunServeOptions as any as ServeOptions).hostname =
    config.hostname || "0.0.0.0";

  const bunServe = Bun.serve(config.bunServeOptions as any as BunServe);

  return new Proxy(bunServe, {
    get(target, prop, receiver) {
      if (bannedProps.includes(prop as string)) {
        throw new Error(`Cannot access ${prop.toString()}`);
      }

      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (bannedProps.includes(prop as string)) {
        throw new Error(`Cannot set ${prop.toString()}`);
      }

      return Reflect.set(target, prop, value, receiver);
    },
  }) as KyteServer;
}

function NotFound(ctx: Context) {
  const method = ctx.req.method.toLowerCase();
  if (method === HttpMethod.HEAD) {
    return ctx.status(404).res;
  }
  return ctx.status(404).json({ message: "Not Found" }).res;
}

function NotAllowed(ctx: Context) {
  const method = ctx.req.method.toLowerCase();
  if (method === HttpMethod.HEAD) {
    return ctx.status(405).res;
  }
  return ctx.status(405).json({ message: "Method Not Allowed" }).res;
}
