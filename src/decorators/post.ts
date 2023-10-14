import { createPath } from "../utils";

export default function Post(path?: string) {
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
