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

export type Controller = {} & { prototype: any };

export type Route = {
  path: string;
  fnName: string;
  method: string;
  target: Controller;
  pathHasParams: boolean;
};

export interface Group {
  prefix: string;
  middlewares?: any[];
  controllers: Controller[];
}

export type Handler = (ctx: Context) => Context | Response | Promise<Response>;

export interface Middleware {
  use: Handler;
  ignoreOn?: string[];
}

export interface Logger {
  log: (msg: string) => void;
  error: (msg: string) => void;
}

export type ErrorHandler = (
  ctx: Context,
  err: Error
) => Response | Promise<Response>;

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

export type KyteServer = Omit<
  Server,
  "fetch" | "publish" | "reload" | "upgrade" | "requestIP" | "pendingWebSockets"
>;
