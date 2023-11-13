import { Context } from "../context";
import { Logger, LoggerFormats, LoggerFunction } from "./type";

export default class DefaultLogger implements Logger {
  private loggerFunctions: Map<LoggerFormats, LoggerFunction>;
  private availableFormats: LoggerFormats[] = ["json", "text"];
  public format: LoggerFormats = "text";

  constructor(format: LoggerFormats = "text") {
    this.loggerFunctions = new Map([
      ["json", this.jsonLogger],
      ["text", this.textLogger],
    ]);

    this.setFormat(format);
  }

  public setFormat(format: LoggerFormats) {
    if (!this.availableFormats.includes(format)) {
      throw new Error(`Format ${format} is not supported`);
    }
    this.format = format;
  }

  private jsonLogger = (ctx: Context) => {
    return JSON.stringify({
      ip: ctx.ip(),
      method: ctx.req.method,
      url: ctx.req.url,
      status: ctx.getStatus(),
    });
  };

  private textLogger = (ctx: Context) => {
    return `${ctx.ip()} - ${ctx.req.method} ${ctx.req.url} ${ctx.getStatus()} `;
  };

  public logger = (ctx: Context) => {
    // TODO add color
    console.log(this.loggerFunctions.get(this.format)?.(ctx));
  };
}
