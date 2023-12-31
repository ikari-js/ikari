/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, jest } from "bun:test";
import {
  HttpMethod,
  NotFound,
  StatusCode,
  createPath,
  defaultErrorHandler,
  getRoutesFromControllers,
  getRoutesFromGroups,
  returnContextResponse,
} from "../src/utils";
import { ServeValidator } from "../src/serve-validator";
import {
  After,
  Before,
  Controller,
  Get,
  Head,
  Post,
  Delete,
  Put,
  Patch,
  Options,
  All,
} from "../src/decorators";
import "reflect-metadata";
import { Config, Context, Route, Serve } from "../src";
import { unlinkSync } from "node:fs";
import { Errorlike } from "bun";
import { helmet } from "../src/middlewares/helmet";

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
        groups: "null" as any,
      }).validate();
    }).toThrow("Groups must be an array");
  });

  test("checkMiddlewaresIsArray", () => {
    expect(() => {
      new ServeValidator({
        middlewares: "null" as any,
      }).validate();
    }).toThrow("Middlewares must be an array");
  });

  test("checkErrorHandlerIsFunction", () => {
    expect(() => {
      new ServeValidator({
        errorHandler: "null" as any,
      }).validate();
    }).toThrow("ErrorHandler must be a function");
  });

  test("checkPortIsNumber", () => {
    expect(() => {
      new ServeValidator({
        serveOptions: { port: "null" },
      }).validate();
    }).toThrow("Port must be a number");
  });

  test("checkHostnameIsString", () => {
    expect(() => {
      new ServeValidator({
        serveOptions: { hostname: 1 as any },
      }).validate();
    }).toThrow("Hostname must be a string");
  });

  test("checkBunServeOptionsIsObject", () => {
    expect(() => {
      new ServeValidator({
        serveOptions: "null" as any,
      }).validate();
    }).toThrow("BunServeOptions must be an object");
  });

  test("checkPrefixIsString", () => {
    expect(() => {
      new ServeValidator({
        prefix: 1 as any,
      }).validate();
    }).toThrow("Prefix must be a string");
  });

  test("checkGroupsOrControllersIsNotEmpty", () => {
    expect(() => {
      new ServeValidator({}).validate();
    }).toThrow("Either groups or controllers must be provided");
  });

  test("checkStrictIsBoolean", () => {
    expect(() => {
      @Controller("/")
      class Test {
        @Get()
        public get() {}
      }

      new ServeValidator({
        controllers: [Test],
        strict: "null" as any,
      }).validate();
    }).toThrow("Strict must be a boolean");
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.GET);
  }
});

test("Post Decorator", () => {
  @Controller("/")
  class Test {
    @Post()
    public post() {}

    @Post("/test")
    public post1() {}

    @Post("/test/:id")
    public post2() {}

    @Post("/test/:id/:name")
    @Before(() => {})
    public post3() {}

    @Post("/test/:id/:name")
    @After(() => {})
    public post4() {}

    @Post("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public post5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/post",
      fnName: "post",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "post1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "post2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "post3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "post4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "post5",
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.POST);
  }
});

test("Put Decorator", () => {
  @Controller("/")
  class Test {
    @Put()
    public put() {}

    @Put("/test")
    public put1() {}

    @Put("/test/:id")
    public put2() {}

    @Put("/test/:id/:name")
    @Before(() => {})
    public put3() {}

    @Put("/test/:id/:name")
    @After(() => {})
    public put4() {}

    @Put("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public put5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/put",
      fnName: "put",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "put1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "put2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "put3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "put4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "put5",
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.PUT);
  }
});

test("Delete Decorator", () => {
  @Controller("/")
  class Test {
    @Delete()
    public delete() {}

    @Delete("/test")
    public delete1() {}

    @Delete("/test/:id")
    public delete2() {}

    @Delete("/test/:id/:name")
    @Before(() => {})
    public delete3() {}

    @Delete("/test/:id/:name")
    @After(() => {})
    public delete4() {}

    @Delete("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public delete5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/delete",
      fnName: "delete",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "delete1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "delete2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "delete3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "delete4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "delete5",
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.DELETE);
  }
});

test("Head Decorator", () => {
  @Controller("/")
  class Test {
    @Head()
    public head() {}

    @Head("/test")
    public head1() {}

    @Head("/test/:id")
    public head2() {}

    @Head("/test/:id/:name")
    @Before(() => {})
    public head3() {}

    @Head("/test/:id/:name")
    @After(() => {})
    public head4() {}

    @Head("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public head5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/head",
      fnName: "head",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "head1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "head2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "head3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "head4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "head5",
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.HEAD);
  }
});

test("Patch Decorator", () => {
  @Controller("/")
  class Test {
    @Patch()
    public patch() {}

    @Patch("/test")
    public patch1() {}

    @Patch("/test/:id")
    public patch2() {}

    @Patch("/test/:id/:name")
    @Before(() => {})
    public patch3() {}

    @Patch("/test/:id/:name")
    @After(() => {})
    public patch4() {}

    @Patch("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public patch5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/patch",
      fnName: "patch",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "patch1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "patch2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "patch3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "patch4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "patch5",
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.PATCH);
  }
});

test("Options Decorator", () => {
  @Controller("/")
  class Test {
    @Options()
    public options() {}

    @Options("/test")
    public options1() {}

    @Options("/test/:id")
    public options2() {}

    @Options("/test/:id/:name")
    @Before(() => {})
    public options3() {}

    @Options("/test/:id/:name")
    @After(() => {})
    public options4() {}

    @Options("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public options5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/options",
      fnName: "options",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "options1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "options2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "options3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "options4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "options5",
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.OPTIONS);
  }
});

