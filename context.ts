import { Server } from "bun";

export class Context {
  private parsedUrl: URL;
  /**
   * Locals makes it possible to pass any values under keys scoped to the request
   * and therefore available to all following routes that match the request.
   */
  public locals: Local;
  constructor(
    private server: Server,
    public req: Request,
    public res: Response = new Response()
  ) {
    this.parsedUrl = new URL(req.url);
    this.locals = new Local();
  }

  /**
   * Returns the value of the specified query parameter.
   *
   * @example
   * ```ts
   *  const id = ctx.query("id");
   *  console.log(id);
   * ```
   * ```
   */
  public query(query: string): string | null {
    return this.parsedUrl.searchParams.get(query);
  }

  /**
   * Returns the all query parameters.
   * @example
   * ```ts
   * const queries = ctx.queries();
   * console.log(queries);
   * ```
   */
  public queries(): URLSearchParams {
    return this.parsedUrl.searchParams;
  }

  /**
   * Returns the client's IP address. By default it will return remote-addr, if ipHeader is specified it will return the value of the specified header.
   *
   * @example
   * ```ts
   *  const remoteAddr = ctx.ip();
   *  const xForwardedFor = ctx.ip("x-forwarded-for");
   *
   * ```
   */
  public ip(ipHeader?: string): string | null {
    if (ipHeader) {
      return this.req.headers.get(ipHeader);
    }

    return this.server.requestIP(this.req)?.address || null;
  }

  /**
   * Returns the value of the specified cookie.
   *
   * @example
   * ```ts
   *  const cookie = ctx.cookie("cookieName");
   *  console.log(cookie);
   * ```
   */
  public cookie(name: string): string | null {
    return (
      // TODO maybe we can set cookies in init and then use this.req.cookies.get(name) for better performance
      this.req.headers
        .get("Cookie")
        ?.split(";")
        .find((c) => c.startsWith(name))
        ?.split("=")[1] || null
    );
  }

  /**
   * Returns the value of the Authorization header.
   *
   * @example
   * ```ts
   *  const authorization = ctx.authorization();
   * ```
   */
  public authorization(): string | null {
    return this.req.headers.get("Authorization");
  }

  // TODO
  // params
  // baseUrl ?? => req.url
  // form values ?? => req.formData()
  // redirect ??
  // save file
  // status | nocontent
  // json
  // get and set headers ??
}

class Local {
  /**
   * Creates a new Local object.
   */
  constructor(private locals = new Map<string, any>()) {}

  /**
   * Returns the value of the specified local variable.
   * @example
   * ```ts
   * const localValue = ctx.locals.get("local_value");
   * console.log(localValue);
   * ```
   */
  public get<T>(key: string): T | undefined {
    return this.locals.get(key);
  }

  /**
   * Sets the value of the specified local variable.
   * @example
   * ```ts
   * ctx.locals.set("local_value", "test");
   * ```
   */
  public set<T>(key: string, value: T): void {
    this.locals.set(key, value);
  }

  /**
   * Returns true if the specified local variable exists.
   * @example
   * ```ts
   * const hasLocalValue = ctx.locals.has("local_value");
   * console.log(hasLocalValue);
   */
  public has(key: string): boolean {
    return this.locals.has(key);
  }
}
