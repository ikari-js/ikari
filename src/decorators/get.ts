import { Context } from "../../context";
import { createPath } from "../utils";

export function Get(path?: string) {
  return function (target: any, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("Get decorator can only be used on functions");
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, key);
    // TODO fix this now we have context and next in the params
    if (paramTypes.length > 2)
      throw new Error(
        "Get decorator can only be used on functions with one parameter"
      );
    if (paramTypes.length === 1 && paramTypes[0] !== Context)
      throw new Error(
        "Get decorator can only be used on functions with one parameter of type Context"
      );

    const returnType = Reflect.getMetadata("design:returntype", target, key);

    const validReturnTypes = [Context, Response, Promise];

    if (returnType && !validReturnTypes.includes(returnType))
      throw new Error(
        "Get decorator can only be used on functions with return type of string"
      );

    const routePath = path ? createPath(path) : createPath(key);
    Reflect.defineMetadata("path", routePath, target, key);
    Reflect.defineMetadata("method", "get", target, key);
  };
}