test("Controller Decorator", () => {
  @Controller("/")
  class Test {
    @Get()
    public get() {}

    @Before(() => {})
    @After(() => {})
    @Get("/test-get")
    public get1() {}

    @Before(() => {})
    @Get("/test-get-2")
    public get2() {}

    @After(() => {})
    @Get("/test-get-3")
    public get3() {}

    @Get("/test-4/:id")
    public get4() {}

    @Post()
    public post() {}

    @Post("/test-post")
    public post1() {}

    @Post("/test-post-2/:id")
    public post2() {}

    @Post("/test-post-3")
    @Before(() => {})
    public post3() {}

    @Post("/test-post-4")
    @After(() => {})
    public post4() {}

    @Post("/test-post-5")
    @Before(() => {})
    @After(() => {})
    public post5() {}

    @Put()
    public put() {}

    @Put("/test-put")
    public put1() {}

    @Put("/test-put-2/:id")
    public put2() {}

    @Put("/test-put-3")
    @Before(() => {})
    public put3() {}

    @Put("/test-put-4")
    @After(() => {})
    public put4() {}

    @Put("/test-put-5")
    @Before(() => {})
    @After(() => {})
    public put5() {}

    @Delete()
    public delete() {}

    @Delete("/test-delete")
    public delete1() {}

    @Delete("/test-delete-2/:id")
    public delete2() {}

    @Delete("/test-delete-3")
    @Before(() => {})
    public delete3() {}

    @Delete("/test-delete-4")
    @After(() => {})
    public delete4() {}

    @Delete("/test-delete-5")
    @Before(() => {})
    @After(() => {})
    public delete5() {}

    @Head()
    public head() {}

    @Head("/test-head")
    public head1() {}

    @Head("/test-head-2/:id")
    public head2() {}

    @Head("/test-head-3")
    @Before(() => {})
    public head3() {}

    @Head("/test-head-4")
    @After(() => {})
    public head4() {}

    @Head("/test-head-5")
    @Before(() => {})
    @After(() => {})
    public head5() {}

    @Patch()
    public patch() {}

    @Patch("/test-patch")
    public patch1() {}

    @Patch("/test-patch-2/:id")
    public patch2() {}

    @Patch("/test-patch-3")
    @Before(() => {})
    public patch3() {}

    @Patch("/test-patch-4")
    @After(() => {})
    public patch4() {}

    @Patch("/test-patch-5")
    @Before(() => {})
    @After(() => {})
    public patch5() {}

    @Options()
    public options() {}

    @Options("/test-options")
    public options1() {}

    @Options("/test-options-2/:id")
    public options2() {}

    @Options("/test-options-3")
    @Before(() => {})
    public options3() {}

    @Options("/test-options-4")
    @After(() => {})
    public options4() {}

    @Options("/test-options-5")
    @Before(() => {})
    @After(() => {})
    public options5() {}
  }

  const test = new Test();
  const routes = Reflect.getMetadata("routes", test) as Route[];

  const expectedValues = {
    GET: {
      count: 5,
      paths: ["/get", "/test-get", "/test-get-2", "/test-get-3", "/test-4/:id"],
      fnNames: ["get", "get1", "get2", "get3", "get4"],
      afterCount: [0, 1, 0, 1, 0],
      beforeCount: [0, 1, 1, 0, 0],
      hasParams: [false, false, false, false, true],
    },
    POST: {
      count: 6,
      paths: [
        "/post",
        "/test-post",
        "/test-post-2/:id",
        "/test-post-3",
        "/test-post-4",
        "/test-post-5",
      ],
      fnNames: ["post", "post1", "post2", "post3", "post4", "post5"],
      afterCount: [0, 0, 0, 0, 1, 1],
      beforeCount: [0, 0, 0, 1, 0, 1],
      hasParams: [false, false, true, false, false, false],
    },
    PUT: {
      count: 6,
      paths: [
        "/put",
        "/test-put",
        "/test-put-2/:id",
        "/test-put-3",
        "/test-put-4",
        "/test-put-5",
      ],
      fnNames: ["put", "put1", "put2", "put3", "put4", "put5"],
      afterCount: [0, 0, 0, 0, 1, 1],
      beforeCount: [0, 0, 0, 1, 0, 1],
      hasParams: [false, false, true, false, false, false],
    },
    DELETE: {
      count: 6,
      paths: [
        "/delete",
        "/test-delete",
        "/test-delete-2/:id",
        "/test-delete-3",
        "/test-delete-4",
        "/test-delete-5",
      ],
      fnNames: [
        "delete",
        "delete1",
        "delete2",
        "delete3",
        "delete4",
        "delete5",
      ],
      afterCount: [0, 0, 0, 0, 1, 1],
      beforeCount: [0, 0, 0, 1, 0, 1],
      hasParams: [false, false, true, false, false, false],
    },
    HEAD: {
      count: 6,
      paths: [
        "/head",
        "/test-head",
        "/test-head-2/:id",
        "/test-head-3",
        "/test-head-4",
        "/test-head-5",
      ],
      fnNames: ["head", "head1", "head2", "head3", "head4", "head5"],
      afterCount: [0, 0, 0, 0, 1, 1],
      beforeCount: [0, 0, 0, 1, 0, 1],
      hasParams: [false, false, true, false, false, false],
    },

    PATCH: {
      count: 6,
      paths: [
        "/patch",
        "/test-patch",
        "/test-patch-2/:id",
        "/test-patch-3",
        "/test-patch-4",
        "/test-patch-5",
      ],
      fnNames: ["patch", "patch1", "patch2", "patch3", "patch4", "patch5"],
      afterCount: [0, 0, 0, 0, 1, 1],
      beforeCount: [0, 0, 0, 1, 0, 1],
      hasParams: [false, false, true, false, false, false],
    },
    OPTIONS: {
      count: 6,
      paths: [
        "/options",
        "/test-options",
        "/test-options-2/:id",
        "/test-options-3",
        "/test-options-4",
        "/test-options-5",
      ],
      fnNames: [
        "options",
        "options1",
        "options2",
        "options3",
        "options4",
        "options5",
      ],
      afterCount: [0, 0, 0, 0, 1, 1],
      beforeCount: [0, 0, 0, 1, 0, 1],
      hasParams: [false, false, true, false, false, false],
    },
  };

  expect(typeof routes).toBe("object");
  expect(routes.length).toBe(
    Object.entries(expectedValues)
      .map((e) => e[1].count)
      .reduce((a, b) => a + b, 0)
  );

  for (const [method, expected] of Object.entries(expectedValues)) {
    const routesForMethod = routes.filter((e) => e.method === method);
    expect(routesForMethod.length).toBe(expected.count);

    for (let i = 0; i < routesForMethod.length; i++) {
      const route = routesForMethod[i];
      expect(route.after.length).toBe(expected.afterCount[i]);
      expect(route.before.length).toBe(expected.beforeCount[i]);
      expect(route.path).toBe(expected.paths[i]);
      expect(route.fnName).toBe(expected.fnNames[i]);
      expect(route.pathHasParams).toBe(expected.hasParams[i]);
      expect(route.method).toBe(method);
    }
  }
});

