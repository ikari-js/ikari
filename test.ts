import { Config } from "./src/type";
import { Serve } from ".";
import { Context } from "./context";
import { Before, Controller, Get, Post, After } from "./src/decorators";

function testMiddlewareBefore(ctx: Context, next: Next) {
  console.log("testMiddleware before");
  next();
}

function testMiddlewareAfter(ctx: Context, next: Next) {
  console.log("testMiddleware after");
  ctx.status(200).json({ data: "Hello World After" });
}

function testMiddlewareAfter2(ctx: Context, next: Next) {
  console.log("testMiddleware after2");
  ctx.status(200).json({ data: "Hello World After2" });
}

type Next = () => void;

@Controller("/")
class TestController2 {

  @Before(testMiddlewareBefore)
  @After(testMiddlewareAfter, testMiddlewareAfter2)
  @Get("")
  public test(ctx: Context, next: Next): Context {
    return ctx.json({ data: "Hello World" });
  }
}

const config: Config = {
  controllers: [TestController2],
  port: 3000,
};

Serve(config);
