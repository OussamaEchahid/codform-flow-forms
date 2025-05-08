
/**
 * Simple logger utility for connection debugging
 */
class ConnectionLogger {
  private readonly LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
  private readonly LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[Shopify Connection][DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[Shopify Connection][INFO] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[Shopify Connection][WARN] ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[Shopify Connection][ERROR] ${message}`, ...args);
    }
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: keyof typeof this.LEVELS): boolean {
    return this.LEVELS[level] >= this.LEVELS[this.LOG_LEVEL as keyof typeof this.LEVELS];
  }
}

export const connectionLogger = new ConnectionLogger();
