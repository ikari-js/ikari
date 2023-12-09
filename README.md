<div align="center">
  <h3 align="center">ikari</h3>

  <p align="center">
    Elagant Web Framework for Bun.
    <br />
  </p>  
</div>

<div align="center">

![npm](https://img.shields.io/npm/v/ikari) ![npm](https://img.shields.io/npm/dt/ikari) ![GitHub](https://img.shields.io/github/license/ikari-js/ikari) ![GitHub stars](https://img.shields.io/github/stars/ikari-js/ikari) ![GitHub last commit](https://img.shields.io/github/last-commit/ikari-js/ikari)</div>

## Quick Start

### Install

```shell
bun add ikari
```

### TypeScript Configuration

> :warning: ikari requires TypeScript experimental decorators features to be enabled. To enable these features, add the following configuration to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
  }
}
```

### Create first controller

```typescript
import { Context, Serve } from "ikari";
import { Controller, Get } from "ikari/decorators";

@Controller("/")
class IkariController {
  @Get("/")
  async index(ctx: Context) {
    return ctx.string("Hello Ikari");
  }
}

Serve({
  controllers: [IkariController],
});

```
<br>
<br>
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#motivation">Motivation</a></li>
    <li><a href="#features">Features</a></li>
      <ul>
        <li><a href="#controller">Controller</a></li>
        <li><a href="#get-post-put-patch-delete-options-head">GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD</a></li>
        <li><a href="#all">ALL</a></li>
        <li><a href="#middleware">Middleware</a></li>
      </ul>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#routing-groups">Routing Groups</a></li>
    <li><a href="#server">Server</a></li>
    <li><a href="#context">Context</a></li>
    <li><a href="#official-middlewares">Official Middlewares</a></li>
    <li><a href="#contributors">Contributors</a></li>
  </ol>
</details>
<br>
<br>

## About The Project
Welcome to ikari, a powerful TypeScript-based HTTP framework meticulously designed for elegant and enterprise-level applications. Born with a focus on providing a seamless experience for [bun](https://github.com/oven-sh/bun) runtime, ikari leverages TypeScript's strong typing capabilities to ensure robustness and maintainability in your web applications.


## Motivation
ikari is built with a straightforward vision: TypeScript decorators. This choice is aimed at creating an enterprise-ready framework with simplicity at its core. TypeScript decorators provide an organized and scalable way to structure code, simplifying feature implementation and ensuring adaptability to changing project needs. This approach prioritizes a developer-friendly experience, enhancing code readability and speeding up development. In essence, ikari embraces TypeScript decorators to make web development simple, scalable, and enjoyable.


## Features

### Decorators

ikari provides a set of decorators to help you build your web application. These decorators are designed to be simple and intuitive, allowing you to focus on your application's logic.

#### Controller

The `Controller` decorator is used to define a controller class. This decorator takes a path as its first argument, which will be used as the base path for all routes defined in the controller.

```typescript
@Controller("/users")
class UserController {}
```

#### GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD

These decorators are used to define routes in a controller. They take a path as their first argument, which will be appended to the base path of the controller. The path can also contain parameters. If path argument are not provided function name will be used as path.

> :warning: Path parameters like `/users/:id` will be accessible in the `ctx.params` object. If you want to access the value of a path parameter, you can use `ctx.params.id` or `ctx.param("id")`.


```typescript
import { Context, Serve } from "ikari";
import { Controller, Get, Post, Put, Patch, Delete, Options, Head } from "ikari/decorators";

@Controller("/users")
class UserController {
  @Get("/list")
  async list(ctx: Context) {
    // logic here
  }

  @Get("/detail/:id")
  async detail(ctx: Context) {
    // :id will be replaced with the value of id in ctx.params.id or ctx.param("id")
    // logic here
  }

  @Post("/create")
  async create(ctx: Context) {
    // logic here
  }

