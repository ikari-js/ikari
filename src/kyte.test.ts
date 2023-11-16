/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe } from "bun:test";
import { createPath } from "./utils";
import { ServeValidator } from "./serve-validator";

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

  test("checkControllersIsArray", () => {
    expect(() => {
      new ServeValidator({ controllers: null as any }).validate();
    }).toThrow("Controllers must be an array");
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
        port: "null" as any,
      }).validate();
    }).toThrow("Port must be a number");
  });

  test("checkHostnameIsString", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        hostname: 1 as any,
      }).validate();
    }).toThrow("Hostname must be a string");
  });

  test("checkBunServeOptionsIsObject", () => {
    expect(() => {
      new ServeValidator({
        controllers: [{ prototype: {} }],
        bunServeOptions: "null" as any,
      }).validate();
    }).toThrow("BunServeOptions must be an object");
  });
});
