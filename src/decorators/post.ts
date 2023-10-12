import { createPath } from "../utils";


export default function Post(path?: string) {
  return function (target: any, key: string) {
    if (!target) return;

    const routePath = path ? createPath(path) : createPath(key);
    Reflect.defineMetadata("path", routePath, target, key);
    if (!target[key]) return;

    if (typeof target[key] !== "function")
      throw new Error("Get decorator can only be used on functions");
    // TODO: type check for (ctx: Context) => Response | Promise<Response>
    Reflect.defineMetadata("method", "post", target, key);
  };
}
