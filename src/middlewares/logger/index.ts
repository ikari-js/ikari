import { Errorlike } from "bun";
import { Context } from "../../context";
import {
  HttpMethod,
  blueColor,
  cyanColor,
  greenColor,
  magentaColor,
  redColor,
  resetColor,
  yellowColor,
} from "../../utils";

export type Config = {
  /**
   * Skip defines a function to skip this middleware when returned true.
   * @default undefined
   */
  skip?: (ctx: Context) => boolean;
  /**
   * Done is a function that is called after the log string for a request is written to Output,
   * and pass the log string as parameter.
   * @default undefined
   */
  done?: (ctx: Context, logString: string) => void;
  /**
   * format defines the logging tags
   * @default [time] [status] [method] [path] [latency]
   */
  format?: string;
  /**
   * timeZone can be specified, such as "UTC" and "America/New_York" and "Asia/Chongqing", etc
   * @default "Local"
   */
  timeZone?: Intl.LocalesArgument;

  /**
   * timeFormat is the time format of the log
   * @default "15:04:05"
   */
  timeFormatOptions?: Intl.DateTimeFormatOptions;
  /**
   * output is a writer where logs are written
   * @default Bun.stdout
   * @example
   * ```ts
   * import { createWriteStream } from "node:fs";
   * import { Logger } from "ikari/logger";
   *
   * Logger({
   *  // createWriteStream can use for loging to file
   *  // or you can use Bun.stdout for logging to console
   *  output: createWriteStream("./api.log", { flags: "a" }),
   * });
   * ```
   */
  output?: Writer;
  /**
   * disableColors defines if the logs output should be colorized
   * @default false
   */
  disableColors?: boolean;
};

export interface Writer {
  write(s: string): void;
}

class DefaultWriter implements Writer {
  write(s: string) {
    // eslint-disable-next-line no-console
    console.log(s);
  }
}

export enum Tags {
  time = "[time]",
  status = "[status]",
  method = "[method]",
  path = "[path]",
  latency = "[latency]",
  ip = "[ip]",
}

const defaultConfig: Config = {
  format: "[ip] [time] [status] [method] [path] [latency]",
  timeFormatOptions: {
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  },
  timeZone: "Local",
  output: new DefaultWriter(),
  disableColors: false,
};

function getDefaultConfig(config: Config): Config {
  return { ...defaultConfig, ...config };
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return greenColor;
  } else if (status >= 300 && status < 400) {
    return cyanColor;
  } else if (status >= 400 && status < 500) {
    return yellowColor;
  } else {
    return redColor;
  }
}

function getMethodColor(method: string): string {
  switch (method) {
    case HttpMethod.GET:
      return greenColor;
    case HttpMethod.POST:
      return yellowColor;
    case HttpMethod.PUT:
      return cyanColor;
    case HttpMethod.DELETE:
      return redColor;
    case HttpMethod.PATCH:
      return magentaColor;
    case HttpMethod.HEAD:
      return greenColor;
    case HttpMethod.OPTIONS:
      return blueColor;
    default:
      return resetColor;
  }
}

export function Logger(config: Config = {}) {
  const cfg = getDefaultConfig(config);

  if (!cfg.format) cfg.format = defaultConfig.format;
  if (!cfg.timeFormatOptions)
    cfg.timeFormatOptions = defaultConfig.timeFormatOptions;
  if (!cfg.timeZone) cfg.timeZone = defaultConfig.timeZone;
  if (!cfg.output) cfg.output = defaultConfig.output;
  if (!cfg.disableColors) cfg.disableColors = defaultConfig.disableColors;

  return async (ctx: Context) => {
    if (cfg.skip && cfg.skip(ctx)) {
      return ctx.next();
    }

    const time = new Date().toLocaleTimeString(
      cfg.timeZone,
      cfg.timeFormatOptions
    );
    const start = new Date().getTime();
    const ip = ctx.ip();
    let error: Errorlike | unknown = null;
    try {
      await ctx.next();
    } catch (e) {
      error = e;
    }
    const end = new Date().getTime();

    const { pathname } = ctx.url;
    const status = ctx.getStatus();

    let logString = "";
    if (cfg.disableColors) {
      logString = cfg
        .format!.replace(Tags.time, time)
        .replace(Tags.status, status.toString())
        .replace(Tags.method, ctx.method)
        .replace(Tags.path, pathname)
        .replace(Tags.latency, `${new Date().getTime() - start}ms`)
        .replace(Tags.ip, `${ip}`)
        .concat(error ? ` | ${error}` : "");
    } else {
      logString = cfg
        .format!.replace(Tags.time, `${time}`)
        .replace(
          Tags.status,
          `${getStatusColor(status)}${status}${getStatusColor(status)}`
        )
        .replace(
          Tags.method,
          `${getMethodColor(ctx.method)}${ctx.method}${getMethodColor(
            ctx.method
          )}`
        )
        .replace(Tags.path, `${cyanColor}${pathname}${resetColor}`)
        .replace(Tags.latency, `${end - start}ms`)
        .replace(Tags.ip, `${yellowColor}${ip}${resetColor}`)
        .concat(error ? ` | ${redColor}${error}${resetColor}` : "");
    }

    cfg.output!.write(logString);
    if (cfg.done) {
      cfg.done(ctx, logString);
    }

    if (error) {
      throw error;
    }
  };
}
