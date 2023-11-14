import { Context } from "../../context";
import { createPath } from "../utils";

/**
 * @description
 * Decorator for defining a route that handles GET requests
 *
 * @param path - The path to the route (optional). By default it will use the name of the function.
 *
 **/

export function Get(path?: string) {
  if (path && typeof path !== "string")
    throw new Error("Get decorator can only be used on a class");

  return function (target: any, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("Get decorator can only be used on functions");
    const routePath = path ? createPath(path) : createPath(key);
    Reflect.defineMetadata("path", routePath, target, key);
    Reflect.defineMetadata("method", "get", target, key);
  };
}
