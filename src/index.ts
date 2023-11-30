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
import { HttpMethod, StatusCode, createPath, startupMessage } from "./utils";

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

  if (routes.length === 0) {
    throw new Error("No routes found");
  }

  const routesMap = new Map<string, Route>();
  const routesWithParamsMap = new Map<string, Route>();

  routes.forEach((route) => {
    if (!route.pathHasParams) {
      routesMap.set(route.path + "|method|" + route.method, route);
    } else {
      // TODO: need to improve this with more path param separators
      // /example/:id/:name
      route.path =
        "^" +
        route.path.replace(/:([^\\/]+)/g, (_, paramName) => {
          return `(?<${paramName}>[^\\/]+)`;
        }) +
        "$";
      routesWithParamsMap.set(route.path + "|method|" + route.method, route);
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

    const routeKey = url.pathname + "|method|" + reqMethod;
    let params: { [key: string]: string } = {};
    let route = routesMap.get(routeKey);

    if (!route) {
      for (const [path, r] of routesWithParamsMap.entries()) {
        const match = url.pathname.match(path.split("|method|")[0]);
        if (match && r.method === reqMethod) {
          if (match.groups) {
            for (const [key, value] of Object.entries(match.groups)) {  
                params[key] = decodeURIComponent(value);
            }
          }
          route = r;
          break;
        }
      }
    }

    if (!route) {
      route = routesMap.get(url.pathname + "|method|" + HttpMethod.ALL);
      if (!route) {
        for (const [path, r] of routesWithParamsMap.entries()) {
          const match = url.pathname.match(path.split("|method|")[0]);
          if (match && r.method === HttpMethod.ALL) {
            params = match.groups ? match.groups : {};
            route = r;
            break;
          }
        }
      }
    }

    if (!route && reqMethod === HttpMethod.OPTIONS) {
      const allowedMethods = new Set<string>();
      for (const [path, r] of routesMap.entries()) {
        const match = url.pathname.match(path.split("|method|")[0]);
        if (match) {
          allowedMethods.add(r.method.toLocaleUpperCase());
        }
      }
      for (const [path, r] of routesWithParamsMap.entries()) {
        const match = url.pathname.match(path.split("|method|")[0]);
        if (match) {
          allowedMethods.add(r.method.toLocaleUpperCase());
        }
      }

      if (allowedMethods.size > 0) {
        ctx.res.headers.set("Allow", [...allowedMethods].join(", "));
        return ctx.status(StatusCode.NO_CONTENT).res;
      }
    }

    if (!route && reqMethod === HttpMethod.HEAD) {
      for (const [path, r] of routesMap.entries()) {
        const match = url.pathname.match(path.split("|method|")[0]);
        if (match && r.method === HttpMethod.GET) {
          route = r;
          break;
        }
      }

      if (!route) {
        for (const [path, r] of routesWithParamsMap.entries()) {
          const match = url.pathname.match(path.split("|method|")[0]);
          if (match && r.method === HttpMethod.GET) {
            route = r;
            break;
          }
        }
      }
    }

    if (!route) {
      if (reqMethod === HttpMethod.HEAD || reqMethod === HttpMethod.OPTIONS) {
        return ctx.status(StatusCode.NOT_FOUND).res;
      }
      return ctx.status(StatusCode.NOT_FOUND).json({ message: "Not Found" })
        .res;
    }

    // TODO performance
    ctx.params = params;
    ctx.routes = new Routes([
      ...route.before,
      route.target.prototype[route.fnName],
      ...route.after,
    ]);

    // TODO performance
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

    return ctx.res;
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
    get(target, prop) {
      if (bannedProps.includes(prop as string)) {
        throw new Error(`Cannot access ${prop.toString()}`);
      }

      const value = Reflect.get(target, prop);
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    },
    set(target, prop, value) {
      if (bannedProps.includes(prop as string)) {
        throw new Error(`Cannot set ${prop.toString()}`);
      }

      return Reflect.set(target, prop, value);
    },
  }) as IkariServer;
}

function getRoutesFromGroups(config: Config, groups: Group[]): Route[] {
  if (groups.length === 0) {
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
  if (controllers.length === 0) {
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
