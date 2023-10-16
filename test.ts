import { Config } from "./src/type";
import Controller from "./src/decorators/controller";
import Get from "./src/decorators/get";
import Middleware from "./src/decorators/middleware";
import Post from "./src/decorators/post";
import { Serve } from ".";
import { Context } from "./context";

function testMiddleware(ctx: Context): Context {
  console.log("testMiddleware");

  return ctx;
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
  public async test2(ctx: any): Promise<Response> {
    return new Response("Hello World Post");
  }

  @Get("/redirect")
  public test3(ctx: Context): Context {
    return ctx
      .set("x-test", "x-test")
      .status(204)
      .json({ data: "Hello World" });
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
