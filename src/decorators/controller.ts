import {
  Route,
  Controller as ControllerType,
  Constructor,
} from "../types";

/**
  Controller decorator is used to define a controller class.
  It should be used on a class.
  @param prefix - the prefix for all routes in the controller
**/
export function Controller(prefix: string) {
  prefix = prefix.replace(/\/$/, "");

  return function <T>(target: Constructor<T>) {
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
          target: target as ControllerType,
          pathHasParams,
          before: Reflect.getMetadata("before", target.prototype, value) || [],
          after: Reflect.getMetadata("after", target.prototype, value) || [],
        });
      }
    }
  };
}