test("All Decorator", () => {
  @Controller("/")
  class Test {
    @All()
    public all() {}

    @All("/test")
    public all1() {}

    @All("/test/:id")
    public all2() {}

    @All("/test/:id/:name")
    @Before(() => {})
    public all3() {}

    @All("/test/:id/:name")
    @After(() => {})
    public all4() {}

    @All("/test/:id/:name")
    @Before(() => {})
    @After(() => {})
    public all5() {}
  }

  const test = new Test();

  const expectedValues = [
    {
      path: "/all",
      fnName: "all",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test",
      fnName: "all1",
      hasParams: false,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id",
      fnName: "all2",
      hasParams: true,
      afterCount: 0,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "all3",
      hasParams: true,
      afterCount: 0,
      beforeCount: 1,
    },
    {
      path: "/test/:id/:name",
      fnName: "all4",
      hasParams: true,
      afterCount: 1,
      beforeCount: 0,
    },
    {
      path: "/test/:id/:name",
      fnName: "all5",
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
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe(HttpMethod.ALL);
  }
});

test("Controller Decorator with prefix", () => {
  @Controller("/test")
  class Test {
    @Get()
    public get() {}
  }

  const test = new Test();
  const routes = Reflect.getMetadata("routes", test) as Route[];

  expect(typeof routes).toBe("object");
  expect(routes.length).toBe(1);
  expect(routes[0].path).toBe("/test/get");
});

test("Controller Decorator with prefix backslash at the end", () => {
  @Controller("/test/")
  class Test {
    @Get()
    public get() {}
  }

  const test = new Test();
  const routes = Reflect.getMetadata("routes", test) as Route[];

  expect(typeof routes).toBe("object");
  expect(routes.length).toBe(1);
  expect(routes[0].path).toBe("/test/get");
});

test("Controller Decorator with prefix and path", () => {
  @Controller("/test")
  class Test {
    @Get("/get")
    public get() {}
  }

  const test = new Test();
  const routes = Reflect.getMetadata("routes", test) as Route[];

  expect(typeof routes).toBe("object");
  expect(routes.length).toBe(1);
  expect(routes[0].path).toBe("/test/get");
});

test("Before Decorator", () => {
  function before() {}
  function before1() {}

  @Controller("/")
  class Test {
    @Get("/test/:id")
    @Before(before, before1)
    public get3() {}
  }

  const test = new Test();
  const routes = Reflect.getMetadata("routes", test) as Route[];

  expect(typeof routes).toBe("object");
  expect(routes.length).toBe(1);

  const route = routes[0];
  expect(route.before.length).toBe(2);
  expect(route.before[0]).toBe(before);
  expect(route.before[1]).toBe(before1);
});

test("After Decorator", () => {
  function after() {}
  function after1() {}

  @Controller("/")
  class Test {
    @Get("/test/:id")
    @After(after, after1)
    public get3() {}
  }

  const test = new Test();
  const routes = Reflect.getMetadata("routes", test) as Route[];

  expect(typeof routes).toBe("object");
  expect(routes.length).toBe(1);

  const route = routes[0];
  expect(route.after.length).toBe(2);
  expect(route.after[0]).toBe(after);
  expect(route.after[1]).toBe(after1);
});

test("Context ", async () => {
  @Controller("/")
  class Test {
    @Get("/get")
    public get(ctx: Context) {
      return ctx.json({ test: "test" });
    }

    @Get("/get-withparams/:id/:name")
    public getWithParams(ctx: Context) {
      return ctx.json({ id: ctx.param("id"), name: ctx.param("name") });
    }

    @Get("/get-withquery")
    public getWithQuery(ctx: Context) {
      return ctx.json({ id: ctx.query("id"), name: ctx.query("name") });
    }

    @Get("/get-with-query-and-params/:id/:name")
    public getWithQueryAndParams(ctx: Context) {
      return ctx.json({
        id: ctx.query("id"),
        name: ctx.query("name"),
        idParam: ctx.param("id"),
        nameParam: ctx.param("name"),
      });
    }

    @Get("/get-return-string")
    public getReturnString(ctx: Context) {
      return ctx.string("test");
    }

    @Get("/get-return-buffer")
    public getReturnBuffer(ctx: Context) {
      return ctx.buffer(Buffer.from("test"));
    }

    @Get("/get-return-stream")
    public async getReturnStream(ctx: Context) {
      // create temporary file
      const filePath = import.meta.dir + "/test-file";
      await Bun.write(filePath, "test");
      const f = Bun.file(filePath);
      ctx.stream(f.stream());
      setTimeout(() => {
        unlinkSync(filePath);
      }, 0);
    }

    @Get("/get-return-raw")
    public getReturnRaw(ctx: Context) {
      return ctx.raw(new Response("test"));
    }

    @Get("/get-return-statuscode")
    public getReturnStatusCode(ctx: Context) {
      return ctx.status(StatusCode.ACCEPTED).string("test");
    }

    @Get("/get-return-redirect-in-app")
    public getReturnRedirect(ctx: Context) {
      return ctx.redirect("/get");
    }

    @Get("/get-cookie")
    public getCookie(ctx: Context) {
      ctx.setCookie("test", { value: "test" });
      return ctx.json({});
    }

    @Get("/get-append")
    public getAppend(ctx: Context) {
      ctx.append("test", "test");
      ctx.append("test", "test2");
      return ctx.json({});
    }

    @Get("/get-set")
    public getSet(ctx: Context) {
      ctx.set("test", "test");
      return ctx.json({});
    }

    @Get("/get-get")
    public getGet(ctx: Context) {
      return ctx.json({ test: ctx.get("test") });
    }

    @Get("/get-locals")
    @Before((ctx: Context) => {
      ctx.locals.set("test", "test-local");
      ctx.next();
    })
    public getLocals(ctx: Context) {
      return ctx.json({
        value: ctx.locals.get("test"),
        has: ctx.locals.has("test"),
      });
    }

    @Get("/get-get-cookie")
    public getGetCookie(ctx: Context) {
      return ctx.json({ test: ctx.cookie("test") });
    }

    @Get("/get-set-cookie")
    public getSetCookie(ctx: Context) {
      ctx.setCookie("test", { value: "test" });
      return ctx.json({});
    }

    @Get("/get-ip")
    public getIp(ctx: Context) {
      return ctx.json({ ip: ctx.ip() });
    }

    @Get("/get-authorization")
    public getAuthorization(ctx: Context) {
      return ctx.json({ authorization: ctx.authorization() });
    }

    @Get("/get-url")
    public getUrl(ctx: Context) {
      return ctx.json({ url: ctx.url });
    }

    @Get("/get-queries")
    public getQueries(ctx: Context) {
      return ctx.json(ctx.queries());
    }

    @Get("/get-res-status")
    public getResStatus(ctx: Context) {
      ctx.status(StatusCode.NOT_FOUND);
      return ctx.json({ status: ctx.getStatus() });
    }

    @Get("/get-res-headers")
    public getResHeaders(ctx: Context) {
      ctx.set("test", "test");
      return ctx.json({ test: ctx.getResHeader("test") });
    }

    @Get("/get-res-without-body")
    public getResWithoutBody(ctx: Context) {
      ctx.status(StatusCode.NOT_FOUND);
      ctx.set("test", "test");
      ctx.setCookie("test", { value: "test" });
      ctx.append("test", "test2");
      ctx.set("test2", "test2");
      return ctx.getResWithoutBody();
    }

    @Post("/post-json")
    public async postJson(ctx: Context) {
      return ctx.json(await ctx.body());
    }

    @Get("/get-req-body")
    public async getReqBody(ctx: Context) {
      return ctx.json(await ctx.body());
    }

    @Post("/post-double-body")
    public async postDoubleBody(ctx: Context) {
      const body = await ctx.body();
      return ctx.json({ body: body, body2: await ctx.body() });
    }

    @Post("/post-body-without-content-type")
    public async postBodyWithoutContentType(ctx: Context) {
      return ctx.json(await ctx.body());
    }

    @Post("/post-body-form-data")
    public async postBodyFormData(ctx: Context) {
      const formData = (await ctx.body()) as FormData;
      const fields: Record<string, string> = {};
      for (const [key, value] of formData) {
        fields[key] = value.toString();
      }

      return ctx.json(fields);
    }

    @Post("/post-body-urlencoded")
    public async postBodyUrlencoded(ctx: Context) {
      const urlencoded = (await ctx.body()) as URLSearchParams;
      const fields: Record<string, string> = {};
      for (const [key, value] of urlencoded) {
        fields[key] = value.toString();
      }

      return ctx.json(fields);
    }

    @Post("/post-body-raw")
    public async postBodyRaw(ctx: Context) {
      return ctx.json(await ctx.body());
    }

    @Post("/post-body-stream")
    public async postBodyStream(ctx: Context) {
      const stream = (await ctx.body()) as ArrayBuffer;
      const buffer = Buffer.from(stream);
      return ctx.json({ test: buffer.toString() });
    }
  }

  const config: Config = {
    controllers: [Test],
    disableStartupMessage: true,
    serveOptions: {
      port: 0,
    },
  };

  const serve = Serve(config);
  const localIp =
    process.platform === "linux" && process.env.WSL_INTEROP
      ? "::ffff:127.0.0.1"
      : "::1";

  const expectedValues = [
    {
      path: "/get",
      method: HttpMethod.GET,
      bodyType: "json",
      body: { test: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-withparams/1/test",
      method: HttpMethod.GET,
      bodyType: "json",
      body: { id: "1", name: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-withquery?id=1&name=test",
      method: HttpMethod.GET,
      bodyType: "json",
      body: { id: "1", name: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-with-query-and-params/1/test?id=2&name=test2",
      method: HttpMethod.GET,
      bodyType: "json",
      body: { id: "2", name: "test2", idParam: "1", nameParam: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-string",
      method: HttpMethod.GET,
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-buffer",
      method: HttpMethod.GET,
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-stream",
      method: HttpMethod.GET,
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-raw",
      method: HttpMethod.GET,
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-statuscode",
      method: HttpMethod.GET,
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.ACCEPTED,
    },
    {
      path: "/get-return-redirect-in-app",
      method: HttpMethod.GET,
      bodyType: "text",
      body: '{"test":"test"}',
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-cookie",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        "set-cookie": "test=test;",
      },
      body: {},
    },
    {
      path: "/get-append",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        test: "test, test2",
      },
      body: {},
    },
    {
      path: "/get-set",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        test: "test",
      },
      body: {},
    },
    {
      path: "/get-get",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      reqHeaders: {
        test: "test",
      },
      body: { test: "test" },
    },
    {
      path: "/get-locals",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { value: "test-local", has: true },
    },
    {
      path: "/get-get-cookie",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { test: "test" },
      reqHeaders: {
        cookie: "test=test",
      },
    },
    {
      path: "/get-set-cookie",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        "set-cookie": "test=test;",
      },
      body: {},
    },
    {
      path: "/get-ip",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { ip: localIp },
    },
    {
      path: "/get-authorization",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      reqHeaders: {
        Authorization: "Test Authorization",
      },
      body: { authorization: "Test Authorization" },
    },
    {
      path: "/get-url",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { url: `http://${serve.hostname}:${serve.port}/get-url` },
    },
    {
      path: "/post-json",
      method: HttpMethod.POST,
      bodyType: "json",
      reqBody: { test: "test" },
      reqHeaders: {
        "content-type": "application/json",
      },
      statusCode: StatusCode.OK,
      body: { test: "test" },
    },
    {
      path: "/get-queries?id=1&name=test",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { id: "1", name: "test" },
    },
    {
      path: "/get-res-status",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.NOT_FOUND,
      body: { status: StatusCode.NOT_FOUND },
    },
    {
      path: "/get-res-headers",
      method: HttpMethod.GET,
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { test: "test" },
    },
    {
      path: "/get-res-without-body",
      method: HttpMethod.GET,
      bodyType: "text",
      statusCode: StatusCode.NOT_FOUND,
      responseHeaders: {
        "set-cookie": "test=test;",
        test: "test, test2",
      },
      body: "",
    },
    {
      path: "/get-req-body",
      method: HttpMethod.GET,
      bodyType: "json",
      reqHeaders: {
        "content-type": "application/json",
      },
      statusCode: StatusCode.OK,
      body: null,
    },
    {
      path: "/post-double-body",
      method: HttpMethod.POST,
      bodyType: "json",
      reqBody: { test: "test" },
      reqHeaders: {
        "content-type": "application/json",
      },
      statusCode: StatusCode.OK,
      body: { body: { test: "test" }, body2: { test: "test" } },
    },
    {
      path: "/post-body-without-content-type",
      method: HttpMethod.POST,
      bodyType: "text",
      reqBody: { test: "test" },
      statusCode: StatusCode.OK,
      body: '{"test":"test"}',
    },
    {
      path: "/post-body-form-data",
      method: HttpMethod.POST,
      formData: {
        test: "test",
        test2: "test2",
      },
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: {
        test: "test",
        test2: "test2",
      },
    },
    {
      path: "/post-body-urlencoded",
      method: HttpMethod.POST,
      bodyType: "json",
      statusCode: StatusCode.OK,
      urlSearch: {
        test: "test",
        test2: "test2",
      },
      body: {
        test: "test",
        test2: "test2",
      },
    },
    {
      path: "/post-body-raw",
      method: HttpMethod.POST,
      bodyType: "json",
      reqBody: "test raw body",
      reqHeaders: {
        "content-type": "text/plain",
      },
      statusCode: StatusCode.OK,
      body: "test raw body",
    },
    {
      path: "/post-body-stream",
      method: HttpMethod.POST,
      bodyType: "json",
      reqHeaders: {
        "content-type": "application/octet-stream",
      },
      statusCode: StatusCode.OK,
      body: { test: "test raw body" },
      streamBody: "test raw body",
    },
  ];

  for (const expected of expectedValues) {
    let formData: FormData | undefined;
    if (expected.formData) {
      formData = new FormData();
      for (const [key, value] of Object.entries(expected.formData)) {
        formData.append(key, value);
      }
    }

    let urlSearch: URLSearchParams | undefined;
    if (expected.urlSearch) {
      urlSearch = new URLSearchParams();
      for (const [key, value] of Object.entries(expected.urlSearch)) {
        urlSearch.append(key, value);
      }
    }

    let streamBody: ReadableStream<Uint8Array> | undefined;
    if (expected.streamBody) {
      const filePath = import.meta.dir + "/test-file";
      await Bun.write(filePath, expected.streamBody);
      const f = Bun.file(filePath);
      streamBody = f.stream();
      setTimeout(() => {
        unlinkSync(filePath);
      }, 0);
    }

    let reqBody;
    if (expected.reqBody) {
      reqBody = JSON.stringify(expected.reqBody);
    } else if (expected.urlSearch) {
      reqBody = urlSearch;
    } else if (expected.formData) {
      reqBody = formData;
    } else if (expected.streamBody) {
      reqBody = streamBody;
    }

    const res = await fetch(serve.hostname + ":" + serve.port + expected.path, {
      method: expected.method,
      credentials: "include",
      headers: expected?.reqHeaders
        ? JSON.parse(JSON.stringify(expected.reqHeaders))
        : {},
      body: reqBody,
      redirect: "follow",
    });

    let body = null;
    if (expected.bodyType === "json") {
      body = await res.json();
    } else if (expected.bodyType === "text") {
      body = await res.text();
    }

    if (expected.responseHeaders) {
      for (const [key, value] of Object.entries(expected.responseHeaders)) {
        expect(res.headers.get(key)).toBe(value);
      }
    }

    expect(body).toEqual(expected.body);
    expect(res.status).toBe(expected.statusCode);
  }

  serve.stop();
});

describe("Serve", async () => {
  test("Serve prefix star without backslah", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get() {}
    }

    const config: Config = {
      prefix: "api",
      controllers: [Test],
      disableStartupMessage: true,

      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    expect(config.prefix).toBe("/api");
    serve.stop();
  });

  test("Serve prefix endswith backslah", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get() {}
    }

    const config: Config = {
      prefix: "api/",
      controllers: [Test],
      disableStartupMessage: true,

      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    expect(config.prefix).toBe("/api");
    serve.stop();
  });

  test("Serve prefix with mutiple backslah", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get() {}
    }

    const config: Config = {
      prefix: "api///////",
      controllers: [Test],
      disableStartupMessage: true,

      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    expect(config.prefix).toBe("/api");
    serve.stop();
  });

  test("Serve default error handler", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get() {}
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,

      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    expect(config.errorHandler).toBe(defaultErrorHandler);
    serve.stop();
  });

  test("Serve custom error handler", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get() {}
    }

    function customErrorHandler(err: Errorlike) {
      return new Response(JSON.stringify({ message: err?.message }));
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,

      serveOptions: {
        port: 0,
      },
      errorHandler: customErrorHandler,
    };

    const serve = Serve(config);
    expect(config.errorHandler).toBe(customErrorHandler);
    serve.stop();
  });

  test("Serve custom server option", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get() {}
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 9696,
        hostname: "127.0.0.1",
        maxRequestBodySize: 1024,
      },
    };

    const serve = Serve(config);
    expect(config.serveOptions?.hostname).toBe("127.0.0.1");
    expect(config.serveOptions?.maxRequestBodySize).toBe(1024);
    expect(config.serveOptions?.port).toBe(9696);
    serve.stop();
  });
});

