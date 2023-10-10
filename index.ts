import "reflect-metadata";

import {
  Server,
  ServeOptions,
  TLSServeOptions,
  TLSWebSocketServeOptions,
  UnixServeOptions,
  UnixTLSServeOptions,
  UnixTLSWebSocketServeOptions,
  UnixWebSocketServeOptions,
  WebSocketServeOptions,
  Serve as BunServe,
} from "bun";
import Controller from "./decorators/controller";
import Get from "./decorators/get";

export interface Controller {}

export interface Group {
  prefix: string;
  middlewares?: any[];
  controllers: Controller[];
}

export type Contex = {
  req: Request;
  res: Response;
};

export interface Middleware {
  use: (ctx: Contex, next: () => void) => void;
  ignoreOn?: string[];
}

export interface Logger {
  log: (msg: string) => void;
  error: (msg: string) => void;
}

export type ErrorHandler = (ctx: Contex) => void;

type BunServeOptions<T> = T extends {
  fetch(
    this: Server,
    request: Request,
    server: Server
  ): Response | Promise<Response>;
}
  ? Omit<T, "fetch">
  : T;

export type Serve<WebSocketDataType = undefined> =
  | BunServeOptions<ServeOptions>
  | TLSServeOptions
  | UnixServeOptions
  | UnixTLSServeOptions
  | WebSocketServeOptions<WebSocketDataType>
  | TLSWebSocketServeOptions<WebSocketDataType>
  | UnixWebSocketServeOptions<WebSocketDataType>
  | UnixTLSWebSocketServeOptions<WebSocketDataType>;

export type Config<WebSocketDataType = undefined> = {
  controllers: Controller[];
  groups?: Group[];
  errorHandler?: ErrorHandler;
  middlewares?: Middleware[];
  logger?: Logger;
  port?: number;
  hostname?: string;
  bunServeOptions?: BunServeOptions<Serve<WebSocketDataType>>;
};

function defaultErrorHandler(ctx: Contex) {
  // return error as json
}

function Serve(config: Config) {
  if (typeof config !== "object") {
    throw new Error("Config must be an Config object");
  }

  if (!Array.isArray(config.controllers)) {
    throw new Error("Controllers must be an array");
  }

  //   if (config.controllers.length === 0) {
  //     throw new Error("Controllers must not be empty");
  //   }

  if (config.groups && !Array.isArray(config.groups)) {
    throw new Error("Groups must be an array");
  }

  if (config.middlewares && !Array.isArray(config.middlewares)) {
    throw new Error("Middlewares must be an array");
  }

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

  if (!config.errorHandler) {
    config.errorHandler = defaultErrorHandler;
  }

  if (!config.bunServeOptions) {
    config.bunServeOptions = {};
  }

  const routes = config.controllers.map((controller) => {
    return Reflect.getMetadata("routes", (controller as any).prototype);
  });

  // default logger
  (config.bunServeOptions as any as BunServe).fetch = function async(
    this: Server,
    request: Request,
    server: Server
  ): Response | Promise<Response> {
    const url = new URL(request.url);
    const route = routes.flat().find((route) => {
      return route.path === url.pathname;
    });
    if (!route) {
      return new Response("Not Found", { status: 404 });
    }
    
    const routeFunc = route.target.prototype[route.methodName]();
    if(routeFunc instanceof Response) {
        return routeFunc;
    }

    return new Response(routeFunc);
  };
  (config.bunServeOptions as any as ServeOptions).port = config.port || 3000;
  (config.bunServeOptions as any as ServeOptions).hostname =
    config.hostname || "0.0.0.0";

  Bun.serve(config.bunServeOptions as any as BunServe);
}

@Controller("/test")
class TestController {
  @Get()
  public async test() {
    return new Response("Hello World");
  }
}

@Controller("/test2")
class TestController2 {
  @Get()
  public async test2() {
    return new Response("Hello World2");
  }

  @Get()
  public async test3() {
    return new Response("Hello World3");
  }
}

const config: Config = {
  controllers: [TestController, TestController2],
};

Serve(config);
