import { Context } from "../..";
import { HttpMethod, StatusCode } from "../../utils";

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

export type CorsOptions = {
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

function defaultOptions(options: CorsOptions) {
  const corsOptions: CorsOptions = {
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    maxAge: 5,
  };

  return {
    ...corsOptions,
    ...options,
  };
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

export function CORS(options: CorsOptions = {}) {
  const corsOptions = defaultOptions(options);

  let exposedHeadersStr = "";
  if (corsOptions.exposedHeaders) {
    if (Array.isArray(corsOptions.exposedHeaders)) {
      exposedHeadersStr = corsOptions.exposedHeaders.join(",");
    } else {
      exposedHeadersStr = corsOptions.exposedHeaders;
    }
  }

  let methodsStr = "";
  if (corsOptions.methods) {
    if (Array.isArray(corsOptions.methods)) {
      methodsStr = corsOptions.methods.join(",");
    } else {
      methodsStr = corsOptions.methods;
    }
  }

  let allowedHeadersStr = "";
  if (corsOptions.allowedHeaders) {
    if (Array.isArray(corsOptions.allowedHeaders)) {
      allowedHeadersStr = corsOptions.allowedHeaders.join(",");
    } else {
      allowedHeadersStr = corsOptions.allowedHeaders;
    }
  }

  return function cors(ctx: Context) {
    const reqOrigin = ctx.get("Origin");
    if (!reqOrigin) {
      return ctx.next();
    }

    const origin = allowedOrigin(ctx, reqOrigin, corsOptions.origin!);
    if (ctx.method !== HttpMethod.OPTIONS) {
      ctx.append("Vary", "Origin");
      ctx.set("Access-Control-Allow-Origin", origin);
      if (corsOptions.credentials) {
        ctx.set("Access-Control-Allow-Credentials", "true");
      }

      if (corsOptions.exposedHeaders) {
        ctx.set("Access-Control-Expose-Headers", exposedHeadersStr);
      }
      return ctx.next();
    }

    // Preflight Request
    ctx.append("Vary", "Origin");
    ctx.append("Vary", "Access-Control-Request-Method");
    ctx.append("Vary", "Access-Control-Request-Headers");
    ctx.set("Access-Control-Allow-Methods", methodsStr);
    ctx.set("Access-Control-Allow-Origin", origin);

    if (corsOptions.credentials) {
      ctx.set("Access-Control-Allow-Credentials", "true");
    }

    if (corsOptions.maxAge && corsOptions.maxAge > 0) {
      ctx.set("Access-Control-Max-Age", String(corsOptions.maxAge));
    }

    if (corsOptions.allowedHeaders) {
      ctx.set("Access-Control-Allow-Headers", allowedHeadersStr);
    } else {
      ctx.set(
        "Access-Control-Allow-Headers",
        ctx.get("Access-Control-Request-Headers") || ""
      );
    }

    return ctx.status(StatusCode.NO_CONTENT);
  };
}