describe("Route", async () => {
  test("Simple Routes", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }

      @Post("/post")
      public post(ctx: Context) {
        return ctx.json({ fn: "post", method: ctx.method });
      }

      @Put("/put")
      public put(ctx: Context) {
        return ctx.json({ fn: "put", method: ctx.method });
      }

      @Delete("/delete")
      public delete(ctx: Context) {
        return ctx.json({ fn: "delete", method: ctx.method });
      }

      @Head("/head")
      public head(ctx: Context) {
        return ctx.status(StatusCode.NO_CONTENT);
      }

      @Patch("/patch")
      public patch(ctx: Context) {
        return ctx.json({ fn: "patch", method: ctx.method });
      }

      @Options("/options")
      public options(ctx: Context) {
        return ctx.status(StatusCode.NO_CONTENT);
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/get",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
      },
      {
        path: "/test/post",
        method: HttpMethod.POST,
        bodyType: "json",
        body: { fn: "post", method: HttpMethod.POST },
        statusCode: StatusCode.OK,
      },
      {
        path: "/test/put",
        method: HttpMethod.PUT,
        bodyType: "json",
        body: { fn: "put", method: HttpMethod.PUT },
        statusCode: StatusCode.OK,
      },
      {
        path: "/test/delete",
        method: HttpMethod.DELETE,
        bodyType: "json",
        body: { fn: "delete", method: HttpMethod.DELETE },
        statusCode: StatusCode.OK,
      },
      {
        path: "/test/head",
        method: HttpMethod.HEAD,
        statusCode: StatusCode.NO_CONTENT,
        body: null,
      },
      {
        path: "/test/patch",
        method: HttpMethod.PATCH,
        bodyType: "json",
        body: { fn: "patch", method: HttpMethod.PATCH },
        statusCode: StatusCode.OK,
      },
      {
        path: "/test/options",
        method: HttpMethod.OPTIONS,
        bodyType: "json",
        body: null,
        statusCode: StatusCode.NO_CONTENT,
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
    }

    serve.stop();
  });

  test("Routes for only headers method", async () => {
    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "get", method: ctx.method });
      }

      @Post("/test")
      public post(ctx: Context) {
        return ctx
          .status(StatusCode.OK)
          .set("fn", "post")
          .set("method", ctx.method)
          .json({ fn: "post", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          fn: "get",
          method: HttpMethod.GET,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.POST,
        bodyType: "json",
        body: { fn: "post", method: HttpMethod.POST },
        statusCode: StatusCode.OK,
        headers: {
          fn: "post",
          method: HttpMethod.POST,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.OPTIONS,
        bodyType: "json",
        body: null,
        statusCode: StatusCode.NO_CONTENT,
        headers: {
          allow: "GET, POST",
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.HEAD,
        bodyType: "json",
        body: null,
        statusCode: StatusCode.OK,
        headers: {
          fn: "get",
          method: HttpMethod.HEAD,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Routes All", async () => {
    @Controller("/test")
    class Test {
      @All("/test")
      public all(ctx: Context) {
        return ctx
          .set("fn", "all")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "all", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.GET,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.POST,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.POST },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.POST,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.OPTIONS,
        bodyType: "json",
        body: null,
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.OPTIONS,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.HEAD,
        bodyType: "json",
        body: null,
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.HEAD,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.PUT,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.PUT },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.PUT,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.DELETE,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.DELETE },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.DELETE,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.PATCH,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.PATCH },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.PATCH,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Routes All with some methods", async () => {
    @Controller("/test")
    class Test {
      @All("/test")
      public all(ctx: Context) {
        return ctx
          .set("fn", "all")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "all", method: ctx.method });
      }

      @Get("/test")
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .set("custom", "custom get")
          .status(StatusCode.OK)
          .json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          fn: "get",
          method: HttpMethod.GET,
          custom: "custom get",
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.POST,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.POST },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.POST,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.OPTIONS,
        bodyType: "json",
        body: null,
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.OPTIONS,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.HEAD,
        bodyType: "json",
        body: null,
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.HEAD,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.PUT,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.PUT },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.PUT,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.DELETE,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.DELETE },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.DELETE,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.PATCH,
        bodyType: "json",
        body: { fn: "all", method: HttpMethod.PATCH },
        statusCode: StatusCode.OK,
        headers: {
          fn: "all",
          method: HttpMethod.PATCH,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
  });

  test("Routes with Befores And Afters", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
      ctx.next();
    }

    function after(ctx: Context) {
      ctx.set("after", "after");
      ctx.next();
    }

    function before1(ctx: Context) {
      ctx.set("before1", "before1");
      ctx.next();
    }

    function after1(ctx: Context) {
      ctx.set("after1", "after1");
      ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before, before1)
      @After(after, after1)
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "get", method: ctx.method })
          .next();
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          fn: "get",
          method: HttpMethod.GET,
          before: "before",
          before1: "before1",
          after: "after",
          after1: "after1",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
  });

  test("Routes with Befores And Afters with some methods", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
      ctx.next();
    }

    function after(ctx: Context) {
      ctx.set("after", "after");
      ctx.next();
    }

    function before1(ctx: Context) {
      ctx.set("before1", "before1");
      ctx.next();
    }

    function after1(ctx: Context) {
      ctx.set("after1", "after1");
      ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before, before1)
      @After(after, after1)
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "get", method: ctx.method });
      }

      @Post("/test")
      public post(ctx: Context) {
        return ctx
          .set("fn", "post")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "post", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          fn: "get",
          method: HttpMethod.GET,
          before: "before",
          before1: "before1",
          after: null,
          after1: null,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.POST,
        bodyType: "json",
        body: { fn: "post", method: HttpMethod.POST },
        statusCode: StatusCode.OK,
        headers: {
          fn: "post",
          method: HttpMethod.POST,
          before: null,
          before1: null,
          after: null,
          after1: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
  });

  test("Routes with Befores without next", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before)
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        body: null,
        statusCode: StatusCode.OK,
        headers: {
          before: "before",
          fn: null,
          method: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
  });

  test("Routes with Middlewares", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
      ctx.next();
    }

    function before(ctx: Context) {
      ctx.set("before", "before");
      ctx.next();
    }

    @Controller("/test")
    class Test {
      @Before(before)
      @Get("/test")
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
      middlewares: [middleware, middleware1],
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          fn: "get",
          method: HttpMethod.GET,
          middleware: "middleware",
          middleware1: "middleware1",
          before: "before",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
  });

  test("Routes with mutiple Classes", async () => {
    class CustomClass {
      private name = "custom-class";

      public getName() {
        return this.name;
      }
    }

    class CustomClass1 {
      private name = "custom-class1";

      public getName() {
        return this.name;
      }
    }

    @Controller("/test")
    class Test {
      constructor(
        private readonly customClass: CustomClass,
        private readonly customClass1: CustomClass1
      ) {}

      @Get("/test")
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({
            fn: "get",
            method: ctx.method,
            parentNames: `${this.customClass.getName()} ${this.customClass1.getName()}`,
          });
      }
    }

    const config: Config = {
      controllers: [new Test(new CustomClass(), new CustomClass1())],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const server = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: {
          fn: "get",
          method: HttpMethod.GET,
          parentNames: "custom-class custom-class1",
        },
        statusCode: StatusCode.OK,
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        server.hostname + ":" + server.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }
      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
    }

    server.stop();
  });
});

