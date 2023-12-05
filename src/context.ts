import { Server } from "bun";
import { Handler } from "./types";
import { HttpMethod } from "./utils";
import { parse } from "fast-querystring";

export class Context {
  private _queries: Record<string, string> | null = null;
  private _locals: Local | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _body: any | FormData | string | null = null;
  private _cookies: Map<string, string> | null = null;

  constructor(
    private server: Server,
    public req: Request,
    public routes: Routes,
    /**
     * The all path parameters of the request.
     */
    public params: Record<string, string>,
    public res: Response = new Response()
  ) {}

  /**
   * Locals makes it possible to pass any values under keys scoped to the request
   * and therefore available to all following routes that match the request.
   */
  public get locals(): Local {
    if (!this._locals) {
      this._locals = new Local();
    }
    return this._locals;
  }

  /**
   * Calls the next handler in the chain.
   *
   */
  public next(): Context {
    this.routes.next();
    return this;
  }

  /**
   * Returns the value of the specified query parameter.
   *
   * @example
   * ```ts
   *  // route: /test?id=1
   *  const id = ctx.query("id");
   *  console.log(id); // 1
   * ```
   */
  public query(query: string): string | null {
    if (!this._queries) {
      this._queries = parse(this.req.url.split("?")[1]);
    }
    return this._queries[query] || null;
  }

  /**
   * Returns the all query parameters.
   *
   * @example
   * ```ts
   * // route: /test?id=1&name=test
   * const queries = ctx.queries();
   * console.log(queries);
   * // URLSearchParams { 'id' => '1', 'name' => 'test' }
   * ```
   */
  public queries(): Record<string, string> | null {
    if (!this._queries) {
      this._queries = parse(this.req.url.split("?")[1]);
    }
    return this._queries;
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
    if (this._cookies) return this._cookies.get(name) || null;
    const cookies = new Map<string, string>();
    this.req.headers
      .get("Cookie")
      ?.split(";")
      .forEach((c) => {
        const [key, value] = c.split("=");
        cookies.set(key.trim(), value.trim());
      });
    this._cookies = cookies;

    return this._cookies.get(name) || null;
  }

  /**
   * Sets the specified cookie to the Response object.
   * @example
   * ```ts
   * ctx.setCookie("cookieName", {
   *  value: "cookieValue",
   *  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
   * });
   * ```
   */
  public setCookie(
    name: string,
    cookie: {
      value: string;
      expires?: Date;
      maxAge?: number;
      domain?: string;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "Strict" | "Lax" | "None";
    }
  ): void {
    const cookieStr = `${name}=${cookie.value}; ${
      cookie.expires ? `Expires=${cookie.expires.toUTCString()};` : ""
    } ${cookie.maxAge ? `Max-Age=${cookie.maxAge};` : ""} ${
      cookie.domain ? `Domain=${cookie.domain};` : ""
    } ${cookie.path ? `Path=${cookie.path};` : ""} ${
      cookie.secure ? `Secure;` : ""
    } ${cookie.httpOnly ? `HttpOnly;` : ""} ${
      cookie.sameSite ? `SameSite=${cookie.sameSite};` : ""
    }`;

    return this.append("Set-Cookie", cookieStr);
  }

