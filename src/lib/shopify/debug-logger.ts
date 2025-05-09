
/**
 * Simple logger utility for connection debugging
 */
export class ConnectionLogger {
  private readonly LOG_LEVEL: string;
  private readonly LEVELS: Record<string, number>;
  
  constructor(prefix: string = 'Shopify Connection') {
    this.LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    this.LEVELS = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    this.prefix = prefix;
  }

  private prefix: string;

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[${this.prefix}][DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[${this.prefix}][INFO] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[${this.prefix}][WARN] ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[${this.prefix}][ERROR] ${message}`, ...args);
    }
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: string): boolean {
    return this.LEVELS[level] >= this.LEVELS[this.LOG_LEVEL];
  }
}

// Create and export a default instance for convenience
export const connectionLogger = new ConnectionLogger();
