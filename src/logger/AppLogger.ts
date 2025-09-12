export type LogLevel = "error" | "warn" | "info" | "debug";

type LogBindings = Record<string, unknown>;

export interface LogTransport {
  write(
    level: LogLevel,
    message: string,
    meta: unknown[],
    bindings?: LogBindings
  ): void;
}

const levelPriority: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

class ConsoleTransport implements LogTransport {
  write(
    level: LogLevel,
    message: string,
    meta: unknown[],
    bindings?: LogBindings
  ) {
    const ts = new Date().toISOString();
    const prefixParts: string[] = [ts];
    const name =
      typeof bindings?.name === "string" ? bindings?.name : undefined;
    if (name) prefixParts.push(name);
    const prefix = `[${prefixParts.join("] [")}]`;

    const payload =
      bindings && Object.keys(bindings).length > 0
        ? [{ bindings }, ...meta]
        : meta;

    switch (level) {
      case "error":
        // eslint-disable-next-line no-console
        console.error(prefix, message, ...payload);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(prefix, message, ...payload);
        break;
      case "info":
        // eslint-disable-next-line no-console
        console.info(prefix, message, ...payload);
        break;
      case "debug":
      default:
        // eslint-disable-next-line no-console
        console.log(prefix, message, ...payload);
        break;
    }
  }
}

export type AppLoggerOptions = {
  level?: LogLevel;
  name?: string;
  bindings?: LogBindings;
  transports?: LogTransport[];
};

/**
 * App-wide logger compatible with coco-cashu-core and cashu-kym Logger interfaces.
 * - Level filtering
 * - Child loggers with inherited bindings
 * - Pluggable transports (console by default)
 */
export class AppLogger {
  private readonly minLevel: LogLevel;
  private readonly transports: LogTransport[];
  private readonly bindings: LogBindings;

  constructor(options?: AppLoggerOptions) {
    this.minLevel = options?.level ?? "info";
    this.bindings = {
      ...(options?.bindings ?? {}),
      ...(options?.name ? { name: options.name } : {}),
    };
    this.transports =
      options?.transports && options.transports.length > 0
        ? options.transports
        : [new ConsoleTransport()];
  }

  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] <= levelPriority[this.minLevel];
  }

  private write(level: LogLevel, message: string, meta: unknown[]) {
    if (!this.shouldLog(level)) return;
    for (const transport of this.transports)
      transport.write(level, message, meta, this.bindings);
  }

  // Overloads to satisfy both libraries
  error(message: string, context?: Record<string, unknown>): void;
  error(message: string, ...meta: unknown[]): void;
  error(message: string, ...metaOrContext: unknown[]): void {
    const meta =
      metaOrContext.length === 1 && isPlainObject(metaOrContext[0])
        ? [metaOrContext[0]]
        : metaOrContext;
    this.write("error", message, meta);
  }

  warn(message: string, context?: Record<string, unknown>): void;
  warn(message: string, ...meta: unknown[]): void;
  warn(message: string, ...metaOrContext: unknown[]): void {
    const meta =
      metaOrContext.length === 1 && isPlainObject(metaOrContext[0])
        ? [metaOrContext[0]]
        : metaOrContext;
    this.write("warn", message, meta);
  }

  info(message: string, context?: Record<string, unknown>): void;
  info(message: string, ...meta: unknown[]): void;
  info(message: string, ...metaOrContext: unknown[]): void {
    const meta =
      metaOrContext.length === 1 && isPlainObject(metaOrContext[0])
        ? [metaOrContext[0]]
        : metaOrContext;
    this.write("info", message, meta);
  }

  debug(message: string, context?: Record<string, unknown>): void;
  debug(message: string, ...meta: unknown[]): void;
  debug(message: string, ...metaOrContext: unknown[]): void {
    const meta =
      metaOrContext.length === 1 && isPlainObject(metaOrContext[0])
        ? [metaOrContext[0]]
        : metaOrContext;
    this.write("debug", message, meta);
  }

  log(level: LogLevel, message: string, ...meta: unknown[]): void {
    this.write(level, message, meta);
  }

  child(bindings: LogBindings): AppLogger {
    return new AppLogger({
      level: this.minLevel,
      transports: this.transports,
      bindings: { ...this.bindings, ...bindings },
    });
  }
}
