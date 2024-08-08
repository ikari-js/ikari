import { Context } from "./context";
import { Handlers } from "./types";
export class Routes {
  constructor(private routes: Handlers) {}

  public async next(ctx: Context) {
    // TODO: performance check
    const nextHandler = this.routes.shift();
    if (!nextHandler) return ctx;
    return nextHandler(ctx);
  }
}
