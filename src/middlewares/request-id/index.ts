import { Context } from "../..";

/**
 * The generator function to generate the request id.
 * @returns {string}
 */
export type Generator = () => string;

export type Config = {
  /**
   * The header name to set the request id.
   * @default DefaultHeaderKey = "X-Request-Id"
   * @type {string}
   */
  header?: string;
  /**
   * The local key to store the request id.
   * @default DefaultLocalKey = "request-id"
   * @type {string}
   */
  localKey?: string;
  /**
   * The generator function to generate the request id.
   * @default crypto.randomUUID()
   * @type {Generator}
   */
  generator?: Generator;
};

export const DefaultHeaderKey = "X-Request-Id";
export const DefaultLocalKey = "request-id";

const defaultConfig: Config = {
  header: DefaultHeaderKey,
  localKey: DefaultLocalKey,
  generator: () => crypto.randomUUID(),
};

export function RequestId(config: Config = {}) {
  const { header, localKey, generator } = { ...defaultConfig, ...config };
  if (!header || typeof header !== "string") {
    throw new TypeError("Header must be a string");
  }

  if (!localKey || typeof localKey !== "string") {
    throw new TypeError("LocalKey must be a string");
  }

  if (!generator || typeof generator !== "function") {
    throw new TypeError("Generator must be a function");
  }

  return (ctx: Context) => {
    const requestId = ctx.get(header);
    const value = requestId || generator();
    ctx.set(header, value);
    ctx.locals.set(localKey, value);
    return ctx.next();
  };
}
