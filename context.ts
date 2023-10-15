import { Server } from "bun";

export class Context {
  private parsedUrl: URL;
  constructor(
    private server: Server,
    public req: Request,
    public res: Response = new Response()
  ) {
    this.parsedUrl = new URL(req.url);
  }

  /**
   * Returns the value of the specified query parameter.
   *
   * @example
   * ```ts
   *  const id = ctx.query("id");
   *  console.log(id);
   * ```
   */
  public query(query: string): string | null {
    return this.parsedUrl.searchParams.get(query);
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
      // TODO maybe we can set cookies in init and then use this.req.cookies.get(name)
      this.req.headers
        .get("Cookie")
        ?.split(";")
        .find((c) => c.startsWith(name))
        ?.split("=")[1] || null
    );
  }

  // TODO
  // params
  // baseUrl
  // form values
  // locals
  // redirect
  // save file
  // status | nocontent
  // json
  // isFromLocal
  // auth
}
