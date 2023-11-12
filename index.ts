import "reflect-metadata";

import { Server, ServeOptions, Serve as BunServe } from "bun";
import { Config, Controller, KyteServer, Route } from "./src/type";
import { ServeValidator } from "./src/serve-validator";
import { Context, Routes } from "./context";

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
  new ServeValidator(config).validate();

  if (!config.errorHandler) {
    config.errorHandler = defaultErrorHandler;
  }

  if (!config.bunServeOptions) {
    config.bunServeOptions = {};
  }

  const routes = config.controllers.map((controller: Controller) => {
    return Reflect.getMetadata("routes", controller.prototype) as Route[];
  });

  const routesMap = new Map<string, Route>();
  const routesWithParamsMap = new Map<string, Route>();

  routes.flat().forEach((route) => {
    if (!route.pathHasParams) {
      // TODO: may need to change method separator
      routesMap.set(route.path + ":" + route.method, route);
    } else {
      route.path = route.path.replace(/:([^\/]+)/g, (_, paramName) => {
        return `(?<${paramName}>[^\/]+)`;
      });
      routesWithParamsMap.set(route.path + ":" + route.method, route);
    }
  });

  (config.bunServeOptions as any as BunServe).fetch = async function (
    this: Server,
    request: Request,
    server: Server
  ) {
    const url = new URL(request.url);

    let ctx: Context | undefined;
    let route = routesMap.get(
      url.pathname + ":" + request.method.toLowerCase()
    );

    if (!route) {
      for (const [path, r] of routesWithParamsMap) {
        // TODO: need to improve this with more path param separators
        const methodFromPath = path.slice(path.lastIndexOf(":") + 1);
        const pathWithoutMethod = path.slice(0, path.lastIndexOf(":"));

        const match = url.pathname.match(pathWithoutMethod);

        if (match && methodFromPath === request.method.toLowerCase()) {
          const params = match.groups;
          if (params) {
            ctx = new Context(
              server,
              request,
              new Routes([
                ...r.before,
                r.target.prototype[r.fnName],
                ...r.after,
              ]),
              params
            );
          }
          route = r;
          break;
        }
      }
    }

    if (!route) {
      return new Context(server, request, new Routes([]))
        .status(404)
        .json({ message: "Not Found" }).res;
    }

    if (!ctx) {
      ctx = new Context(
        server,
        request,
        new Routes([
          ...route.before,
          route.target.prototype[route.fnName],
          ...route.after,
        ])
      );
    }

    try {
      // TODO maybe there is a bug in here
       do {
        const fnIndex = ctx.routes.currentIndex;
        const fn = ctx.routes.currentHandler();
        if (!fn) {
          break;
        }
        
        await fn(ctx);

        if (fnIndex === ctx.routes.currentIndex) return ctx.res;
      } while (ctx.routes.hasNext())

      return ctx.res;
    } catch (err) {
      return config.errorHandler!(ctx, err as Error);
    }

    // TODO do we need tihs anymore?
    // if (handleResult instanceof Response) {
    //   return handleResult;
    // } else if (handleResult instanceof Context) {
    //   return ctx.res;
    // } else {
    //   throw new Error("Invalid return type");
    // }
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
