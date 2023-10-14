## Bun Class Based HTTP Server

### Decorators

- [x] Controller
- [x] Post
- [x] Get
- [ ] Put
- [ ] Delete
- [ ] Patch
- [ ] Options // just return headers
- [ ] Head // just return headers
- [ ] Trace ???
- [ ] All
- [x] Middleware

### Built-in Middlewares

- [ ] BasicAuth
- [ ] Cache
- [ ] Cors
- [ ] Csrf
- [ ] Gzip
- [ ] Limiter
- [ ] Logger
- [ ] Monitor
- [ ] Proxy
- [ ] Redirect
- [ ] JWT
- [ ] Prometheus
- [ ] RequestID
- [ ] Static
- [ ] Security
- [ ] Session
- [ ] Documentor
- [ ] Validator

### Sample Config File

```typescript
const ServerOptions = {
  port: 3000,
  host: "localhost",
  controllers: [ApiController],
  groups: [
    {
      prefix: "/api",
      middlewares: [CorsMiddleware],
      controllers: [ApiController],
    },
    {
      prefix: "/admin",
      middlewares: [CorsMiddleware],
      controllers: [AdminController],
    },
  ],
  errorHandler: (err: Error, req: Request, res: Response, next: Next) => {
    res.status(500).send("Something broke!");
  },
  middlewares: [
    // Note: The order of the middlewares is important
    CorsMiddleware,
    MyMiddleware,
  ],
  logger: logger,
  ...BunServerOptions,
};
```

### Sample Controller

```typescript
@Controller("/api")
export class ApiController {
  @Get("/hello")
  public hello(req: Request, res: Response) {
    res.send("Hello World");
  }

  @Post("/hello")
  public helloPost(req: Request, res: Response) {
    res.send("Hello World");
  }

  @Put("/hello")
  public helloPut(req: Request, res: Response) {
    res.send("Hello World");
  }

  @Delete("/hello")
  public helloDelete(req: Request, res: Response) {
    res.send("Hello World");
  }

  @Patch("/hello")
  public helloPatch(req: Request, res: Response) {
    res.send("Hello World");
  }

  @Options("/hello")
  public helloOptions(req: Request, res: Response) {
    res.send("Hello World");
  }

  @Head("/hello")
  public helloHead(req: Request, res: Response) {
    res.send("Hello World");
  }

  @Trace("/hello")
  public helloTrace(req: Request, res: Response) {
    res.send("Hello World");
  }

  @All("/hello")
  public helloAll(req: Request, res: Response) {
    res.send("Hello World");
  }
}
```

### Sample Server

```typescript
import { Server } from "bun-http";

const server = new Server(ServerOptions);
server.start();
```

### Sample Cors Middleware

```typescript

import { Middleware, Request, Response, Next } from 'bun-http';

interface Middleware {
    use(req: Request, res: Response, next: Next): void;
}

@Middleware()
export class CorsMiddleware implements Middleware {
    public use(req: Request, res: Response, next: Next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        next();
    }

    public ignore(req: Request, res: Response, next: Next) {
        console.log('CorsMiddleware ignore');
        next();
    }
}

function CorsMiddlewareDecorator {
    return function (target: any) {
        target.prototype.use = new CorsMiddleware().use;
        target.prototype.ignore = new CorsMiddleware().ignore;
    }
}

```

### Sample Custom Middleware

```typescript

import { Middleware, Request, Response, Next } from 'bun-http';

interface Middleware {
    use(req: Request, res: Response, next: Next): void;
}

@Middleware()
export class MyMiddleware implements Middleware {

    public use(req: Request, res: Response, next: Next) {
        console.log('MyMiddleware');
        next();
    }

    public ignore(req: Request, res: Response, next: Next) {
        console.log('MyMiddleware ignore');
        next();
    }

}

function MyMiddlewareDecorator {
    return function (target: any) {
        target.prototype.use = new MyMiddleware().use;
        target.prototype.ignore = new MyMiddleware().ignore;
    }
}

```
