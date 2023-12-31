import { Context, Handler } from "../..";
import { LiteralUnionStr } from "../../types";

export type Config = {
  /**
   * Content Security Policy
   * @default undefined
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
   */
  ContentSecurityPolicy?: LiteralUnionStr<"default-src 'self'">;
  /**
   * Content Security Policy Report Only
   * @default false
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only
   */
  CSPReportOnly?: boolean;
  /**
   * X-XSS-Protection
   * @default "0"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
   */
  XSSProtection?: LiteralUnionStr<"0" | "1" | "1; mode=block">;
  /**
   * X-Content-Type-Options
   * @default "nosniff"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
   */
  ContentTypeNosniff?: "nosniff" | "none";
  /**
   * X-Frame-Options
   * @default "SAMEORIGIN"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
   */
  XFrameOptions?: LiteralUnionStr<"SAMEORIGIN" | "DENY">;
  /**
   * Strict-Transport-Security
   * @default undefined
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
   */
  HSTSMaxAge?: number;
  /**
   * Strict-Transport-Security
   * @default false
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
   */
  HSTSExcludeSubdomains?: boolean;
  /**
   * Strict-Transport-Security
   * @default false
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
   */
  HSTSPreloadEnabled?: boolean;
  /**
   * Referrer-Policy
   * @default "no-referrer"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
   */
  ReferrerPolicy?: LiteralUnionStr<
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
  >;
  PermissionPolicy?: string;
  /**
   * Cross-Origin-Embedder-Policy
   * @default "require-corp"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy
   */
  CrossOriginEmbedderPolicy?: LiteralUnionStr<
    "require-corp" | "unsafe-none" | "credentialless"
  >;
  /**
   * Cross-Origin-Opener-Policy
   * @default "same-origin"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
   */
  CrossOriginOpenerPolicy?: LiteralUnionStr<
    "unsafe-none" | "same-origin" | "same-origin-allow-popups"
  >;
  /**
   * Cross-Origin-Resource-Policy
   * @default "same-origin"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy
   */
  CrossOriginResourcePolicy?: LiteralUnionStr<
    "same-origin" | "cross-origin" | "same-site"
  >;
  /**
   * Origin-Agent-Cluster
   * @default "?1"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin-Agent-Cluster
   */
  OriginAgentCluster?: "?1" | "?0";
};

const defaultConfig: Config = {
  XSSProtection: "0",
  ContentTypeNosniff: "nosniff",
  XFrameOptions: "SAMEORIGIN",
  HSTSMaxAge: 0,
  ReferrerPolicy: "no-referrer",
  CrossOriginEmbedderPolicy: "require-corp",
  CrossOriginOpenerPolicy: "same-origin",
  CrossOriginResourcePolicy: "same-origin",
  OriginAgentCluster: "?1",
};

function getDefaultConfig(config: Config): Config {
  return { ...defaultConfig, ...config };
}

export function helmet(config: Config = {}): Handler {
  const helmetConfig = getDefaultConfig(config);

  return (ctx: Context) => {
    if (helmetConfig.ContentSecurityPolicy) {
      if (helmetConfig.CSPReportOnly) {
        ctx.set(
          "Content-Security-Policy-Report-Only",
          helmetConfig.ContentSecurityPolicy
        );
      } else {
        ctx.set("Content-Security-Policy", helmetConfig.ContentSecurityPolicy);
      }
    }

    if (helmetConfig.XSSProtection) {
      ctx.set("X-XSS-Protection", helmetConfig.XSSProtection);
    }

    if (helmetConfig.ContentTypeNosniff) {
      ctx.set("X-Content-Type-Options", helmetConfig.ContentTypeNosniff);
    }

    if (helmetConfig.XFrameOptions) {
      ctx.set("X-Frame-Options", helmetConfig.XFrameOptions);
    }

    if (helmetConfig.HSTSMaxAge && helmetConfig.HSTSMaxAge > 0 && ctx.secure) {
      ctx.set(
        "Strict-Transport-Security",
        `max-age=${helmetConfig.HSTSMaxAge}${
          helmetConfig.HSTSExcludeSubdomains ? "; includeSubDomains" : ""
        }${helmetConfig.HSTSPreloadEnabled ? "; preload" : ""}`
      );
    }

    if (helmetConfig.ReferrerPolicy) {
      ctx.set("Referrer-Policy", helmetConfig.ReferrerPolicy);
    }

    if (helmetConfig.PermissionPolicy) {
      ctx.set("Permissions-Policy", helmetConfig.PermissionPolicy);
    }

    if (helmetConfig.CrossOriginEmbedderPolicy) {
      ctx.set(
        "Cross-Origin-Embedder-Policy",
        helmetConfig.CrossOriginEmbedderPolicy
      );
    }

    if (helmetConfig.CrossOriginOpenerPolicy) {
      ctx.set(
        "Cross-Origin-Opener-Policy",
        helmetConfig.CrossOriginOpenerPolicy
      );
    }

    if (helmetConfig.CrossOriginResourcePolicy) {
      ctx.set(
        "Cross-Origin-Resource-Policy",
        helmetConfig.CrossOriginResourcePolicy
      );
    }

    if (helmetConfig.OriginAgentCluster) {
      ctx.set("Origin-Agent-Cluster", helmetConfig.OriginAgentCluster);
    }

    return ctx.next();
  };
}
