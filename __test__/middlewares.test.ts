import { expect, describe, test } from "bun:test";
import { Context, Config, Serve } from "../src";
import { Controller, Get } from "../src/decorators";
import { helmet } from "../src/middlewares/helmet";
import { HTTPMethod, StatusCode } from "../src/utils";

describe("Helmet", () => {
  test("Helmet should be work", async () => {
    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      middlewares: [
        helmet({
          ContentSecurityPolicy: "default-src 'self'",
          ContentTypeNosniff: "none",
          CrossOriginEmbedderPolicy: "require-corp",
          CrossOriginOpenerPolicy: "same-origin",
          CrossOriginResourcePolicy: "same-origin",
          CSPReportOnly: false,
          XFrameOptions: "SAMEORIGIN",
          ReferrerPolicy: "same-origin",
          XSSProtection: "1",
        }),
      ],
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HTTPMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          "content-security-policy": "default-src 'self'",
          "x-content-type-options": "none",
          "cross-origin-embedder-policy": "require-corp",
          "cross-origin-opener-policy": "same-origin",
          "cross-origin-resource-policy": "same-origin",
          "x-frame-options": "SAMEORIGIN",
          "referrer-policy": "same-origin",
          "x-xss-protection": "1",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)?.replace(/\s/g, "")).toBe(
          value.replace(/\s/g, "")
        );
      });
    }

    serve.stop();
  });

  test("Helmet should be work with default options", async () => {
    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      middlewares: [helmet()],
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HTTPMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          "x-content-type-options": "nosniff",
          "x-frame-options": "SAMEORIGIN",
          "x-xss-protection": "0",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)?.replace(/\s/g, "")).toBe(
          value.replace(/\s/g, "")
        );
      });
    }

    serve.stop();
  });

  test("Helmet should be work with default options and CSPReportOnly true", async () => {
    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      middlewares: [helmet({ CSPReportOnly: true })],
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HTTPMethod.GET,
        statusCode: StatusCode.OK,
        headers: {},
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
        }
      );
      expect(res.status).toBe(expected.statusCode);
      expect(res.headers.get("content-security-policy-report-only")).toBeNull();
    }

    serve.stop();
  });
});

// TODO middleware type check
// TODO locals delete and clear test
// TODO CORS test
// TODO add requestId test
// TODO add logger test