  @Put("/update")
  async update(ctx: Context) {
    // logic here
  }

  @Patch("/patch")
  async patch(ctx: Context) {
    // logic here
  }

  @Delete("/delete")
  async delete(ctx: Context) {
    // logic here
  }

  @Options("/options")
  async options(ctx: Context) {
    // logic here
  }

  @Head("/head")
  async head(ctx: Context) {
    // logic here
  }
}

Serve({
  controllers: [UserController],
});
```

#### ALL 

The `ALL` decorator is used to define a route that matches all HTTP methods. It takes a path as its first argument, which will be appended to the base path of the controller. The path can also contain parameters. If path argument are not provided function name will be used as path.

```typescript
import { Context, Serve } from "ikari";
import { Controller, All } from "ikari/decorators";

@Controller("/users")
class UserController {
  @All("/list")
  async list(ctx: Context) {
    // logic here
  }
}

Serve({
  controllers: [UserController],
});
```

#### Middleware

ikari provides a `Before` and `After` decorator to define middleware for routes. These decorators take a `Handler` type functions array as their first argument. The middleware will be executed in the order they are defined. For controller level middleware see [Configuration](#configuration).

> :information_source: Handler type is `Handler = (ctx: Context) => Context | Promise<Context> | void | Promise<void>` and you can find it in `import { Handler } from "ikari";`

```typescript 
import { Context, Serve } from "ikari";
import { Controller, Get, Before, After } from "ikari/decorators";

@Controller("/users")

function authMiddleware(ctx: Context) {
  // logic here
  return ctx.next();
}

function loggerMiddleware(ctx: Context) {
  // logic here
  return ctx.next();
}


class UserController {
  @Get("/list")
  @Before([authMiddleware])
  @After([loggerMiddleware])
  async list(ctx: Context) {
    // logic here
  }
}

Serve({
  controllers: [UserController],
});
```

## Configuration

ikari provides a `Config` type to define configuration for your application. This type is used in `Serve` function.

- `prefix` is used to define a prefix for all routes in your application. Default value is empty string. 
  - Example: `prefix: "/api"`
- `controllers` is used to define controllers for your application. 
  - Example: `controllers: [UserController]` or `controllers: [UserController, PostController]`
- `middlewares` is used to define middleware for your application. 
  - Example: `middlewares: [authMiddleware, loggerMiddleware]`
- `errorHandler` is used to define a global error handler for your application. 
  - Example: `errorHandler: (err: Errorlike) => Response | Promise<Response>`. It is replace with default error handler if not provided. If not provided default error handler will be used.
- `disableStartupMessage` is used to disable startup message. Default value is `false`. 
  - Example: `disableStartupMessage: true`
- `strict` is used to enable strict trailing slash handling for routes. Default value is `false`. 
  - Example: `strict: true`. If you enable strict mode, `/users` and `/users/` will be different routes.
- `serveOptions` is used to define bun serve options. 
  - Example: `serveOptions: { port: 3000 }`. You can provide all bun serve options here.
- `group` is used to define a group for your application. See [Routing Groups](#routing-groups) for more information


```typescript
import { Config, Serve } from "ikari";
import { UserController } from "./controllers/user.controller";
import { authMiddleware, loggerMiddleware } from "./middlewares";

const config: Config = {
  prefix: "/api",
  controllers: [UserController],
  middlewares: [authMiddleware, loggerMiddleware],
  errorHandler: (err) => {
    // logic here
  },
  disableStartupMessage: true,
  strict: false,
  serveOptions: {
    port: 3000,
  },
};

Serve(config);
```

## Routing Groups

ikari [config](#configuration) provides a `group` property to define a group for your application. This property is used to define a prefix for all routes in your application. You can also define a middleware for your group. This middleware will be executed before all routes in your group.

```typescript 
import { Config, Serve } from "ikari";
import { UserController } from "./controllers/user.controller";
import { PaymentController } from "./controllers/payment.controller";
import { authMiddleware, loggerMiddleware } from "./middlewares";


