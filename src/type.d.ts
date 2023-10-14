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

export interface Controller {}

export interface Group {
  prefix: string;
  middlewares?: any[];
  controllers: Controller[];
}

export type Context = {
  req: Request;
  res: Response;
};

export type Handler = (ctx: Context) => Promise<Response>;

export interface Middleware {
  use: (ctx: Context, next: () => void) => void;
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