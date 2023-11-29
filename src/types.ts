import { Server, ServeOptions, TLSServeOptions, Errorlike } from "bun";

import { Context } from "./context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
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
  prefix?: string;
  middlewares?: Handler[];
  controllers: Controller[];
}

export type Handler = (ctx: Context) => Context | void | Promise<void>;

// TODO: add more formats
export type LoggerFormats = "json" | "text" | "custom";

export type ErrorHandler = (err: Errorlike) => Response | Promise<Response>;

export type IkariServeOptions =
  | Omit<ServeOptions, "error" | "fetch">
  | Omit<TLSServeOptions, "error" | "fetch">;

export type Config = {
  prefix?: string;
  controllers?: Controller[];
  groups?: Group[];
  errorHandler?: ErrorHandler;
  middlewares?: Handler[];
  serveOptions?: IkariServeOptions;
  disableStartupMessage?: boolean;
};

export type IkariServer = Omit<
  Server,
  "fetch" | "publish" | "reload" | "upgrade" | "requestIP" | "pendingWebSockets"
>;
