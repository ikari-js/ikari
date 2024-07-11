import { FunctionTarget } from "..";
import { HTTPMethod, createPath } from "../utils";

/**
 * Decorator for defining a route that handles DELETE requests
 *
 * @param path - The path to the route (optional). By default it will use the name of the function.
 *
 **/
export function Delete(path?: string) {
  return function (target: FunctionTarget, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("Delete decorator can only be used on functions");

    const routePath = path ? createPath(path) : createPath(key);
    Reflect.defineMetadata("path", routePath, target, key);
    Reflect.defineMetadata("method", HTTPMethod.DELETE, target, key);
  };
}
