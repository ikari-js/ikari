/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe } from "bun:test";
import { createPath } from "./utils";
import { ServeValidator } from "./serve-validator";
import { After, Before, Controller, Get, Post } from "./decorators";
import "reflect-metadata";
import { Route } from ".";
import { Put } from "./decorators/put";

test("createPath", () => {
  expect(createPath("test")).toBe("/test");
  expect(createPath("/test")).toBe("/test");
  expect(createPath("")).toBe("/");
  expect(createPath("/")).toBe("/");
});

describe("ServeValidator", () => {
  test("checkConfigIsObject", () => {
    expect(() => {
      new ServeValidator(null as any).validate();
    }).toThrow("Config must be an Config object");
  });

  test("checkControllersIsNotEmpty", () => {
    expect(() => {
      new ServeValidator({ controllers: [] }).validate();
    }).toThrow("Controllers must not be empty");
  });

  test("checkGroupsIsArray", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        groups: "null" as any,
      }).validate();
    }).toThrow("Groups must be an array");
  });

  test("checkMiddlewaresIsArray", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        middlewares: "null" as any,
      }).validate();
    }).toThrow("Middlewares must be an array");
  });

  test("checkLoggerIsObject", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        logger: "null" as any,
      }).validate();
    }).toThrow("Logger must be an object");
  });

  test("checkErrorHandlerIsFunction", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        errorHandler: "null" as any,
      }).validate();
    }).toThrow("ErrorHandler must be a function");
  });

  test("checkPortIsNumber", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        serveOptions: { port: "null" },
      }).validate();
    }).toThrow("Port must be a number");
  });

  test("checkHostnameIsString", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        serveOptions: { hostname: 1 as any },
      }).validate();
    }).toThrow("Hostname must be a string");
  });

  test("checkBunServeOptionsIsObject", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        serveOptions: "null" as any,
      }).validate();
    }).toThrow("BunServeOptions must be an object");
  });

  test("checkPrefixIsString", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        prefix: 1 as any,
      }).validate();
    }).toThrow("Prefix must be a string");
  });

  test("checkGroupsOrControllersIsNotEmpty", () => {
    expect(() => {
      new ServeValidator({}).validate();
    }).toThrow("Either groups or controllers must be provided");
  });
});

test("Get Decorator", () => {
  @Controller("/")
  class Test {
    @Get()
    public get() {}

    @Get("/test")
    public get1() {}

    @Get("/test/:id")
    public get2() {}

    @Get("/test/:id/:name")
    @Before(() => {})
    public get3() {}

    @Get("/test/:id/:name")
    @After(() => {})
    public get4() {}

    @Get("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public get5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/get",
      fnName: "get",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "get1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "get2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "get3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "get4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "get5",
      hasParams: true,
      afterCount: 1,
      beforeCount: 1,
    },
  ];
  const routes = Reflect.getMetadata("routes", test) as Route[];
  expect(typeof routes).toBe("object");
  expect(routes.length).toBe(expectedValues.length);

  for (let i = 0; i < routes.length; i++) {
    const expected = expectedValues[i];
    const route = routes[i];
    expect(route.after.length).toBe(expected.afterCount);
    expect(route.before.length).toBe(expected.beforeCount);
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
  }
});
