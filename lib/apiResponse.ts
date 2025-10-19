// lib/apiResponse.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  requestId?: string;
  timestamp: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
  timestamp: string;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Success response helper
export function apiSuccess<T>(data: T, requestId?: string): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(response);
}

// Error response helpers
export function apiError(
  code: string, 
  message: string, 
  status: number = 400,
  details?: unknown,
  requestId?: string
): NextResponse {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(response, { status });
}

export function apiValidationError(error: ZodError, requestId?: string): NextResponse {
  return apiError(
    'VALIDATION_ERROR',
    'Request validation failed',
    400,
    error.format(),
    requestId
  );
}

export function apiNotFound(resource: string = 'Resource', requestId?: string): NextResponse {
  return apiError(
    'NOT_FOUND',
    `${resource} not found`,
    404,
    undefined,
    requestId
  );
}

export function apiUnauthorized(message: string = 'Unauthorized access', requestId?: string): NextResponse {
  return apiError(
    'UNAUTHORIZED',
    message,
    401,
    undefined,
    requestId
  );
}

export function apiForbidden(message: string = 'Access forbidden', requestId?: string): NextResponse {
  return apiError(
    'FORBIDDEN',
    message,
    403,
    undefined,
    requestId
  );
}

export function apiRateLimit(requestId?: string): NextResponse {
  return apiError(
    'RATE_LIMITED',
    'Too many requests. Please try again later.',
    429,
    undefined,
    requestId
  );
}

export function apiServerError(message: string = 'Internal server error', requestId?: string, details?: unknown): NextResponse {
  return apiError(
    'SERVER_ERROR',
    message,
    500,
    details,
    requestId
  );
}

// Handle database errors
export function apiDatabaseError(error: unknown, requestId?: string): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return apiError(
          'DUPLICATE_ENTRY',
          'A record with this information already exists',
          409,
          { field: error.meta?.target },
          requestId
        );
      case 'P2025':
        return apiNotFound('Record', requestId);
      case 'P2003':
        return apiError(
          'FOREIGN_KEY_CONSTRAINT',
          'Referenced record does not exist',
          400,
          undefined,
          requestId
        );
      default:
        return apiServerError(
          'Database operation failed',
          requestId,
          process.env.NODE_ENV === 'development' ? error.message : undefined
        );
    }
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return apiServerError('Database connection failed', requestId);
  }
  
  return apiServerError('Database error', requestId);
}

// Catch-all error handler
export function handleApiError(error: unknown, requestId?: string): NextResponse {
  console.error('API Error:', { error, requestId, stack: error instanceof Error ? error.stack : undefined });
  
  if (error instanceof ZodError) {
    return apiValidationError(error, requestId);
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError || 
      error instanceof Prisma.PrismaClientInitializationError) {
    return apiDatabaseError(error, requestId);
  }
  
  if (error instanceof Error) {
    return apiServerError(error.message, requestId);
  }
  
  return apiServerError('An unexpected error occurred', requestId);
}