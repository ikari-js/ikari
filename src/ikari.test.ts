/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe } from "bun:test";
import { StatusCode, createPath } from "./utils";
import { ServeValidator } from "./serve-validator";
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
  All
} from "./decorators";
import "reflect-metadata";
import { Config, Context, Route, Serve } from ".";
import { unlinkSync } from "node:fs";

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
    expect(route.method).toBe("get");
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
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe("post");
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
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe("put");
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
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe("delete");
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
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe("head");
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
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe("patch");
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
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe("options");
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
    get: {
      count: 5,
      paths: ["/get", "/test-get", "/test-get-2", "/test-get-3", "/test-4/:id"],
      fnNames: ["get", "get1", "get2", "get3", "get4"],
      afterCount: [0, 1, 0, 1, 0],
      beforeCount: [0, 1, 1, 0, 0],
      hasParams: [false, false, false, false, true],
    },
    post: {
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
    put: {
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
    delete: {
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
    head: {
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

    patch: {
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
    options: {
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
      expect(route.target).toBe(Test);
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
    expect(route.target).toBe(Test);
    expect(route.path).toBe(expected.path);
    expect(route.fnName).toBe(expected.fnName);
    expect(route.pathHasParams).toBe(expected.hasParams);
    expect(route.method).toBe("all");
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
      return ctx.json({ url: ctx.url() });
    }

    @Post("/post-json")
    public async postJson(ctx: Context) {
      return ctx.json(await ctx.body());
    }

    // TODO
    // body form data
    // body urlencoded
    // body raw
    // body stream
  }

  const config: Config = {
    controllers: [Test],
    disableStartupMessage: true,
    logger: { logger: () => {} },
  };

  const serve = Serve(config);
  const localIp = (process.platform === "linux" && process.env.WSL_INTEROP) ? "::ffff:127.0.0.1" : "::1";

  const expectedValues = [
    {
      path: "/get",
      method: "get",
      bodyType: "json",
      body: { test: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-withparams/1/test",
      method: "get",
      bodyType: "json",
      body: { id: "1", name: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-withquery?id=1&name=test",
      method: "get",
      bodyType: "json",
      body: { id: "1", name: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-with-query-and-params/1/test?id=2&name=test2",
      method: "get",
      bodyType: "json",
      body: { id: "2", name: "test2", idParam: "1", nameParam: "test" },
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-string",
      method: "get",
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-buffer",
      method: "get",
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-stream",
      method: "get",
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-raw",
      method: "get",
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-return-statuscode",
      method: "get",
      bodyType: "text",
      body: "test",
      statusCode: StatusCode.ACCEPTED,
    },
    {
      path: "/get-return-redirect-in-app",
      method: "get",
      bodyType: "text",
      body: '{"test":"test"}',
      statusCode: StatusCode.OK,
    },
    {
      path: "/get-cookie",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        "set-cookie": "test=test;",
      },
      body: {},
    },
    {
      path: "/get-append",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        test: "test, test2",
      },
      body: {},
    },
    {
      path: "/get-set",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        test: "test",
      },
      body: {},
    },
    {
      path: "/get-get",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      reqHeaders: {
        test: "test",
      },
      body: { test: "test" },
    },
    {
      path: "/get-locals",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { value: "test-local", has: true },
    },
    {
      path: "/get-get-cookie",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { test: "test" },
      reqHeaders: {
        cookie: "test=test",
      },
    },
    {
      path: "/get-set-cookie",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      responseHeaders: {
        "set-cookie": "test=test;",
      },
      body: {},
    },
    {
      path: "/get-ip",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { ip: localIp },
    },
    {
      path: "/get-authorization",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      reqHeaders: {
        Authorization: "Test Authorization",
      },
      body: { authorization: "Test Authorization" },
    },
    {
      path: "/get-url",
      method: "get",
      bodyType: "json",
      statusCode: StatusCode.OK,
      body: { url: `http://${serve.hostname}:${serve.port}/get-url` },
    },
    {
      path: "/post-json",
      method: "post",
      bodyType: "json",
      reqBody: { test: "test" },
      reqHeaders: {
        "content-type": "application/json",
      },
      statusCode: StatusCode.OK,
      body: { test: "test" },
    },
  ];

  for (const expected of expectedValues) {
    const res = await fetch(serve.hostname + ":" + serve.port + expected.path, {
      method: expected.method,
      credentials: "include",
      headers: expected?.reqHeaders
        ? JSON.parse(JSON.stringify(expected.reqHeaders))
        : {},
      body: expected?.reqBody ? JSON.stringify(expected.reqBody) : undefined,
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