const config: Config = {
  prefix: "/api",
  middlewares: [authMiddleware],
  group: [
    {
      prefix: "/users",
      controllers: [UserController],
    },
    {
      prefix: "/payments",
      middlewares: [loggerMiddleware],
      controllers: [PaymentController],
    },
  ]
};

Serve(config);
```	

## Server 

ikari return a `Server` object when you call `Serve` function. This object has a `server` property that is a bun server instance. You can use this instance to access bun server methods and properties. Such as `server.stop()` or `server.port`.

```typescript

import { Config, Serve } from "ikari";
import { UserController } from "./controllers/user.controller";
import { authMiddleware, loggerMiddleware } from "./middlewares";


const config: Config = {
  prefix: "/api",
  middlewares: [authMiddleware],
  group: [
    {
      prefix: "/users",
      controllers: [UserController],
    },
  ]
};

const server = Serve(config);
server.stop(); // stop the server
```	

## Context

ikari provides a `Context` object to access ikari context methods and properties. Such as `ctx.params` or `ctx.body()`. You can also use `ctx.next()` to call next middleware or route handler.

- Request specific methods.

  - `ctx.query()` Returns the value of the specified query parameter.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      // GET /users?page=1
      const page = ctx.query("page"); // page = "1"
    }
    ``` 
    </details>

  - `ctx.queries()` Returns all query parameters.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      // GET /users?page=1&limit=10
      const queries = ctx.queries(); // queries = { page: "1", limit: "10" }
    }
    ```
  </details>

  - `ctx.param()` Returns the value of the specified path parameter.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users/:id")
    async detail(ctx: Context) {
      // GET /users/1
      const id = ctx.param("id"); // id = "1"
    }
     ```
  </details>

  - `ctx.params` Returns all path parameters.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users/:id/:name")
    async detail(ctx: Context) {
      // GET /users/1/john-doe
      const params = ctx.params; // params = { id: "1", name: "john-doe" }
    }
    ```
    </details>

  - `ctx.body()` Returns the parsed body of the request. It use `Content-Type` header to parse request body. 
    <details>
    <summary>Example</summary>

    ```typescript
    @Post("/users")
    async create(ctx: Context) {
      // curl -X POST -H "Content-Type: application/json" -d '{"name": "John Doe"}' http://localhost:3000/users  
      const body = await ctx.body(); // body = { name: "John Doe" }
    }
    ```
    </details>

  - `ctx.cookie()` Returns the value of the specified cookie.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const token = ctx.cookie("token"); // token = "123456"
    }
    ```
    </details>

  - `ctx.set()` Sets the specified header to the Response object.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.set("X-Frame-Options", "DENY");
    }
    ```
    </details>

  - `ctx.append()` Appends the specified value to the specified header.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.append("X-RateLimit-Limit", "1000");
    }
    ```
    </details>

  - `ctx.status()` Sets the status code of the Response object.
    
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.status(200);
    }
    ```
    </details>

  - `ctx.ip()` Returns the client's IP address. By default it will return remote-addr, if ipHeader is specified it will return the value of the specified header.
      
    <details>
    <summary>Example</summary>
    
    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const ip = ctx.ip(); // remote-addr
      const xForwardedFor = ctx.ip("x-forwarded-for"); // x-forwarded-for
    }
    ```
    </details>

  - `ctx.authorization()` Returns the value of the Authorization header.
      
    <details>
    <summary>Example</summary>
    
    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const authorization = ctx.authorization();
    }
    ```
    </details>

  - `ctx.redirect()` Redirects to the specified URL with the specified status code. If the status code is not specified it will default to 302.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.redirect("/user/1");
      ctx.redirect("/user/1", 301);
    }
    ```
    </details>

  - `ctx.url()` Returns the full URL of the request.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const url = ctx.url();
    }
    ```
    </details>

  - `ctx.next()` Calls the next handler in the chain.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      return ctx.next();
    }
    ```
    </details>

