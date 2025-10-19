// lib/middleware/apiMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger, getRequestContext } from '../logger';
import { generateRequestId, handleApiError } from '../apiResponse';

export interface ApiContext {
  requestId: string;
  startTime: number;
  request: NextRequest;
}

// Higher-order function to wrap API handlers with common functionality
export function withApiHandler<T extends unknown[]>(
  handler: (request: NextRequest, context: ApiContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    const context: ApiContext = {
      requestId,
      startTime,
      request,
    };
    
    const requestContext = getRequestContext(request, requestId);
    
    try {
      // Log incoming request
      logger.apiRequest(request.method, new URL(request.url).pathname, requestContext);
      
      // Execute the handler
      const response = await handler(request, context, ...args);
      
      // Log successful response
      const duration = Date.now() - startTime;
      logger.apiResponse(
        request.method, 
        new URL(request.url).pathname, 
        response.status, 
        duration,
        requestContext
      );
      
      // Add request ID to response headers for tracing
      response.headers.set('X-Request-ID', requestId);
      
      return response;
      
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      logger.apiError(
        `API handler error: ${request.method} ${new URL(request.url).pathname}`,
        error instanceof Error ? error : new Error(String(error)),
        { ...requestContext, duration }
      );
      
      // Return standardized error response
      const errorResponse = handleApiError(error, requestId);
      errorResponse.headers.set('X-Request-ID', requestId);
      
      return errorResponse;
    }
  };
}

// Validation middleware
export function withValidation<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: any } },
  handler: (request: NextRequest, context: ApiContext, validatedData: T) => Promise<NextResponse>
) {
  return withApiHandler(async (request: NextRequest, context: ApiContext) => {
    let body: unknown;
    
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    
    const result = schema.safeParse(body);
    
    if (!result.success) {
      logger.warn('Request validation failed', {
        requestId: context.requestId,
        path: new URL(request.url).pathname,
        errors: result.error,
      });
      
      return handleApiError(result.error, context.requestId);
    }
    
    return handler(request, context, result.data as T);
  });
}

// Authentication middleware
export function withAuth(
  handler: (request: NextRequest, context: ApiContext & { userId: string }) => Promise<NextResponse>
) {
  return withApiHandler(async (request: NextRequest, context: ApiContext) => {
    // Extract token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('admin_session')?.value;
    
    if (!token) {
      logger.security('Unauthorized API access attempt', {
        requestId: context.requestId,
        path: new URL(request.url).pathname,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: { 'X-Request-ID': context.requestId } }
      );
    }
    
    // TODO: Verify token and extract user info
    // For now, we'll assume token verification is handled elsewhere
    const userId = 'extracted-user-id'; // This should come from token verification
    
    return handler(request, { ...context, userId });
  });
}

// Rate limiting middleware (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 60, 
  windowMs: number = 60000 // 1 minute
) {
  return function<T extends unknown[]>(
    handler: (request: NextRequest, context: ApiContext, ...args: T) => Promise<NextResponse>
  ) {
    return withApiHandler(async (request: NextRequest, context: ApiContext, ...args: T) => {
      const clientId = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      const now = Date.now();
      const existing = rateLimitMap.get(clientId);
      
      if (existing && existing.resetTime > now) {
        if (existing.count >= maxRequests) {
          logger.security('Rate limit exceeded', {
            requestId: context.requestId,
            clientId,
            path: new URL(request.url).pathname,
            count: existing.count,
            maxRequests,
          });
          
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { 
              status: 429,
              headers: {
                'X-Request-ID': context.requestId,
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': existing.resetTime.toString(),
              }
            }
          );
        }
        
        existing.count++;
      } else {
        rateLimitMap.set(clientId, {
          count: 1,
          resetTime: now + windowMs,
        });
      }
      
      const response = await handler(request, context, ...args);
      
      // Add rate limit headers
      const current = rateLimitMap.get(clientId);
      if (current) {
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - current.count).toString());
        response.headers.set('X-RateLimit-Reset', current.resetTime.toString());
      }
      
      return response;
    });
  };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute