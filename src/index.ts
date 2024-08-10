import "reflect-metadata";

import { Server, Serve as BunServe, ErrorLike } from "bun";
import { Config, Handlers, IkariServer, Route } from "./types";
import { ServeValidator } from "./serve-validator";
import { Context } from "./context";
import { Routes } from "./route";
import {
  HTTPHeaders,
  HTTPMethod,
  StatusCode,
  createPath,
  defaultErrorHandler,
  defaultNotFound,
  getRoutesFromControllers,
  getRoutesFromGroups,
  returnContextResponse,
  startupMessage,
} from "./utils";
import { createRouter, addRoute, findRoute } from "rou3";

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

  if (!config.notFoundHandler) {
    config.notFoundHandler = defaultNotFound;
  }

  if (!config.serveOptions) {
    config.serveOptions = {};
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

  const router = createRouter<Route>();

  routes.forEach((route) => {
    addRoute(router, route.method, route.path, route);
  });

  (config.serveOptions as BunServe).fetch = async function (
    this: Server,
    request: Request,
    server: Server
  ) {
    const pathFirstIndex = request.url.indexOf("/", 9);
    const query = request.url.indexOf("?", pathFirstIndex + 1);
    const path =
      pathFirstIndex === -1
        ? "/"
        : query === -1
        ? request.url.substring(pathFirstIndex)
        : request.url.substring(pathFirstIndex, query);

    let allowHeader = "";
    let status;

    let route = findRoute(router, request.method, path);
    if (!route) {
      route = findRoute(router, HTTPMethod.ALL, path);
    }

    if (!route && request.method === HTTPMethod.OPTIONS) {
      const allowedMethods = new Set<string>();
      for (const method of Object.keys(HTTPMethod)) {
        const r = findRoute(router, method, path);
        if (r?.data) {
          allowedMethods.add(r.data.method);
        }
      }

      if (allowedMethods.size > 0) {
        allowHeader = [...allowedMethods].join(", ");
        status = StatusCode.NO_CONTENT;
      } else {
        status = StatusCode.NOT_FOUND;
      }
    }

    if (!route && request.method === HTTPMethod.HEAD) {
      route = findRoute(router, HTTPMethod.GET, path);
    }

    let handlers: Handlers;
    if (!route?.data || !route.data.target) {
      handlers = [...(config?.middlewares || []), config.notFoundHandler!];
    } else {
      handlers = [
        ...(config?.middlewares || []),
        ...route.data.before,
        route.data.target,
        ...route.data.after,
      ];
    }

    const routes = new Routes(handlers);
    const params = route?.params || {};

    const ctx = new Context(server, request, params, request.url, routes);
    if (allowHeader) {
      ctx.set(HTTPHeaders.Allow, allowHeader);
    }

    if (status) {
      ctx.status(status);
    }

    // TODO performance
    // TODO context can be modified by middleware after all routes are executed is this ok?
    /*
     TODO bug when using ctx.next() in middleware withouth returning it like Logger middleware
     and handler or middlewares throws error, error wont show up in console
    */
    await ctx.next();

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
