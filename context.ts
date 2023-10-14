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
  
    public query(query: string): string | null {
      return this.parsedUrl.searchParams.get(query);
    }
  
    public ip(ipHeader?: string): any {
      if (ipHeader) {
        return this.req.headers.get(ipHeader);
      }
  
      return this.server.requestIP(this.req);
    }
  
    // TODO
    // params
    // baseUrl
    // cookies
    // form values
    // locals
    // redirect
    // save file
    // status | nocontent
    // json
    // isFromLocal
    // auth
  }