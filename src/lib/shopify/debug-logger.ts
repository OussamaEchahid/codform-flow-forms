// Debug logger for Shopify connection issues
// This will help us track down connection problems by standardizing logs

const LOG_PREFIX = '[Shopify Connection]';
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

// Log to localStorage for persistence across page reloads
const saveLog = (level: string, message: string, data?: any) => {
  try {
    // Get existing logs
    const logs = JSON.parse(localStorage.getItem('shopify_connection_logs') || '[]');
    
    // Add new log entry
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data) : undefined
    });
    
    // Keep only the last 100 logs
    const trimmedLogs = logs.slice(-100);
    
    // Save back to localStorage
    localStorage.setItem('shopify_connection_logs', JSON.stringify(trimmedLogs));
  } catch (e) {
    // Fail silently - this is just for debugging
  }
};

export const connectionLogger = {
  info: (message: string, data?: any) => {
    console.info(`${LOG_PREFIX} [${LOG_LEVELS.INFO}] ${message}`, data || '');
    saveLog(LOG_LEVELS.INFO, message, data);
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`${LOG_PREFIX} [${LOG_LEVELS.WARN}] ${message}`, data || '');
    saveLog(LOG_LEVELS.WARN, message, data);
  },
  
  error: (message: string, data?: any) => {
    console.error(`${LOG_PREFIX} [${LOG_LEVELS.ERROR}] ${message}`, data || '');
    saveLog(LOG_LEVELS.ERROR, message, data);
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${LOG_PREFIX} [${LOG_LEVELS.DEBUG}] ${message}`, data || '');
    }
    saveLog(LOG_LEVELS.DEBUG, message, data);
  },
  
  clearLogs: () => {
    localStorage.removeItem('shopify_connection_logs');
  },
  
  getLogs: (): Array<{timestamp: string, level: string, message: string, data?: string}> => {
    try {
      return JSON.parse(localStorage.getItem('shopify_connection_logs') || '[]');
    } catch (e) {
      return [];
    }
  },
  
  // Records an attempt to perform a connection-related operation
  recordAttempt: (operation: string, success: boolean, details?: any) => {
    const attempt = {
      operation,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    
    if (success) {
      connectionLogger.info(`Operation ${operation} succeeded`, attempt);
    } else {
      connectionLogger.error(`Operation ${operation} failed`, attempt);
    }
    
    return attempt;
  }
};
