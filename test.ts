/* eslint-disable @typescript-eslint/no-unused-vars */
import { Config } from "./src/type";
import { Serve } from "./src";
import { Context } from "./src/context";
import { Before, Controller, Get, Post, After, Head } from "./src/decorators";
import DefaultLogger from "./src/logger";

function Auth(ctx: Context) {
  ctx.next();
}

function testMiddlewareAfter(ctx: Context) {
  console.log("testMiddlewareAfter");
  ctx.status(200).json({ data: "Hello World After" });
}

function testMiddlewareAfter2(ctx: Context) {
  console.log("testMiddlewareAfter2");
  ctx.next();
}

@Controller("/")
class TestController2 {
  // TODO maybe need to fix this
  @Get("/test")
  public test(ctx: Context) {
    return ctx.json({ data: "Hello Get" });
  }

  @Post("/test")
  public test1(ctx: Context) {
    return ctx.json({ data: "Hello Post" });
  }

  @Get("/test/:id/:name")
  public test2(ctx: Context) {
    return ctx.json({ ...ctx.params });
  }

  @Before(Auth)
  @After(testMiddlewareAfter)
  @Post("/test/:id/:name")
  public test3(ctx: Context) {
    ctx.json({ ...ctx.params });
    ctx.next();
  }
}

const config: Config = {
  middlewares: [testMiddlewareAfter2],
  controllers: [TestController2],
  port: 3001,
  logger: new DefaultLogger(),
};

Serve(config);
