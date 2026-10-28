"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaString}`;
    }
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`\x1b[36m${this.formatMessage(LogLevel.DEBUG, message, meta)}\x1b[0m`);
        }
    }
    info(message, meta) {
        console.info(`\x1b[32m${this.formatMessage(LogLevel.INFO, message, meta)}\x1b[0m`);
    }
    warn(message, meta) {
        console.warn(`\x1b[33m${this.formatMessage(LogLevel.WARN, message, meta)}\x1b[0m`);
    }
    error(message, meta) {
        console.error(`\x1b[31m${this.formatMessage(LogLevel.ERROR, message, meta)}\x1b[0m`);
    }
}
exports.logger = new Logger();
