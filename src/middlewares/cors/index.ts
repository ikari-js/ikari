import { Context } from "../..";
import { HTTPHeaders, HTTPMethod, StatusCode } from "../../utils";

export type HTTPMethods =
  // Common Methods See: https://datatracker.ietf.org/doc/html/rfc7231#section-4.3
  | "GET"
  | "HEAD"
  | "PUT"
  | "PATCH"
  | "POST"
  | "DELETE"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE"
  // Registered Mehods See: https://www.iana.org/assignments/http-methods/http-methods.xhtml
  | "ACL"
  | "BASELINE-CONTROL"
  | "BIND"
  | "CHECKIN"
  | "CHECKOUT"
  | "COPY"
  | "LABEL"
  | "LINK"
  | "LOCK"
  | "MERGE"
  | "MKACTIVITY"
  | "MKCALENDAR"
  | "MKCOL"
  | "MKREDIRECTREF"
  | "MKWORKSPACE"
  | "MOVE"
  | "ORDERPATCH"
  | "PATCH"
  | "PRI"
  | "PROPFIND"
  | "PROPPATCH"
  | "REBIND"
  | "REPORT"
  | "SEARCH"
  | "UNBIND"
  | "UNCHECKOUT"
  | "UNLINK"
  | "UNLOCK"
  | "UPDATE"
  | "UPDATEREDIRECTREF"
  | "VERSION-CONTROL";

export type Config = {
  /**
   * Configures the Access-Control-Allow-Origin CORS header.
   * @default '*'
   *
   * Value can be:
   *  - `string` Directly set the value of `Access-Control-Allow-Origin`.
   *  - `string[]` Set the value of `Access-Control-Allow-Origin` to the first origin in the list that matches the request origin.
   *  - `RegExp` Set if request origin matches the regexp pattern. Example: `/example\.com$/`.
   *  - `(ctx: Context) => boolean` Set if request origin satisfies the provided function. Receives the ctx as the first parameter. Example: `(ctx) => ctx.get('Origin') === 'http://example.com'`.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
   */
  origin?: string[] | string | RegExp | ((ctx: Context) => boolean);
  /**
   * Configures the Access-Control-Allow-Methods CORS header.
   * @default ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
   */
  methods?: HTTPMethods[] | string[] | string;
  /**
   * Configures the Access-Control-Allow-Headers CORS header.
   * @default ['Content-Type', 'Authorization', 'Accept']
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
   */
  allowedHeaders?: string[] | string;
  /**
   * Configures the Access-Control-Expose-Headers CORS header.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
   */
  exposedHeaders?: string[] | string;
  /**
   * Configures the Access-Control-Allow-Credentials CORS header.
   * @default true
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
   */
  credentials?: boolean;
  /**
   * Configures the Access-Control-Max-Age CORS header.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
   */
  maxAge?: number;
};

const defaultOptions: Config = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  maxAge: 5,
};

function getDefaultConfig(options: Config) {
  const cfg = { ...defaultOptions, ...options };

  if (!cfg.origin) {
    throw new Error("CORS middleware requires an origin option");
  }

  if (!cfg.methods) {
    throw new Error("CORS middleware requires a methods option");
  }

  if (!cfg.allowedHeaders) {
    throw new Error("CORS middleware requires a allowedHeaders option");
  }

  if (!cfg.credentials) {
    throw new Error("CORS middleware requires a credentials option");
  }

  if (!cfg.maxAge) {
    throw new Error("CORS middleware requires a maxAge option");
  }

  if (
    typeof cfg.origin !== "string" &&
    !Array.isArray(cfg.origin) &&
    !(cfg.origin instanceof RegExp) &&
    typeof cfg.origin !== "function"
  ) {
    throw new Error(
      "CORS origin option must be a string, array, regular expression, or function"
    );
  }

  if (!Array.isArray(cfg.methods) && typeof cfg.methods !== "string") {
    throw new Error("CORS methods option must be an array or a string");
  }

  if (
    !Array.isArray(cfg.allowedHeaders) &&
    typeof cfg.allowedHeaders !== "string"
  ) {
    throw new Error("CORS allowedHeaders option must be an array");
  }

  if (
    cfg.exposedHeaders &&
    !Array.isArray(cfg.exposedHeaders) &&
    typeof cfg.exposedHeaders !== "string"
  ) {
    throw new Error("CORS exposedHeaders option must be an array");
  }

  if (typeof cfg.credentials !== "boolean") {
    throw new Error("CORS credentials option must be a boolean");
  }

  if (typeof cfg.maxAge !== "number") {
    throw new Error("CORS maxAge option must be a number");
  }

  return cfg;
}

function allowedOrigin(
  ctx: Context,
  origin: string,
  allowedOrigin: string | string[] | RegExp | ((ctx: Context) => boolean)
): string {
  if (typeof allowedOrigin === "function" && allowedOrigin(ctx)) {
    return origin;
  } else if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.find((o) => o === origin) || "";
  } else if (allowedOrigin === "*") {
    return "*";
  } else if (typeof allowedOrigin === "string") {
    return allowedOrigin;
  } else if (allowedOrigin instanceof RegExp && !!origin.match(allowedOrigin)) {
    return origin;
  }

  return "";
}

export function CORS(config: Config = {}) {
  const corsConfig = getDefaultConfig(config);

  let exposedHeadersStr = "";
  if (corsConfig.exposedHeaders) {
    if (Array.isArray(corsConfig.exposedHeaders)) {
      exposedHeadersStr = corsConfig.exposedHeaders.join(",");
    } else {
      exposedHeadersStr = corsConfig.exposedHeaders;
    }
  }

  let methodsStr = "";
  if (corsConfig.methods) {
    if (Array.isArray(corsConfig.methods)) {
      methodsStr = corsConfig.methods.join(",");
    } else {
      methodsStr = corsConfig.methods;
    }
  }

  let allowedHeadersStr = "";
  if (corsConfig.allowedHeaders) {
    if (Array.isArray(corsConfig.allowedHeaders)) {
      allowedHeadersStr = corsConfig.allowedHeaders.join(",");
    } else {
      allowedHeadersStr = corsConfig.allowedHeaders;
    }
  }

  return function cors(ctx: Context) {
    const reqOrigin = ctx.get(HTTPHeaders.Origin);
    if (!reqOrigin) {
      return ctx.next();
    }

    const origin = allowedOrigin(ctx, reqOrigin, corsConfig.origin!);
    if (ctx.method !== HTTPMethod.OPTIONS) {
      ctx.append(HTTPHeaders.Vary, HTTPHeaders.Origin);
      ctx.set(HTTPHeaders.AccessControlAllowOrigin, origin);
      if (corsConfig.credentials) {
        ctx.set(HTTPHeaders.AccessControlAllowCredentials, "true");
      }

      if (corsConfig.exposedHeaders) {
        ctx.set(HTTPHeaders.AccessControlExposeHeaders, exposedHeadersStr);
      }
      return ctx.next();
    }

    // Preflight Request
    ctx.append(HTTPHeaders.Vary, HTTPHeaders.Origin);
    ctx.append(HTTPHeaders.Vary, HTTPHeaders.AccessControlRequestMethod);
    ctx.append(HTTPHeaders.Vary, HTTPHeaders.AccessControlRequestHeaders);
    ctx.set(HTTPHeaders.AccessControlAllowMethods , methodsStr);
    ctx.set(HTTPHeaders.AccessControlAllowHeaders, origin);

    if (corsConfig.credentials) {
      ctx.set(HTTPHeaders.AccessControlAllowCredentials, "true");
    }

    if (corsConfig.maxAge && corsConfig.maxAge > 0) {
      ctx.set(HTTPHeaders.AccessControlMaxAge, String(corsConfig.maxAge));
    }

    if (corsConfig.allowedHeaders) {
      ctx.set(HTTPHeaders.AccessControlAllowHeaders, allowedHeadersStr);
    } else {
      ctx.set(HTTPHeaders.AccessControlAllowHeaders,
        ctx.get(HTTPHeaders.AccessControlRequestHeaders) || ""
      );
    }

    return ctx.status(StatusCode.NO_CONTENT);
  };
}
