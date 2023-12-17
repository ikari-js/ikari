import "reflect-metadata";

import { Server, Serve as BunServe, Errorlike } from "bun";
import { Config, Controller, Group, IkariServer, Route } from "./types";
import { ServeValidator } from "./serve-validator";
import { Context, Routes } from "./context";
import { HttpMethod, StatusCode, createPath, startupMessage } from "./utils";
import { createRouter } from "radix3";

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

  if (!config.strict) {
    config.strict = false;
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

  const router = createRouter<Route>({ strictTrailingSlash: config.strict });

  routes.forEach((route) => {
    router.insert(route.method + "|" + route.path, route);
  });

  (config.serveOptions as BunServe).fetch = async function (
    this: Server,
    request: Request,
    server: Server
  ) {
    const ctx = new Context(
      server,
      request,
      new Routes(config.middlewares || []),
      {}
    );
    const url = new URL(request.url);
    const routeKey = request.method + "|" + url.pathname;

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

    if (ctx.routes.currentIndex < ctx.routes.length) {
      return returnContextResponse(ctx);
    }

    let route = router.lookup(routeKey);
    if (!route) {
      route = router.lookup(HttpMethod.ALL + "|" + url.pathname);
    }

    if (!route && request.method === HttpMethod.OPTIONS) {
      const allowedMethods = new Set<string>();
      for (const methods of Object.keys(HttpMethod)) {
        const r = router.lookup(methods + "|" + url.pathname);
        if (r) {
          allowedMethods.add(r.method);
        }
      }

      return ctx
        .status(StatusCode.NO_CONTENT)
        .set("Allow", [...allowedMethods].join(", "))
        .getResWithoutBody();
    }

    if (!route && request.method === HttpMethod.HEAD) {
      route = router.lookup(HttpMethod.GET + "|" + url.pathname);
    }

    if (!route) {
      return NotFound(ctx);
    }

    ctx.routes = new Routes([
      ...route.before,
      route.target.prototype[route.fnName],
      ...route.after,
    ]);
    ctx.params = route?.params || {};

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

    return returnContextResponse(ctx);
  };

  (config.serveOptions as BunServe).error = function (
    this: Server,
    err: Errorlike
  ) {
    return config.errorHandler!(err);
  };

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

//TODO: Tests are missing for this function. We have to test it.
function returnContextResponse(ctx: Context) {
  if (ctx.method === HttpMethod.HEAD || ctx.method === HttpMethod.OPTIONS) {
    return ctx.getResWithoutBody();
  }
  return ctx.res;
}

//TODO: Tests are missing for this function. We have to test it.
function NotFound(ctx: Context) {
  if (ctx.method === HttpMethod.HEAD) {
    return ctx.status(StatusCode.NOT_FOUND).getResWithoutBody();
  }
  return ctx.json({ message: "Not Found" }, StatusCode.NOT_FOUND).res;
}

//TODO: Tests are missing for this function. We have to test it.
function getRoutesFromGroups(config: Config, groups: Group[]): Route[] {
  return groups.reduce(
    (total: Route[], { prefix, controllers, middlewares }: Group) => {
      if (prefix) {
        prefix = createPath(prefix).replace(/\/+$/, "");
      }

      controllers.forEach((controller: Controller) => {
        const routes: Route[] = Reflect.getMetadata(
          "routes",
          controller.prototype
        );

        routes.forEach((route) => {
          if (prefix) route.path = prefix + route.path;
          if (config.prefix) route.path = config.prefix + route.path;
          if (middlewares) {
            route.before = middlewares.concat(route.before);
          }

          total.push(route);
        });
      });

      return total;
    },
    []
  );
}

//TODO: Tests are missing for this function. We have to test it.
function getRoutesFromControllers(
  config: Config,
  controllers: Controller[]
): Route[] {
  return controllers.reduce((total: Route[], controller: Controller) => {
    const routes: Route[] = Reflect.getMetadata("routes", controller.prototype);

    routes.forEach((route) => {
      if (config.prefix) {
        route.path = config.prefix + route.path;
      }
      total.push(route);
    });

    return total;
  }, []);
}

export { Context };
export * from "./types";
