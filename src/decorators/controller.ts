export default function Controller(prefix: string) {
  return function (target: any) {
    for (const value of Object.getOwnPropertyNames(target.prototype)) {
      const path = Reflect.getMetadata("path", target.prototype, value);
      const method = Reflect.getMetadata("method", target.prototype, value);
      const routePath = path === "constructor" ? prefix : `${prefix}${path}`;

      const routes = Reflect.getMetadata("routes", target.prototype) || [];
      Reflect.defineMetadata("routes", routes, target.prototype);
      if (path) {
        routes.push({
          path: routePath,
          methodName: value,
          method,
          target,
        });
      }
    }
  };
}
