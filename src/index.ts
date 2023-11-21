import "reflect-metadata";

import { Server, Serve as BunServe, Errorlike } from "bun";
import {
  Config,
  Controller,
  Group,
  Handler,
  IkariServer,
  Route,
} from "./types";
import { ServeValidator } from "./serve-validator";
import { Context, Routes } from "./context";
import DefaultLogger from "./logger";
import { HttpMethod, createPath, startupMessage } from "./utils";

function defaultErrorHandler(err: Errorlike) {
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

  if (config.prefix) {
    config.prefix = createPath(config.prefix).replace(/\/+$/, "");
  }

  if (!config.errorHandler) {
    config.errorHandler = defaultErrorHandler;
  }

  if (!config.logger) {
    config.logger = new DefaultLogger();
  }

  if (!config.serveOptions) {
    config.serveOptions = {};
  }

  let routes: Route[] = [];

  if (config.controllers) {
    routes = [
      ...routes,
      ...getRoutesFromControllers(config, config.controllers),
    ];
  }

  if (config.groups) {
    routes = [...routes, ...getRoutesFromGroups(config, config.groups)];
  }

  if(routes.length === 0) {
    throw new Error("No routes found");
  }
  
  const routesMap = new Map<string, Map<string, Route>>();
  const routesWithParamsMap = new Map<string, Map<string, Route>>();

  routes.forEach((route) => {
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
        route.path.replace(/:([^\\/]+)/g, (_, paramName) => {
          return `(?<${paramName}>[^\\/]+)`;
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

  (config.serveOptions as BunServe).fetch = async function (
    this: Server,
    request: Request,
    server: Server
  ) {
    // TODO delete last / from url MAKE THIS OPTIONAL
    const url = new URL(request.url.replace(/\/$/, ""));
    const reqMethod = request.method.toLowerCase();
    const ctx = new Context(server, request);

    if (!config.disableServerHeader) {
      ctx.set("Server", "ikari");
    }

    let params: { [key: string]: string } = {};

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
    if (!possibleRoutes) {
      return NotFound(ctx);
    }

    let route = possibleRoutes!.get(reqMethod);
    if (possibleRoutes.has(HttpMethod.ALL)) {
      route = possibleRoutes.get(HttpMethod.ALL);
    }

    if (!route && reqMethod === HttpMethod.OPTIONS) {
      ctx.set("Allow", [...possibleRoutes.keys()].join(", ").toUpperCase());
      return ctx.status(200).getResWithoutBody();
    }

    if (!route && reqMethod === HttpMethod.HEAD && possibleRoutes.has("get")) {
      route = possibleRoutes.get("get");
    }

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

    try {
      // TODO can all methods handler head or options requests?
      if (reqMethod === HttpMethod.HEAD || reqMethod === HttpMethod.OPTIONS) {
        return ctx.getResWithoutBody();
      }
      return ctx.res;
    } finally {
      config.logger?.logger!(ctx as Context);
    }
  };

  (config.serveOptions as BunServe).error = function (
    this: Server,
    err: Errorlike
  ) {
    return config.errorHandler!(err);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bunServe = Bun.serve(config.serveOptions as BunServe);

  if (bunServe && !config.disableStartupMessage) {
    // eslint-disable-next-line no-console
    console.log(startupMessage(config, bunServe, routes.flat()));
  }

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
  }) as IkariServer;
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

function getRoutesFromGroups(config: Config, groups: Group[]): Route[] {
  if(groups.length === 0) {
    return [];
  }

  const routes = groups
    .map(({ prefix, controllers, middlewares }: Group) => {
      if (prefix) {
        prefix = createPath(prefix).replace(/\/+$/, "");
      }

      return controllers
        .map((controller: Controller) => {
          const routes: Route[] = Reflect.getMetadata(
            "routes",
            controller.prototype
          );

          return routes.map((route) => {
            let routeBefore = route.before;
            let routePath = route.path;
            if (prefix) routePath = prefix + routePath;
            if (config.prefix) routePath = config.prefix + routePath;
            if (middlewares) {
              routeBefore = [...(middlewares as Handler[]), ...route.before];
            }
            if (config.middlewares) {
              routeBefore = [
                ...(config.middlewares as Handler[]),
                ...routeBefore,
              ];
            }

            return { ...route, path: routePath, before: routeBefore } as Route;
          });
        })
        .flat();
    })
    .flat();

  return routes;
}

function getRoutesFromControllers(
  config: Config,
  controllers: Controller[]
): Route[] {
  if(controllers.length === 0) {
    return [];
  }

  const routes = controllers
    .map((controller: Controller) => {
      const routes: Route[] = Reflect.getMetadata(
        "routes",
        controller.prototype
      );

      return routes.map((route) => {
        let routeBefore = route.before;
        let routePath = route.path;
        if (config.prefix) routePath = config.prefix + routePath;
        if (config.middlewares) {
          routeBefore = [...(config.middlewares as Handler[]), ...route.before];
        }

        return { ...route, path: routePath, before: routeBefore } as Route;
      });
    })
    .flat();

  return routes;
}

export { Context };
export * from "./types";
