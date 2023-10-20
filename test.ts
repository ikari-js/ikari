import { Config } from "./src/type";
import { Serve } from ".";
import { Context } from "./context";
import { Before, Controller, Get, Post,After } from "./src/decorators";
function testMiddlewareBefore(ctx: Context): void {
  console.log("testMiddleware before");
}

function testMiddlewareAfter(ctx: Context): Context {
  console.log("testMiddleware after");
  console.log(ctx.getResHeader("x-test"));

  return ctx.status(200).json({ data: "Hello World After" });
}

@Controller("/test")
class TestController2 {
  @Post("/test/:id/wqe/:id2")
  public async test1(ctx: Context) {
    console.log("hit test1");
    console.log(ctx.param("id"));
    console.log(ctx.param("id2"));
    const body = await ctx.body();
    console.log(body.data);
  }

  @Get("/test2")
  public async test2(ctx: Context): Promise<Response> {
    return new Response("Hello World Post");
  }

  @Before(testMiddlewareBefore)
  @After(testMiddlewareAfter)
  @Get("/redirect")
  public test3(ctx: Context): Context {
    ctx.set("x-test", "x-test");
    console.log("hit test3");
    return ctx.status(204).json({ data: "Hello World" });
  }
}

async function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function test() {
  await timeout(1000);
  throw new Error("Test Error");
}

const config: Config = {
  controllers: [TestController2],
  port: 3000,
};

Serve(config);
