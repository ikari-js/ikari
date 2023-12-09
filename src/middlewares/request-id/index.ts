import { Context } from "../..";

export type Config = {
  /**
   * The header name to set the request id.
   * @default "x-request-id"
   * @type {string}
   */
  header?: string;
  /**
   * The local key to store the request id.
   * @default "requestId"
   * @type {string}
   */
  localKey?: string;
  /**
   * The generator function to generate the request id.
   * @default () => crypto.randomUUID()
   * @type {() => string}
   */
  generator?: () => string;
};

function defaultConfig(config: Config): Config {
  if (config.header && typeof config.header !== "string") {
    throw new TypeError("config.header must be a string");
  }

  if (config.localKey && typeof config.localKey !== "string") {
    throw new TypeError("config.localKey must be a string");
  }

  if (config.generator && typeof config.generator !== "function") {
    throw new TypeError("config.generator must be a function");
  }

  return {
    header: "x-request-id",
    localKey: "requestId",
    generator: () => crypto.randomUUID(),
    ...config,
  };
}

export function requestId(config: Config = {}) {
  const { header, localKey, generator } = defaultConfig(config);

  return (ctx: Context) => {
    const requestId = ctx.get(header!);
    const value = requestId || generator!();
    ctx.set(header!, value);
    ctx.locals.set(localKey!, value);
    return ctx.next();
  };
}
