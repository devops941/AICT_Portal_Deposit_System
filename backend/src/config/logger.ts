export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  debug(message: string, meta?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`\x1b[36m${this.formatMessage(LogLevel.DEBUG, message, meta)}\x1b[0m`);
    }
  }

  info(message: string, meta?: unknown): void {
    console.info(`\x1b[32m${this.formatMessage(LogLevel.INFO, message, meta)}\x1b[0m`);
  }

  warn(message: string, meta?: unknown): void {
    console.warn(`\x1b[33m${this.formatMessage(LogLevel.WARN, message, meta)}\x1b[0m`);
  }

  error(message: string, meta?: unknown): void {
    console.error(`\x1b[31m${this.formatMessage(LogLevel.ERROR, message, meta)}\x1b[0m`);
  }
}

export const logger = new Logger();
