import { Server, ServeOptions, TLSServeOptions, Errorlike } from "bun";

import { Context } from "./context";

// eslint-disable-next-line @typescript-eslint/ban-types
export type LiteralUnionStr<T extends U, U = string> = T | (string & {});

export type Controller = {
  prototype: {
    [key: string]: Handler;
  };
  name: string;
  length: number;
  new (...args: unknown[]): unknown;
};

export type Route = {
  path: string;
  fnName: string;
  method: string;
  target: Controller;
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
) => Context | Promise<Context> | void | Promise<void>;

export type Handlers = Handler[];

export type ErrorHandler = (err: Errorlike) => Response | Promise<Response>;

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
   * middlewares: [CORSMiddleware()]
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

  /**
   * Strict mode enables strict trailing slash handling and removes the trailing slash from the path before matching it with the routes.
   * When strict mode is enabled, `GET /users/` and `GET /users` are treated as different routes.
   * @default false
   * @example
   * strict: true
   */
  strict?: boolean;
};

export type IkariServer = Omit<
  Server,
  "fetch" | "publish" | "reload" | "upgrade" | "requestIP" | "pendingWebSockets"
>;
