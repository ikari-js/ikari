export function createPath(str?: string) {
  if (str && str[0] !== "/") {
    return "/" + str;
  }
  return str;
}

export default function Get(path?: string) {
  return function (target: any, key: string) {
    const routePath = createPath(path) || createPath(key);

    Reflect.defineMetadata("path", routePath, target, key);
    Reflect.defineMetadata("method", "get", target, key);

    // TODO: type check for (ctx: Context) => Response | Promise<Response>
};
}
