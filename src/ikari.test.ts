/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe } from "bun:test";
import { createPath } from "./utils";
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
} from "./decorators";
import "reflect-metadata";
import { Route } from ".";
import { All } from "./decorators/all";

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
