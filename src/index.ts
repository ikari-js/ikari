import "reflect-metadata";

import { Server, Serve as BunServe, ErrorLike } from "bun";
import { Config, Handlers, IkariServer, Route } from "./types";
import { ServeValidator } from "./serve-validator";
import { Context } from "./context";
import { Routes } from "./route";
import {
  HttpMethod,
  NotFound,
  StatusCode,
  createPath,
  defaultErrorHandler,
  getRoutesFromControllers,
  getRoutesFromGroups,
  returnContextResponse,
  startupMessage,
} from "./utils";
import { createRouter } from "radix3";

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
    routes = routes.concat(
      getRoutesFromControllers(config, config.controllers)
    );
  }

  if (config.groups) {
    routes = routes.concat(getRoutesFromGroups(config, config.groups));
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
    const url = new URL(request.url);
    const ctx = new Context(server, request, {}, url);
    const routeKey = request.method + "|" + url.pathname;

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

      if (allowedMethods.size > 0) {
        ctx.set("Allow", [...allowedMethods].join(", "));
        ctx.status(StatusCode.NO_CONTENT);
      } else {
        ctx.status(StatusCode.NOT_FOUND);
      }
    }

    if (!route && request.method === HttpMethod.HEAD) {
      route = router.lookup(HttpMethod.GET + "|" + url.pathname);
    }

    let handlers: Handlers;
    if (!route) {
      handlers = [...(config?.middlewares || []), NotFound];
    } else {
      handlers = [
        ...(config?.middlewares || []),
        ...route.before,
        route.target.prototype
          ? route.target.prototype[route.fnName].bind(route.target)
          : route.target[route.fnName].bind(route.target),
        ...route.after,
      ];
    }

    ctx.routes = new Routes(handlers);
    ctx.params = route?.params || {};

    // TODO performance
    // TODO context can be modified by middleware after all routes are executed is this ok?
    /*
     TODO bug when using ctx.next() in middleware withouth returning it like Logger middleware
     and handler or middlewares throws error, error wont show up in console 
    */
    await ctx.routes.start(ctx);

    return returnContextResponse(ctx);
  };

  (config.serveOptions as BunServe).error = function (
    this: Server,
    err: ErrorLike
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

export { Context };
export * from "./types";
