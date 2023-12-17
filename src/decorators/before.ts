import { FunctionTarget, Handlers } from "../types";

/**
 * Before decorator, used to add middleware before a route handler. Middleware will be executed in order.
 * @param handlers
 *
 */
export function Before(...handlers: Handlers) {
  return function (target: FunctionTarget, key: string) {
    if (!target) return;
    if (!target[key]) return;
    if (typeof target[key] !== "function")
      throw new Error("Before decorator can only be used on functions");

    const before = Reflect.getMetadata("before", target, key);
    if (before) {
      handlers = before.concat(handlers);
    }
    Reflect.defineMetadata("before", handlers, target, key);
  };
}
