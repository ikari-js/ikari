import { Config } from "./types";

export class ServeValidator {
  constructor(private config: Config) {}
  validate() {
    this.checkConfigIsObject()
      .checkControllersIsArray()
      .checkControllersIsNotEmpty()
      .checkGroupsIsArray()
      .checkMiddlewaresIsArray()
      .checkLoggerIsObject()
      .checkErrorHandlerIsFunction()
      .checkPortIsNumber()
      .checkHostnameIsString()
      .checkBunServeOptionsIsObject();
  }

  private checkConfigIsObject() {
    if (!this.config || typeof this.config !== "object") {
      throw new Error("Config must be an Config object");
    }

    return this;
  }

  private checkControllersIsArray() {
    // TODO: check if all controllers are valid Controller type
    if (!Array.isArray(this.config.controllers)) {
      throw new Error("Controllers must be an array");
    }

    return this;
  }

  private checkControllersIsNotEmpty() {
    if (this.config.controllers.length === 0) {
      throw new Error("Controllers must not be empty");
    }

    return this;
  }

  private checkGroupsIsArray() {
    // TODO: check if all groups are valid Group type
    if (this.config.groups && !Array.isArray(this.config.groups)) {
      throw new Error("Groups must be an array");
    }

    return this;
  }

  private checkMiddlewaresIsArray() {
    // TODO: check if all controllers are valid Middleware type
    if (this.config.middlewares && !Array.isArray(this.config.middlewares)) {
      throw new Error("Middlewares must be an array");
    }

    return this;
  }

  private checkLoggerIsObject() {
    // TODO: check if logger is valid Logger type
    // TODO: default logger
    if (this.config.logger && typeof this.config.logger !== "object") {
      throw new Error("Logger must be an object");
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
    if (this.config.port && isNaN(Number(this.config.port))) {
      throw new Error("Port must be a number");
    }

    return this;
  }

  private checkHostnameIsString() {
    if (this.config.hostname && typeof this.config.hostname !== "string") {
      throw new Error("Hostname must be a string");
    }

    return this;
  }

  private checkBunServeOptionsIsObject() {
    if (
      this.config.bunServeOptions &&
      typeof this.config.bunServeOptions !== "object"
    ) {
      throw new Error("BunServeOptions must be an object");
    }

    return this;
  }
}
