import { jest } from "bun:test";
import { Context } from "../src";
import { HttpMethod } from "../src/utils";

export const createContextMock = (method: HttpMethod) => {
  const statusMock = jest.fn();
  const jsonMock = jest.fn();
  const getResWithoutBodyMock = jest.fn();
  const resMock = {} as Response;
  const context = {
    method,
    status: (param: number) => {
      statusMock(param);
      return context;
    },
    getResWithoutBody: () => {
      getResWithoutBodyMock();
      return context;
    },
    json: (param: unknown, status: number) => {
      jsonMock(param, status);
      return context;
    },
    res: resMock,
  } as unknown as Context;

  return {
    context,
    statusMock,
    jsonMock,
    getResWithoutBodyMock,
    resMock,
  };
};
