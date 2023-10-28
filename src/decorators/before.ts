import { Handler } from "../type";

/**
 * Before decorator, used to add middleware before a route handler. Middleware will be executed in order.
 * @param handlers
 *
 * @example
 * ```ts
 * --@Before((ctx) => {
 *    console.log("Before middleware");
 *   })
 * --@Get()
 *   public test(ctx: Context): Context {
 *    return ctx.json({ data: "Hello World" });
 *   }
 * ```
 */
export function Before(...handlers: Handler[]) {
  return function (target: any, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("Before decorator can only be used on functions");

    const before = Reflect.getMetadata("before", target, key);
    if (before) {
      handlers = [...before, ...handlers];
    }
    Reflect.defineMetadata("before", handlers, target, key);
  };
}