  /**
   * Appends the specified value to the specified header.
   * @example
   * ```ts
   * ctx.append("X-Request-Id", "123");
   * ```
   */
  public append(name: string, value: string): void {
    return this.res.headers.append(name, value);
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

  /**
   * Returns the value of the specified path parameter.
   *
   * @example
   * ```ts
   * // route: /test/:id => /test/1
   * const id = ctx.param("id");
   * console.log(id); // 1
   * ```
   */
  public param(name: string): string | null {
    return this.params[name] || null;
  }

  /**
   * Returns the parsed body of the request. If the Content-Type is application/json it will return a JSON object, if the Content-Type is application/x-www-form-urlencoded it will return a URLSearchParams object, if the Content-Type is multipart/form-data it will return a FormData object, otherwise it will return a string.
   * If the request does not have Content-Type header it will return the body as string.
   *
   * @example
   * ```ts
   * const body = await ctx.body();
   * console.log(body);
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async body(): Promise<any | FormData | string | ArrayBuffer> {
    if (this.method === HttpMethod.GET || this.method === HttpMethod.HEAD)
      return null;
    if (this.req.bodyUsed) return this._body;

    const contentType = this.get("Content-Type")?.split(";")[0] || "";

    switch (contentType) {
      case "application/json":
        this._body = this.req.json();
        break;
      case "application/x-www-form-urlencoded":
        this._body = this.req.formData();
        break;
      case "multipart/form-data":
        this._body = this.req.formData();
        break;
      case "text/plain":
        this._body = this.req.text();
        break;
      case "application/octet-stream":
        this._body = this.req.arrayBuffer();
        break;
      default:
        this._body = this.req.text();
        break;
    }

    return this._body;
  }

  /**
   * Redirects to the specified URL with the specified status code. If the status code is not specified it will default to 302.
   *
   * @example
   * ```ts
   * ctx.redirect("/test-route");
   * ctx.redirect("https://google.com");
   *
   * ```
   */
  public redirect(url: string, status: number = 302): void {
    if (status < 300 || status > 399) {
      throw new Error("Invalid redirect status code");
    }
    let href = url;
    if (!url.startsWith("http")) {
      href = new URL(url, this.req.url).href;
    } else {
      href = url;
    }

    this.res = new Response(null, {
      status,
      headers: {
        location: href,
      },
    });
  }

  /**
   * Sets the status code of the Response object.
   *
   * @example
   * ```ts
   * ctx.status(204);
   * ```
   */
  public status(status: number): Context {
    if (status < 100 || status > 599) {
      throw new Error("Invalid status code");
    }

    this.res = new Response(null, {
      status: status,
      headers: {
        ...this.res.headers.toJSON(),
      },
    });

    return this;
  }

  /**
   * Returns the status code of the Response object.
   *
   * @example
   * ```ts
   * const status = ctx.getStatus();
   * console.log(status);
   * ```
   */
  public getStatus(): number {
    return this.res.status;
  }

  /**
   * Sets the JSON data to the Response object.
   *
   * @example
   * ```ts
   * ctx.json({ data: "Hello World" });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public json(data: any, status?: number): Context {
    // TODO adition control for data
    let jsonData;
    if (typeof data === "string") {
      jsonData = data;
    } else {
      jsonData = JSON.stringify(data);
    }

    this.res = new Response(jsonData, {
      status: status || this.res.status,
      headers: {
        ...this.res.headers.toJSON(),
        "Content-Type": "application/json",
      },
    });

    return this;
  }

  /**
   * Sets the specified header with the specified value to the Response object.
   *
   * @example
   * ```ts
   * ctx.set("x-request-id", "123");
   * ```
   */
  public set(key: string, value: string): Context {
    this.res.headers.set(key, value);

    return this;
  }

  /**
   * Returns the value of the specified header from the Request object.
   *
   * @example
   * ```ts
   * const xRequestId = ctx.get("x-request-id");
   * console.log(xRequestId);
   * ```
   */
  public get(key: string): string | null {
    return this.req.headers.get(key);
  }

  /**
   * Returns the value of the specified header from the Response object.
   *
   * @example
   * ```ts
   * const xCorrelationId = ctx.getResHeader("x-correlation-id");
   * console.log(xCorrelationId);
   */
  public getResHeader(key: string): string | null {
    return this.res.headers.get(key);
  }

  public getResWithoutBody(): Response {
    return new Response(null, {
      status: this.res.status,
      headers: this.res.headers,
    });
  }

  /**
   * Return the URL string of the request.
   */
  public url(): string {
    return this.req.url;
  }

  /**
   * Sets the specified string to the Response object.
   * @example
   * ```ts
   * ctx.string("Hello World");
   * ```
   * @param data
   * @param status Default: 200
   * @param contentType Default: text/plain
   **/
  public string(
    data: string,
    status?: number,
    contentType: string = "text/plain"
  ): Context {
    this.res = new Response(data, {
      status: status || this.res.status,
      headers: {
        ...this.res.headers.toJSON(),
        "Content-Type": contentType,
      },
    });

    return this;
  }

  /**
   * Sets the specified buffer to the Response object.
   * @example
   * ```ts
   * ctx.buffer(Buffer.from("Hello World"));
   * ```
   * @param data
   * @param status Default: 200
   * @param contentType Default: application/octet-stream
   **/
  public buffer(
    data: Buffer,
    status?: number,
    contentType: string = "application/octet-stream"
  ): Context {
    this.res = new Response(data, {
      status: status || this.res.status,
      headers: {
        ...this.res.headers.toJSON(),
        "Content-Type": contentType,
      },
    });

    return this;
  }

  /**
   * Sets the specified stream to the Response object.
   * @example
   * ```ts
   * ctx.stream(fs.createReadStream("test.txt"));
   * ```
   * @param data
   * @param status Default: 200
   * @param contentType Default: application/octet-stream
   **/
  public stream(
    data: ReadableStream,
    status?: number,
    contentType: string = "application/octet-stream"
  ): Context {
    this.res = new Response(data, {
      status: status || this.res.status,
      headers: {
        ...this.res.headers.toJSON(),
        "Content-Type": contentType,
      },
    });

    return this;
  }

  /**
   * Sets the specified Response object to the Context response.
   * @example
   * ```ts
   * ctx.raw(new Response("Hello World"));
   * ```
   * @param data
   **/
  public raw(data: Response): Context {
    this.res = data;
    return this;
  }

  /**
   * Returns the method of the request.
   * @example
   * ```ts
   * const method = ctx.method;
   * console.log(method);
   * ```
   */
  public get method(): string {
    return this.req.method;
  }
}

class Local {
  /**
   * Creates a new Local object.
   */
  // TODO: weakmap
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private locals: Map<string, any> = new Map<string, any>();
  constructor() {}

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
   * ```
   */
  public has(key: string): boolean {
    return this.locals.has(key);
  }

  /**
   * Deletes the specified local variable.
   * @example
   * ```ts
   * ctx.locals.delete("local_value");
   * ```
   */
  public delete(key: string): boolean {
    return this.locals.delete(key);
  }

  /**
   * Deletes all local variables.
   * @example
   * ```ts
   * ctx.locals.clear();
   * ```
   */
  public clear(): void {
    this.locals.clear();
  }
}

export class Routes {
  constructor(public handlers: Handler[], public handlerIndex: number = 0) {}

  public next(): void {
    if (this.hasNext()) {
      this.handlerIndex++;
    }
  }

  public hasNext(): boolean {
    return this.handlerIndex < this.length;
  }

  public currentHandler(): Handler {
    return this.handlers[this.handlerIndex];
  }

  public reset(): void {
    this.handlerIndex = 0;
  }

  public get length(): number {
    return this.handlers.length;
  }

  public get currentIndex(): number {
    return this.handlerIndex;
  }
}
