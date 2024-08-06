import "reflect-metadata";

import { Server, Serve as BunServe, ErrorLike } from "bun";
import { Config, IkariServer, Route } from "./types";
import { ServeValidator } from "./serve-validator";
import { Context } from "./context";
import { Routes } from "./route";
import {
  HTTPHeaders,
  HTTPMethod,
  NotFound,
  StatusCode,
  createPath,
  defaultErrorHandler,
  getRoutesFromControllers,
  getRoutesFromGroups,
  returnContextResponse,
  startupMessage,
} from "./utils";
import { createRouter, addRoute, findRoute, RouterContext } from "rou3";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const bannedProps = [
  "fetch",
  "publish",
  "reload",
  "upgrade",
  "requestIP",
  "pendingWebsockets",
];

const functionCache = new Map<string, typeof AsyncFunction>();

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
    addRoute(router, route.path, route.method, route);
  });

  (config.serveOptions as BunServe).fetch = async function (
    this: Server,
    request: Request,
    server: Server
  ) {
    return fetchFunction(request, config, server, router);
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

const fetchFunction = async function (
  request: Request,
  config: Config,
  server: Server,
  router: RouterContext<Route>
) {
  if (functionCache.has(request.method)) {
    const fn = functionCache.get(request.method);
    return fn(
      findRoute,
      router,
      HTTPMethod,
      StatusCode,
      NotFound,
      Routes,
      Context,
      HTTPHeaders,
      returnContextResponse,
      config,
      server,
      request
    );
  }

  let fn = `
    const url = new URL(request.url)
    let route = findRoute(router, url.pathname, request.method);
    if (!route) {
      route = findRoute(router, url.pathname, HTTPMethod.ALL);
    }
    `;

  if (request.method === HTTPMethod.OPTIONS) {
    fn += `
        let allowHeader = "";
        let status;
        const allowedMethods = new Set();
        for (const method of Object.keys(HTTPMethod)) {
          const r = findRoute(router, url.pathname, method);
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
      
    `;
  } else if (request.method === HTTPMethod.HEAD) {
    fn += `
      if (!route) {
        route = findRoute(router, url.pathname, HTTPMethod.GET);
      }
    `;
  }

  fn += `
      let handlers;
      if (!route?.data || !route.data.target) {
        handlers = [...(config?.middlewares || []), NotFound];
      } else {
        handlers = [
          ...(config?.middlewares || []),
          ...route.data.before,
          route.data.target.prototype
            ? route.data.target.prototype[route.data.fnName].bind(
                route.data.target
              )
            : route.data.target[route.data.fnName].bind(route.data.target),
          ...route.data.after,
        ];
      }
      const routes = new Routes(handlers);
      const params = route?.params || {};
      const ctx = new Context(server, request, params, url, routes);
  `;

  if (request.method === HTTPMethod.OPTIONS) {
    fn += `
    if (allowHeader) {
      ctx.set(HTTPHeaders.Allow, allowHeader);
    }

    if (status) {
      ctx.status(status);
    }
    `;
  }

  fn += `
    await ctx.next();
    return returnContextResponse(ctx);
  `;

  const func = new AsyncFunction(
    "findRoute",
    "router",
    "HTTPMethod",
    "StatusCode",
    "NotFound",
    "Routes",
    "Context",
    "HTTPHeaders",
    "returnContextResponse",
    "config",
    "server",
    "request",
    fn
  );

  functionCache.set(request.method, func);
  return func(
    findRoute,
    router,
    HTTPMethod,
    StatusCode,
    NotFound,
    Routes,
    Context,
    HTTPHeaders,
    returnContextResponse,
    config,
    server,
    request
  );
};

export { Context };
export * from "./types";
