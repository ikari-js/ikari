import { Serve } from ".";
import { Config } from "./src/type";
import Controller from "./src/decorators/controller";
import Get from "./src/decorators/get";
import Post from "./src/decorators/post";

@Controller("/test")
class TestController2 {
  @Get("/test")
  public async test1(ctx: any) {
    return new Response("Hello World Get");
  }

  @Post("/test")
  public async test2(ctx: any) {
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