- Response specific methods.

  - `ctx.setCookie()` Sets the specified cookie to the Response object.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.setCookie("token", { value: "123456", httpOnly: true, expires: new Date("2021-12-31") });
    }
    ```
    </details>

  - `ctx.get()` Returns the value of the specified header from the Request object.
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const userAgent = ctx.get("User-Agent");
    }
    ```
    </details> 

  - `ctx.getStatus()` Returns the status code of the Response object.
    
    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const status = ctx.getStatus();
    }
    ```
    </details>

  - `ctx.getResHeader()` Returns the value of the specified header from the Response object.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const xFrameOptions = ctx.getResHeader("X-Frame-Options");
    }
    ```
    </details>

  - `ctx.json()` Sets the JSON data to the Response object.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.json({ name: "John Doe" });
    }
    ```
    </details>

  - `ctx.string()` Sets the string data to the Response object.
    
    <details>
    <summary>Example</summary>
    
    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.string("Hello World");
    }
    ```
    </details>

  - `ctx.buffer()` Sets the buffer data to the Response object.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.buffer(Buffer.from("Hello World"));
    }
    ```
    </details>

  - `ctx.stream()` Sets the stream data to the Response object.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.stream(fs.createReadStream("file.txt"));
    }
    ```
    </details>

  - `ctx.raw()` Sets the specified Response object to the Context response.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const response = new Response();
      ctx.raw(response);
    }
    ```
    </details>


- Local variables.

  - `ctx.locals.set()` Sets the value of the specified local variable.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.locals.set("name", "John Doe");
    }
    ```
    </details>

  - `ctx.locals.get()` Returns the value of the specified local variable.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const name = ctx.locals.get("name");
    }
    ```
    </details>

  - `ctx.locals.has()` Returns true if the specified local variable exists.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const hasName = ctx.locals.has("name");
    }
    ```
    </details>

  - `ctx.locals.delete()` Deletes the specified local variable.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.locals.delete("name");
    }
    ```
    </details>

  - `ctx.locals.clear()` Clears all local variables.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      ctx.locals.clear();
    }
    ```
    </details>

  - `ctx.locals.all()` Returns all local variables.

    <details>
    <summary>Example</summary>

    ```typescript
    @Get("/users")
    async list(ctx: Context) {
      const locals = ctx.locals.all();
    }
    ```
    </details>


## Official Middlewares

ikari provides a set of official middlewares to help you build your web application. These middlewares are designed to be simple and intuitive, allowing you to focus on your application's logic.

- `CORS` middleware is used to enable CORS with various options. See [cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) for more information.
    <details>
    <summary>Example</summary>

    ```typescript
    import { Context, Serve } from "ikari";
    import { Controller, Get } from "ikari/decorators";
    import { CORS } from "ikari/middlewares/cors";

    @Controller("/users")
    class UserController {
      @Get("/")
      async list(ctx: Context) {
        // logic here
      }
    }

    Serve({
      middlewares: [CORS()],
      controllers: [UserController]
    });
    ``` 
    </details>

- `helmet` middleware is used to set various HTTP headers to help protect your application.
    <details>
    <summary>Example</summary>

    ```typescript
    import { Context, Serve } from "ikari";
    import { Controller, Get } from "ikari/decorators";
    import { helmet } from "ikari/middlewares/helmet";

    @Controller("/users")
    class UserController {
      @Get("/")
      async list(ctx: Context) {
        // logic here
      }
    }

    Serve({
      middlewares: [helmet()],
      controllers: [UserController]
    });
    ``` 
    </details>

## Contributors
<a href = "https://github.com/ikari-js/ikari/graphs/contributors">
  <img src = "https://contrib.rocks/image?repo=ikari-js/ikari"/>
</a>
