import { createPath } from "../utils";

/**
 * @description
 * Decorator for defining a route that handles POST requests
 *
 * @param path - The path to the route
 *
 * @example
 * ``` ts
 * --@Post()
 *    public test(ctx: Context): Context {
 *     return ctx.json({ data: "Hello World" });
 *    }
 * ```
 *
 * **/

export function Post(path?: string) {
  if (path && typeof path !== "string")
    throw new Error("Post decorator can only be used on a class");

  return function (target: any, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("Post decorator can only be used on functions");
    const routePath = path ? createPath(path) : createPath(key);
    Reflect.defineMetadata("path", routePath, target, key);
    Reflect.defineMetadata("method", "post", target, key);
  };
}