describe("Context Locals", async () => {
  test("Locals value set", async () => {
    function setLocalValue(ctx: Context) {
      ctx.locals.set("value", "test-local");
      ctx.next();
    }

    function setLocalValueJson(ctx: Context) {
      ctx.locals.set("json", { test: "test-local" });
      ctx.next();
    }

    function setLocaBoolean(ctx: Context) {
      ctx.locals.set("has", true);
      ctx.next();
    }

    function setLocalNumber(ctx: Context) {
      ctx.locals.set("number", 1);
      ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        return ctx.json({
          value: ctx.locals.get("value"),
          has: ctx.locals.has("has"),
          json: ctx.locals.get("json"),
          number: ctx.locals.get("number"),
          hasValue: ctx.locals.has("value"),
          hasJson: ctx.locals.has("json"),
          hasNumber: ctx.locals.has("number"),
          hasOther: ctx.locals.has("other"),
        });
      }
    }

    const config: Config = {
      middlewares: [
        setLocalValue,
        setLocaBoolean,
        setLocalValueJson,
        setLocalNumber,
      ],
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: {
          value: "test-local",
          has: true,
          json: { test: "test-local" },
          number: 1,
          hasValue: true,
          hasJson: true,
          hasNumber: true,
          hasOther: false,
        },
        statusCode: StatusCode.OK,
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
    }

    serve.stop();
  });
});

