import { Middleware } from "../type";

export default function Middleware(...middlewares: Middleware[]) {
  return function (target: any, propertyKey: string | symbol) {
    // TODO Befor or After
    Reflect.defineMetadata("preMiddlewares", middlewares, target, propertyKey);
  };
}
