import { Config } from "./types";

export class ServeValidator {
  constructor(private config: Config) {}
  validate() {
    this.checkConfigIsObject()
      .checkControllersIsArray()
      .checkControllersIsNotEmpty()
      .checkGroupsIsArray()
      .checkMiddlewaresIsArray()
      .checkErrorHandlerIsFunction()
      .checkPortIsNumber()
      .checkHostnameIsString()
      .checkServeOptionsIsObject()
      .checkPrefixIsString()
      .checkGroupsOrControllersIsNotEmpty()
      .checkGroupMiddlewaresIsArray()
      .checkNotFoundHandlerIsFunction();
  }

  private checkConfigIsObject() {
    if (!this.config || typeof this.config !== "object") {
      throw new Error("Config must be an Config object");
    }

    return this;
  }

  private checkControllersIsArray() {
    if (this.config.controllers && !Array.isArray(this.config.controllers)) {
      throw new Error("Controllers must be an array");
    }

    if (this.config.controllers) {
      for (const controller of this.config.controllers) {
        if (!controller.prototype && typeof controller !== "object")
          throw new Error("Controller must be a class");

        if (
          typeof controller === "object" &&
          !Reflect.getMetadata("routes", controller)
        )
          throw new Error(
            `Controller must be decorated with @Controller decorator in ${controller?.name}`
          );

        if (
          typeof controller !== "object" &&
          !Reflect.getMetadata("routes", controller.prototype)
        )
          throw new Error(
            `Controller must be decorated with @Controller decorator in ${controller?.name}`
          );
      }
    }
    return this;
  }

  private checkControllersIsNotEmpty() {
    if (this.config.controllers && this.config.controllers.length === 0) {
      throw new Error("Controllers must not be empty");
    }

    return this;
  }

  private checkGroupsIsArray() {
    if (this.config.groups && !Array.isArray(this.config.groups)) {
      throw new Error("Groups must be an array");
    }

    if (this.config.groups) {
      for (const { controllers } of this.config.groups) {
        if (!controllers || !Array.isArray(controllers)) {
          throw new Error("Group Controllers must be an array");
        }

        for (const controller of controllers) {
          if (!controller.prototype && typeof controller !== "object")
            throw new Error("Controller must be a class");
          
          if (
            typeof controller === "object" &&
            !Reflect.getMetadata("routes", controller)
          )
            throw new Error(
              `Controller must be decorated with @Controller decorator in ${controller?.name}`
            );

          if (
            typeof controller !== "object" &&
            !Reflect.getMetadata("routes", controller.prototype)
          )
            throw new Error(
              `Controller must be decorated with @Controller decorator in ${controller?.name}`
            );
        }
      }
    }
    return this;
  }

  private checkGroupsOrControllersIsNotEmpty() {
    if (!this.config.controllers && !this.config.groups) {
      throw new Error("Either groups or controllers must be provided");
    }

    if (
      (this.config.controllers?.length ?? 0) === 0 &&
      (this.config.groups?.length ?? 0) === 0
    ) {
      throw new Error("Either groups or controllers must be provided");
    }

    return this;
  }

  private checkMiddlewaresIsArray() {
    if (this.config.middlewares && !Array.isArray(this.config.middlewares)) {
      throw new Error("Middlewares must be an array");
    }

    if (this.config.middlewares) {
      for (const middleware of this.config.middlewares) {
        if (typeof middleware !== "function") {
          throw new Error("Middleware must be a function");
        }

        if (middleware.length !== 1) {
          throw new Error(
            `Middleware must have Context as parameter in ${middleware.name}`
          );
        }
      }
    }

    return this;
  }

  private checkErrorHandlerIsFunction() {
    if (
      this.config.errorHandler &&
      typeof this.config.errorHandler !== "function"
    ) {
      throw new Error("ErrorHandler must be a function");
    }

    return this;
  }

  private checkPortIsNumber() {
    if (
      this.config.serveOptions?.port &&
      isNaN(Number(this.config.serveOptions?.port))
    ) {
      throw new Error("Port must be a number");
    }

    return this;
  }

  private checkHostnameIsString() {
    if (
      this.config.serveOptions?.hostname &&
      typeof this.config.serveOptions?.hostname !== "string"
    ) {
      throw new Error("Hostname must be a string");
    }

    return this;
  }

  private checkServeOptionsIsObject() {
    if (
      this.config.serveOptions &&
      typeof this.config.serveOptions !== "object"
    ) {
      throw new Error("BunServeOptions must be an object");
    }

    return this;
  }

  private checkPrefixIsString() {
    if (this.config.prefix && typeof this.config.prefix !== "string") {
      throw new Error("Prefix must be a string");
    }

    return this;
  }

  private checkGroupMiddlewaresIsArray() {
    if (this.config.groups) {
      for (const { middlewares } of this.config.groups) {
        if (middlewares && !Array.isArray(middlewares)) {
          throw new Error("Group Middlewares must be an array");
        }

        if (middlewares) {
          for (const middleware of middlewares) {
            if (typeof middleware !== "function") {
              throw new Error("Middleware must be a function");
            }

            if (middleware.length !== 1) {
              throw new Error(
                `Middleware must have Context as parameter in ${middleware.name}`
              );
            }
          }
        }
      }
    }

    return this;
  }

  private checkNotFoundHandlerIsFunction() {
    if (
      this.config.notFoundHandler &&
      typeof this.config.notFoundHandler !== "function"
    ) {
      throw new Error("NotFoundHandler must be a function");
    }

    return this;
  }
}