describe("Strict routing", async () => {
  test("Strict routing", async () => {
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
      strict: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
      },
      {
        path: "/test/test/",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { message: "Not Found" },
        statusCode: StatusCode.NOT_FOUND,
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
    }

    serve.stop();
  });

  test("Strict without routing", async () => {
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
      strict: false,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
      },
      {
        path: "/test/test/",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
    }

    serve.stop();
  });
});

describe("Group", async () => {
  test("Only group", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      groups: [
        {
          controllers: [Test],
          prefix: "/group",
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/group/test/get",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
    }

    serve.stop();
  });

  test("Only Group without prefix", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      groups: [
        {
          controllers: [Test],
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/get",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        { method: expected.method, credentials: "include", redirect: "follow" }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
    }

    serve.stop();
  });

  test("Group with middlewares", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
      ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      groups: [
        {
          controllers: [Test],
          prefix: "/group",
          middlewares: [middleware, middleware1],
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/group/test/get",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Group with middlewares, controllers and  middlewares", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
      ctx.next();
    }

    function before(ctx: Context) {
      ctx.set("before", "before");
      ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/get")
      public Controllerget(ctx: Context) {
        return ctx.json({ fn: "Controllerget", method: ctx.method });
      }
    }

    @Controller("/test")
    class Group {
      @Get("/get")
      public Groupget(ctx: Context) {
        return ctx.json({ fn: "Groupget", method: ctx.method });
      }
    }

    const config: Config = {
      prefix: "/api",
      middlewares: [before],
      controllers: [Test],
      groups: [
        {
          controllers: [Group],
          prefix: "/group1",
          middlewares: [middleware, middleware1],
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/api/group1/test/get",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "Groupget", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          before: "before",
        },
      },
      {
        path: "/api/test/get",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "Controllerget", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          before: "before",
          middleware: null,
          middleware1: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        { method: expected.method, credentials: "include", redirect: "follow" }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });
});

describe("Controller Type", async () => {
  test("Controller without decorator", async () => {
    class Test {
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test as any],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    expect(() => Serve(config)).toThrow(
      "Controller must be decorated with @Controller decorator"
    );
  });

  test("Controller with decorator", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    expect(() => Serve(config)).not.toThrow();
  });

  test("Group without decorator", async () => {
    class Test {
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      groups: [
        {
          controllers: [Test],
          prefix: "/group",
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    expect(() => Serve(config)).toThrow(
      "Controller must be decorated with @Controller decorator"
    );
  });

  test("Group with decorator", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      groups: [
        {
          controllers: [Test],
          prefix: "/group",
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    expect(() => Serve(config)).not.toThrow();
  });
});

const createContextMock = (method: HttpMethod) => {
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
    json: (param: any, status: number) => {
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

describe("NotFound function", async () => {
  test("when NotFound called with HEAD it returns 404 without body.", async () => {
    const { context, statusMock } = createContextMock(HttpMethod.HEAD);

    NotFound(context);

    expect(statusMock).toHaveBeenCalledTimes(1);

    const [status, response] = statusMock.mock.calls[0];

    //In the future, we can use toHaveBeenCalledWith but it is not implemented yet in Bun.
    expect(status).toBe(StatusCode.NOT_FOUND);
    expect(response).toBeUndefined();
  });

  test("when NotFound called except HEAD it calls json method `Not Found` message with 404 status code and returns res", async () => {
    const { context, jsonMock, resMock, statusMock } = createContextMock(
      HttpMethod.GET
    );

    NotFound(context);

    expect(jsonMock).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledTimes(1);

    //In the future, we can use toHaveBeenCalledWith but it is not implemented yet in Bun.
    const [response] = jsonMock.mock.calls[0];
    const [status] = statusMock.mock.calls[0];

    expect(response).toEqual({ message: "Not Found" });
    expect(status).toBe(StatusCode.NOT_FOUND);

    expect(context.res).toBe(resMock);
  });
});

describe("returnContextResponse function", () => {
  test("when returnContextResponse called with HEAD it returns res without body", async () => {
    const { context, getResWithoutBodyMock } = createContextMock(
      HttpMethod.HEAD
    );

    returnContextResponse(context);

    expect(getResWithoutBodyMock).toHaveBeenCalledTimes(1);
  });

  test("when returnContextResponse called except HEAD it returns res", async () => {
    const { context, resMock } = createContextMock(HttpMethod.GET);

    returnContextResponse(context);

    expect(context.res).toBe(resMock);
  });
});

describe("defaultErrorHandler function", () => {
  test("when defaultErrorHandler called with error it returns response with 500 Status Code and error attributes as a response", async () => {
    const errorText = "test error";
    const error = new Error(errorText);
    const response = defaultErrorHandler(error);

    const { message, stack } = JSON.parse(await response.text());

    expect(message).toBe(errorText);
    expect(stack).toBe(error.stack);
    expect(response.status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
  });
});

describe("getRoutesFromControllers function", () => {
  test("when getRoutesFromControllers called with controllers it returns routes", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const routes = getRoutesFromControllers({}, [Test]);

    expect(routes).toEqual([
      {
        after: [],
        before: [],
        path: "/test/get",
        method: HttpMethod.GET,
        fnName: "get",
        pathHasParams: false,
        target: Test,
      },
    ]);
  });

  test("when getRoutesFromControllers called with controllers and prefix it returns routes", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const routes = getRoutesFromControllers(
      {
        prefix: "/api",
      },
      [Test]
    );

    expect(routes).toEqual([
      {
        after: [],
        before: [],
        path: "/api/test/get",
        method: HttpMethod.GET,
        fnName: "get",
        pathHasParams: false,
        target: Test,
      },
    ]);
  });

  test("when getRoutesFromControllers called with empty controllers it returns empty routes", async () => {
    const routes = getRoutesFromControllers({}, []);

    expect(routes).toEqual([]);
  });

  test("when getRoutesFromControllers called with empty controllers and prefix it returns empty routes", async () => {
    const routes = getRoutesFromControllers(
      {
        prefix: "/api",
      },
      []
    );

    expect(routes).toEqual([]);
  });

  test("when getRoutesFromControllers called with filled null array controllers it returns empty routes", async () => {
    const routes = getRoutesFromControllers({}, [null]);

    expect(routes).toEqual([]);
  });

  test("when getRoutesFromControllers called with filled string array controllers it returns empty routes", async () => {
    const routes = getRoutesFromControllers({}, ["test"]);

    expect(routes).toEqual([]);
  });
});

describe("getRoutesFromGroups function", () => {
  test("when getRoutesFromGroups called with groups it returns routes", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const routes = getRoutesFromGroups({}, [
      {
        prefix: "/api",
        controllers: [Test],
      },
    ]);

    expect(routes).toEqual([
      {
        after: [],
        before: [],
        path: "/api/test/get",
        method: HttpMethod.GET,
        fnName: "get",
        pathHasParams: false,
        target: Test,
      },
    ]);
  });

  test("when getRoutesFromGroups called with groups and prefix it returns routes", async () => {
    @Controller("/test")
    class Test {
      @Get("/get")
      public get(ctx: Context) {
        return ctx.json({ fn: "get", method: ctx.method });
      }
    }

    const routes = getRoutesFromGroups(
      {
        prefix: "/api",
      },
      [
        {
          prefix: "/api",
          controllers: [Test],
        },
      ]
    );

    expect(routes).toEqual([
      {
        after: [],
        before: [],
        path: "/api/api/test/get",
        method: HttpMethod.GET,
        fnName: "get",
        pathHasParams: false,
        target: Test,
      },
    ]);
  });

  test("when getRoutesFromGroups called with empty groups it returns empty routes", async () => {
    const routes = getRoutesFromGroups({}, []);

    expect(routes).toEqual([]);
  });

  test("when getRoutesFromGroups called with empty groups and prefix it returns empty routes", async () => {
    const routes = getRoutesFromGroups(
      {
        prefix: "/api",
      },
      []
    );

    expect(routes).toEqual([]);
  });

  test("when getRoutesFromGroups called with filled null array groups it returns empty routes", async () => {
    const routes = getRoutesFromGroups({}, [
      {
        prefix: "/api",
        controllers: [null],
      },
    ]);

    expect(routes).toEqual([]);
  });

  test("when getRoutesFromGroups called with filled string array groups it returns empty routes", async () => {
    const routes = getRoutesFromGroups({}, [
      {
        prefix: "/api",
        controllers: ["test"],
      },
    ]);

    expect(routes).toEqual([]);
  });
});

describe("Request Cycle", () => {
  test("Basic Request Cycle", async () => {
    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        return ctx
          .set("fn", "get")
          .set("method", ctx.method)
          .status(StatusCode.OK)
          .json({ fn: "get", method: ctx.method });
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        bodyType: "json",
        body: { fn: "get", method: HttpMethod.GET },
        statusCode: StatusCode.OK,
        headers: {
          fn: "get",
          method: HttpMethod.GET,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          headers: {},
          redirect: "follow",
        }
      );

      let body = null;
      if (expected.bodyType === "json") {
        body = await res.json();
      } else if (expected.bodyType === "text") {
        body = await res.text();
      }

      expect(body).toEqual(expected.body);
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with Befores And Afters (Before call next but Handler won't) Not execute After", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
      return ctx.next();
    }

    function after(ctx: Context) {
      ctx.set("after", "after");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before)
      @After(after)
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return;
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          before: "before",
          handler: "handler",
          after: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with Befores And Afters (Before won't call next) Not Execute Handler", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
    }

    function after(ctx: Context) {
      ctx.set("after", "after");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before)
      @After(after)
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          before: "before",
          handler: null,
          after: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with Befores And Afters (After won't call next) Not Execute Next After", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
      return ctx.next();
    }

    function after(ctx: Context) {
      ctx.set("after", "after");
    }

    function secondAfter(ctx: Context) {
      ctx.set("secondAfter", "secondAfter");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before)
      @After(after, secondAfter)
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          before: "before",
          handler: "handler",
          after: "after",
          secondAfter: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with Befores And Afters (After call next) Execute Next After", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
      return ctx.next();
    }

    function after(ctx: Context) {
      ctx.set("after", "after");
      return ctx.next();
    }

    function secondAfter(ctx: Context) {
      ctx.set("secondAfter", "secondAfter");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before)
      @After(after, secondAfter)
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          before: "before",
          handler: "handler",
          after: "after",
          secondAfter: "secondAfter",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with Befores And Afters (All call next) Execute All", async () => {
    function before(ctx: Context) {
      ctx.set("before", "before");
      return ctx.next();
    }

    function secondBefore(ctx: Context) {
      ctx.set("secondBefore", "secondBefore");
      return ctx.next();
    }

    function after(ctx: Context) {
      ctx.set("after", "after");
      return ctx.next();
    }

    function secondAfter(ctx: Context) {
      ctx.set("secondAfter", "secondAfter");
      return ctx.next();
    }

    function thirdAfter(ctx: Context) {
      ctx.set("thirdAfter", "thirdAfter");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(before, secondBefore)
      @After(after, secondAfter, thirdAfter)
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          before: "before",
          secondBefore: "secondBefore",
          handler: "handler",
          after: "after",
          secondAfter: "secondAfter",
          thirdAfter: "thirdAfter",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with App level Middlewares (First middleware call next but Second middleware won't) Not Execute Handler", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      return ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      middlewares: [middleware, middleware1],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          handler: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with App level Middlewares (All middleware call next) Execute All", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      return ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
      return ctx.next();
    }

    function middleware2(ctx: Context) {
      ctx.set("middleware2", "middleware2");
      return ctx.next();
    }

    function middleware3(ctx: Context) {
      ctx.set("middleware3", "middleware3");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      middlewares: [middleware, middleware1, middleware2, middleware3],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          middleware2: "middleware2",
          middleware3: "middleware3",
          handler: "handler",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with App level Middlewares (With Not Found Handler) Execute All Middlewares and Not Found Handler", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      return ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      middlewares: [middleware, middleware1],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);

    const expectedValues = [
      {
        path: "/test/test1",
        method: HttpMethod.GET,
        statusCode: StatusCode.NOT_FOUND,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          handler: null,
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          handler: "handler",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle with Group level Middlewares (First middleware call next but Second middleware won't) Not Execute Handler", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      return ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      groups: [
        {
          prefix: "/api",
          controllers: [Test],
          middlewares: [middleware, middleware1],
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/api/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          handler: null,
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
    serve.stop();
  });

  test("Request Cycle with Group level Middlewares (All middleware call next) Execute All", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      return ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      groups: [
        {
          prefix: "/api",
          controllers: [Test],
          middlewares: [middleware, middleware1],
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/api/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          handler: "handler",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path,
        {
          method: expected.method,
          credentials: "include",
          redirect: "follow",
        }
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
    serve.stop();
  });

  test("Request Cycle with Group level Middlewares (With Not Found Handler) Won't Execute All", async () => {
    function middleware(ctx: Context) {
      ctx.set("middleware", "middleware");
      return ctx.next();
    }

    function middleware1(ctx: Context) {
      ctx.set("middleware1", "middleware1");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      groups: [
        {
          prefix: "/api",
          controllers: [Test],
          middlewares: [middleware, middleware1],
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/api/test/test1",
        method: HttpMethod.GET,
        statusCode: StatusCode.NOT_FOUND,
        headers: {
          middleware: null,
          middleware1: null,
          handler: null,
        },
      },
      {
        path: "/api/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          middleware: "middleware",
          middleware1: "middleware1",
          handler: "handler",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }
    serve.stop();
  });

  test("Request Cycle with App level Middlewares, Group level Middlewares and Befores And Afters (All call next) Execute All", async () => {
    function firstAppMiddleware(ctx: Context) {
      ctx.set("firstAppMiddleware", "firstAppMiddleware");
      return ctx.next();
    }

    function secondAppMiddleware(ctx: Context) {
      ctx.set("secondAppMiddleware", "secondAppMiddleware");
      return ctx.next();
    }

    function firstGroupMiddleware(ctx: Context) {
      ctx.set("firstGroupMiddleware", "firstGroupMiddleware");
      return ctx.next();
    }

    function secondGroupMiddleware(ctx: Context) {
      ctx.set("secondGroupMiddleware", "secondGroupMiddleware");
      return ctx.next();
    }

    function firstBefore(ctx: Context) {
      ctx.set("firstBefore", "firstBefore");
      return ctx.next();
    }

    function secondBefore(ctx: Context) {
      ctx.set("secondBefore", "secondBefore");
      return ctx.next();
    }

    function firstAfter(ctx: Context) {
      ctx.set("firstAfter", "firstAfter");
      return ctx.next();
    }

    function secondAfter(ctx: Context) {
      ctx.set("secondAfter", "secondAfter");
      return ctx.next();
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      @Before(firstBefore, secondBefore)
      @After(firstAfter, secondAfter)
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      middlewares: [firstAppMiddleware, secondAppMiddleware],
      groups: [
        {
          prefix: "/api",
          controllers: [Test],
          middlewares: [firstGroupMiddleware, secondGroupMiddleware],
        },
      ],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/api/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          firstAppMiddleware: "firstAppMiddleware",
          secondAppMiddleware: "secondAppMiddleware",
          firstGroupMiddleware: "firstGroupMiddleware",
          secondGroupMiddleware: "secondGroupMiddleware",
          firstBefore: "firstBefore",
          secondBefore: "secondBefore",
          handler: "handler",
          firstAfter: "firstAfter",
          secondAfter: "secondAfter",
        },
      },
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          firstAppMiddleware: "firstAppMiddleware",
          secondAppMiddleware: "secondAppMiddleware",
          firstBefore: "firstBefore",
          secondBefore: "secondBefore",
          handler: "handler",
          firstAfter: "firstAfter",
          secondAfter: "secondAfter",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toBe(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle App level Middleware set header value after next (Execute All Handler after Add Header) Either way context can be modified", async () => {
    function AppMiddleware(ctx: Context) {
      ctx.set("BeforeAppMiddleware", "BeforeAppMiddleware");
      ctx.next();
      ctx.set("AfterAppMiddleware", "AfterAppMiddleware");
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      middlewares: [AppMiddleware],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          BeforeAppMiddleware: "BeforeAppMiddleware",
          handler: "handler",
          AfterAppMiddleware: "AfterAppMiddleware",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toEqual(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle App level Middleware set header value after next (Handler won't execute next) Either way context can be modified", async () => {
    function AppMiddleware(ctx: Context) {
      ctx.set("BeforeAppMiddleware", "BeforeAppMiddleware");
      ctx.next();
      ctx.set("AfterAppMiddleware", "AfterAppMiddleware");
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
      }
    }

    const config: Config = {
      controllers: [Test],
      middlewares: [AppMiddleware],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          BeforeAppMiddleware: "BeforeAppMiddleware",
          handler: "handler",
          AfterAppMiddleware: "AfterAppMiddleware",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toEqual(value);
      });
    }

    serve.stop();
  });

  test("Request Cycle App level Second Middleware set header value after next (BeforeSecondAppMiddleware won't execute next) Either way context can be modified", async () => {
    function AppMiddleware(ctx: Context) {
      ctx.set("BeforeAppMiddleware", "BeforeAppMiddleware");
      ctx.next();
      ctx.set("AfterAppMiddleware", "AfterAppMiddleware");
    }

    function SecondAppMiddleware(ctx: Context) {
      ctx.set("BeforeSecondAppMiddleware", "BeforeSecondAppMiddleware");
    }

    @Controller("/test")
    class Test {
      @Get("/test")
      public get(ctx: Context) {
        ctx.set("handler", "handler");
        return ctx.next();
      }
    }

    const config: Config = {
      controllers: [Test],
      middlewares: [AppMiddleware, SecondAppMiddleware],
      disableStartupMessage: true,
      serveOptions: {
        port: 0,
      },
    };

    const serve = Serve(config);
    const expectedValues = [
      {
        path: "/test/test",
        method: HttpMethod.GET,
        statusCode: StatusCode.OK,
        headers: {
          BeforeAppMiddleware: "BeforeAppMiddleware",
          BeforeSecondAppMiddleware: "BeforeSecondAppMiddleware",
          handler: null,
          AfterAppMiddleware: "AfterAppMiddleware",
        },
      },
    ];

    for (const expected of expectedValues) {
      const res = await fetch(
        serve.hostname + ":" + serve.port + expected.path
      );
      expect(res.status).toBe(expected.statusCode);
      Object.entries(expected.headers).forEach(([key, value]) => {
        expect(res.headers.get(key)).toEqual(value);
      });
    }

    serve.stop();
  });
});

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
        method: HttpMethod.GET,
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
        method: HttpMethod.GET,
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
        method: HttpMethod.GET,
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
