import { Handler } from "../type";

/**
 * After decorator, used to add middleware after a route handler. Middleware will be executed in order.
 * @param handlers
 *
 * @example
 * ```ts
 * --@After((ctx) => {
 *     console.log("After middleware");
 *   })
 * --@Get()
 *   public test(ctx: Context): Context {
 *     return ctx.json({ data: "Hello World" });
 *   }
 * ```
 */
export function After(...handlers: Handler[]) {
  return function (target: any, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("After decorator can only be used on functions");

    const after = Reflect.getMetadata("after", target, key);
    if (after) {
      handlers = [...after, ...handlers];
    }
    Reflect.defineMetadata("after", handlers, target, key);
  };
}
