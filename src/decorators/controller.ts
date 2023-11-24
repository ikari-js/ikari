import { Route } from "../types";

/**
  Controller decorator is used to define a controller class.
  It should be used on a class.
  @param prefix - the prefix for all routes in the controller
**/
export function Controller(prefix: string) {
  if (typeof prefix !== "string")
    throw new Error("Controller decorator can only be used on a class");

  prefix = prefix.replace(/\/$/, "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    for (const value of Object.getOwnPropertyNames(target.prototype)) {
      const path = Reflect.getMetadata("path", target.prototype, value);
      const method = Reflect.getMetadata("method", target.prototype, value);
      const routePath = path === "constructor" ? prefix : `${prefix}${path}`;

      const routes =
        (Reflect.getMetadata("routes", target.prototype) as Route[]) || [];
      Reflect.defineMetadata("routes", routes, target.prototype);
      if (path) {
        const pathHasParams = routePath.includes(":");

        routes.push({
          path: routePath.startsWith("//")
            ? routePath.replace("//", "/")
            : routePath,
          fnName: value,
          method,
          target,
          pathHasParams,
          before: Reflect.getMetadata("before", target.prototype, value) || [],
          after: Reflect.getMetadata("after", target.prototype, value) || [],
        });
      }
    }
  };
}
