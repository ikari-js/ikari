import {
  Server,
  ServeOptions,
  TLSServeOptions,
  TLSWebSocketServeOptions,
  UnixServeOptions,
  UnixTLSServeOptions,
  UnixTLSWebSocketServeOptions,
  UnixWebSocketServeOptions,
  WebSocketServeOptions
} from "bun";

import { Context } from "../context";

export type Controller = {} & { prototype: any };

export type Route = {
  path: string;
  fnName: string;
  method: string;
  target: Controller;
  pathHasParams: boolean;
  before: Handler[];
  after: Handler[];
};

export interface Group {
  prefix: string;
  middlewares?: any[];
  controllers: Controller[];
}

export type Next = () => void;
export type Handler = (ctx: Context) => void | Promise<void>; // Context , Responses

export interface Middleware {
  use: Handler;
  ignoreOn?: string[];
}

// TODO: add more formats
export type LoggerFormats = "json" | "text" | "custom";

export interface Logger {
  // TODO: add more
  format?: LoggerFormats;
  logger: LoggerFunction;
  skip?: Handler;
}

export type LoggerFunction = (ctx: Context) => void;

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
