import { Server, ServeOptions, TLSServeOptions, ErrorLike } from "bun";

import { Context } from "./context";
import { ServiceOptions } from "typedi/types/interfaces/service-options.interface";

export type LiteralUnionStr<T extends U, U = string> = T | (string & object);

// It is not possible to get the generic type of a function in TypeScript.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionTarget = any;

export type Controller = Constructor | InstanceType<Constructor>;

export type ControllerOptions = Omit<ServiceOptions, "transient">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T | any;

export type Route = {
  path: string;
  fnName: string;
  method: string;
  target?: Controller;
  pathHasParams: boolean;
  before: Handlers;
  after: Handlers;
};

export interface Group {
  /**
   * Prefix for all routes in the group
   * @default null
   * @example
   * prefix: "/api"
   * // => GET /api/users
   */
  prefix?: string;
  /**
   * Middlewares to be used in the group
   * @example
   * middlewares: [AuthMiddleware()]
   */
  middlewares?: Handlers;
  /**
   * Controller classes to be used in the group
   */
  controllers: Controller[];
}

export type Handler = (
  ctx: Context
) => Promise<void | Context> | void | Context;

export type Handlers = Handler[];

export type ErrorHandler = (err: ErrorLike) => Response | Promise<Response>;

export type IkariServeOptions =
  | Omit<ServeOptions, "error" | "fetch">
  | Omit<TLSServeOptions, "error" | "fetch">;

export type Config = {
  /**
   * Prefix for all routes in the server
   * @default null
   * @example
   * prefix: "/api"
   * // => GET /api/users
   */
  prefix?: string;
  /**
   * Controller classes to be used in the server
   */
  controllers?: Controller[];
  /**
   * Group of controllers to be used in the server
   */
  groups?: Group[];
  /**
   * Error handler for the server
   * @default defaultErrorHandler
   */
  errorHandler?: ErrorHandler;
  /**
   * Middlewares to be used in the server
   * @example
   * middlewares: [CORS(), Logger()]
   */
  middlewares?: Handlers;
  /**
   * Serve options for the server. See Bun ServeOptions for more information.
   * @default ServeOptions
   */
  serveOptions?: IkariServeOptions;
  /**
   * Disable startup message
   * @default false
   */
  disableStartupMessage?: boolean;

};

export type IkariServer = Omit<
  Server,
  "fetch" | "publish" | "reload" | "upgrade" | "requestIP" | "pendingWebSockets"
>;
