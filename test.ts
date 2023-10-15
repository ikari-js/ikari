import { Config } from "./src/type";
import Controller from "./src/decorators/controller";
import Get from "./src/decorators/get";
import Middleware from "./src/decorators/middleware";
import Post from "./src/decorators/post";
import {  Serve } from ".";
import { Context } from "./context";

function testMiddleware(ctx: Context): Context {
  console.log("testMiddleware");

  return ctx;
}

@Controller("/test")
class TestController2 {
  @Post("/test")
  public async test1(ctx: Context) {
    console.log(ctx.query("id"));
    console.log(ctx.ip());
    console.log(ctx.cookie("asd"));
    ctx.locals.set("asd", [1, 2, 3])
    console.log(ctx.locals.get<Array<Number>>("asd"));
  }

  @Post("/test2")
  public async test2(ctx: any): Promise<Response> {
    return new Response("Hello World Post");
  }

  @Get()
  public async test3() {
    // TODO fix this
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        throw new Error(" test3");
      }, 100);
    });

    return new Response("Hello World3");
  }
}

const config: Config = {
  controllers: [TestController2],
};

Serve(config);
