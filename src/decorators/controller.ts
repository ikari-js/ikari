import { Route } from "../type";

export function Controller(prefix: string) {
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
          path: routePath,
          fnName: value,
          method,
          target,
          pathHasParams,
          before: Reflect.getMetadata("before", target.prototype, value),
          after: Reflect.getMetadata("after", target.prototype, value),
        });
      }
    }
  };
}
