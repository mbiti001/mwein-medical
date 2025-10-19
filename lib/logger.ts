// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  ip?: string;
  route?: string;
  [key: string]: unknown;
}

interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
    
    if (error) {
      entry.error = {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: 'code' in error ? String(error.code) : undefined,
      };
    }
    
    // In development, use console with colors
    if (this.isDevelopment) {
      this.consoleLog(entry);
    } else {
      // In production, output structured JSON for log aggregation
      console.log(JSON.stringify(entry));
    }
  }
  
  private consoleLog(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green  
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m',
    };
    
    const color = colors[entry.level];
    const prefix = `${color}[${entry.level.toUpperCase()}]${colors.reset}`;
    const timestamp = `\x1b[90m${entry.timestamp}\x1b[0m`;
    
    console.log(`${timestamp} ${prefix} ${entry.message}`);
    
    if (Object.keys(entry).length > 3) { // More than level, message, timestamp
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { level, message, timestamp, ...context } = entry;
      console.log('Context:', context);
    }
  }
  
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }
  
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }
  
  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }
  
  // API-specific logging methods
  apiRequest(method: string, path: string, context: LogContext = {}): void {
    this.info(`${method} ${path}`, { ...context, type: 'api_request' });
  }
  
  apiResponse(method: string, path: string, status: number, duration: number, context: LogContext = {}): void {
    const level = status >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} ${status} (${duration}ms)`, { 
      ...context, 
      type: 'api_response',
      status,
      duration 
    });
  }
  
  apiError(message: string, error: Error, context: LogContext = {}): void {
    this.error(message, { ...context, type: 'api_error' }, error);
  }
  
  security(message: string, context: LogContext = {}): void {
    this.warn(message, { ...context, type: 'security' });
  }
  
  audit(action: string, context: LogContext = {}): void {
    this.info(`Audit: ${action}`, { ...context, type: 'audit' });
  }
  
  database(message: string, context: LogContext = {}, error?: Error): void {
    const level = error ? 'error' : 'debug';
    this.log(level, message, { ...context, type: 'database' }, error);
  }
  
  email(message: string, context: LogContext = {}, error?: Error): void {
    const level = error ? 'error' : 'info';
    this.log(level, message, { ...context, type: 'email' }, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogLevel, LogContext };

// Utility to extract request context from Next.js Request
export function getRequestContext(request: Request, requestId?: string): LogContext {
  const url = new URL(request.url);
  
  return {
    requestId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') ||
        undefined,
  };
}