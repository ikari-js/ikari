import { Handler }  from "../type";

export default function Middleware(...middlewares: Handler[]) {
  return function (target: any, propertyKey: string | symbol) {
    Reflect.defineMetadata("preMiddlewares", middlewares, target, propertyKey);
  };
}
