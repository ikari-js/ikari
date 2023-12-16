import { FunctionTarget } from "..";
import { HttpMethod, createPath } from "../utils";

/**
 * Decorator for defining a route that handles PUT requests
 *
 * @param path - The path to the route (optional). By default it will use the name of the function.
 *
 **/
export function Put(path?: string) {
  if (path && typeof path !== "string")
    throw new Error("Path must be a string");

  return function (target: FunctionTarget, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("Put decorator can only be used on functions");

    const routePath = path ? createPath(path) : createPath(key);
    Reflect.defineMetadata("path", routePath, target, key);
    Reflect.defineMetadata("method", HttpMethod.PUT, target, key);
  };
}
