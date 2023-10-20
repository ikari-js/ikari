import { Middleware } from "../type";

// TODO Should be middleware decorator, maybe we can use Class for middleware or just use function
export function Middleware(...middlewares: Middleware[]) {}
