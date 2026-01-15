/**
 * Simple Logger Utility
 * Provides consistent logging throughout the application
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private enabled: boolean = true;

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.enabled && this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.enabled && this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.enabled && this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.enabled && this.level <= LogLevel.ERROR) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error.message, error.stack, ...args);
      } else {
        console.error(`[ERROR] ${message}`, error, ...args);
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Set log level from environment
if (process.env.LOG_LEVEL) {
  const envLevel = parseInt(process.env.LOG_LEVEL, 10);
  if (!isNaN(envLevel) && envLevel >= 0 && envLevel <= 3) {
    logger.setLevel(envLevel);
  }
}

if (process.env.NODE_ENV === 'production') {
  logger.setLevel(LogLevel.WARN);
}

