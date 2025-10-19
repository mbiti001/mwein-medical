// lib/utils/apiMigration.ts
/**
 * Utility functions to help migrate existing API routes to use standardized patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  apiSuccess, 
  apiError, 
  apiValidationError, 
  apiUnauthorized,
  generateRequestId,
  handleApiError 
} from '../apiResponse';
import { logger, getRequestContext } from '../logger';

/**
 * Simple wrapper that adds basic logging and error handling to existing routes
 * without requiring a full rewrite
 */
export function enhanceExistingRoute(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { maxRequests: number; windowMs: number };
    logLevel?: 'minimal' | 'detailed';
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const requestContext = getRequestContext(request, requestId);
    
    try {
      if (options.logLevel === 'detailed') {
        logger.apiRequest(request.method, new URL(request.url).pathname, requestContext);
      }
      
      // Basic auth check if required
      if (options.requireAuth) {
        const token = request.headers.get('authorization') || request.cookies.get('admin_session')?.value;
        if (!token) {
          logger.security('Unauthorized access attempt', requestContext);
          return apiUnauthorized('Authentication required', requestId);
        }
      }
      
      const response = await handler(request);
      
      // Add request ID to response
      response.headers.set('X-Request-ID', requestId);
      
      if (options.logLevel === 'detailed') {
        const duration = Date.now() - startTime;
        logger.apiResponse(
          request.method, 
          new URL(request.url).pathname, 
          response.status, 
          duration,
          requestContext
        );
      }
      
      return response;
      
    } catch (error) {
      logger.error(
        `Enhanced route error: ${request.method} ${new URL(request.url).pathname}`,
        requestContext,
        error instanceof Error ? error : new Error(String(error))
      );
      
      const errorResponse = handleApiError(error, requestId);
      errorResponse.headers.set('X-Request-ID', requestId);
      return errorResponse;
    }
  };
}

/**
 * Converts old-style error responses to new standardized format
 */
export function standardizeResponse(oldResponse: any, requestId?: string): NextResponse {
  // Handle different old response patterns
  if (oldResponse?.ok === true) {
    // Success response
    const { ok, ...data } = oldResponse;
    return apiSuccess(data, requestId);
  }
  
  if (oldResponse?.error) {
    // Error response
    const status = oldResponse.status || 400;
    return apiError(
      oldResponse.error.toUpperCase().replace(/[^A-Z_]/g, '_'),
      oldResponse.message || oldResponse.error,
      status,
      oldResponse.details,
      requestId
    );
  }
  
  // Default success
  return apiSuccess(oldResponse, requestId);
}

/**
 * Migration helper for validation schemas
 */
export function migrateValidation<T>(
  oldValidator: (data: any) => { valid: boolean; data?: T; errors?: any },
  newSchema: z.ZodSchema<T>
): z.ZodSchema<T> {
  // If you have a custom validation function, you can wrap it as a Zod refinement
  return newSchema.refine((data) => {
    const result = oldValidator(data);
    return result.valid;
  }, 'Custom validation failed');
}

/**
 * Helper to create database query filters from URL search params
 */
export function parseSearchFilters(url: URL) {
  const filters: Record<string, any> = {};
  
  // Common filter patterns
  const search = url.searchParams.get('q');
  if (search) {
    filters.search = search.trim();
  }
  
  const status = url.searchParams.get('status');
  if (status) {
    filters.status = status;
  }
  
  const from = url.searchParams.get('from');
  if (from) {
    const date = new Date(from);
    if (!isNaN(date.getTime())) {
      filters.from = date;
    }
  }
  
  const to = url.searchParams.get('to');
  if (to) {
    const date = new Date(to);
    if (!isNaN(date.getTime())) {
      filters.to = date;
    }
  }
  
  const page = url.searchParams.get('page');
  if (page) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      filters.page = pageNum;
    }
  }
  
  const limit = url.searchParams.get('limit');
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
      filters.limit = Math.min(limitNum, 100); // Cap at 100
    }
  }
  
  return filters;
}

/**
 * Helper to create standardized pagination
 */
export function createPagination(
  page: number = 1, 
  limit: number = 20, 
  total: number
) {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    offset,
    limit,
  };
}

/**
 * Database connection health check
 */
export async function checkDatabaseHealth() {
  try {
    const { prisma } = await import('../prisma');
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Environment configuration validator
 */
export function validateRequiredEnvVars(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  return {
    valid: missing.length === 0,
    missing,
  };
}