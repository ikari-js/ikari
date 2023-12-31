import { Context } from "./context";
import { Handler, Handlers } from "./types";

type RouteHandler = {
  handler: Handler;
  done: boolean;
};

export class Routes {
  private routes: RouteHandler[] = [];
  constructor(handlers: Handlers) {
    this.routes = handlers.map((handler) => ({
      handler,
      // TODO find a better way to do this
      done: false,
    }));
  }

  public async start(ctx: Context): Promise<void | Context> {
    if (this.routes.length === 0) return;
    const handler = this.routes[0];
    handler.done = true;
    return handler.handler(ctx);
  }

  public async next(ctx: Context): Promise<void | Context> {
    // TODO: performance check
    const nextHandler = this.routes.find((handler) => !handler.done);
    if (!nextHandler) return ctx;
    nextHandler.done = true;
    return nextHandler.handler(ctx);
  }
}
