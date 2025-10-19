import { NextRequest } from 'next/server'
import { withApiHandler } from '../../../lib/middleware/apiMiddleware'
import { apiSuccess, apiError } from '../../../lib/apiResponse'
import { env } from '../../../lib/env'
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Health check utilities
async function checkDatabaseHealth() {
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return { status: 'up', error: null }
  } catch (error) {
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function validateRequiredEnvVars() {
  const required = ['DATABASE_URL', 'ADMIN_SESSION_SECRET']
  const missing = required.filter(key => !process.env[key])
  
  return {
    requiredEnvs: missing.length === 0,
    missingEnvs: missing
  }
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const { requestId } = context;
  
  // Check database connection
  const dbHealth = await checkDatabaseHealth();
  
  // Check required environment variables
  const envCheck = validateRequiredEnvVars();
  
  // Check optional services
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS
  );
  
  const healthStatus = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: {
      node: process.version,
      vercel: process.env.VERCEL_ENV ?? null,
      siteUrl: env.SITE_URL,
    },
    services: {
      database: {
        status: dbHealth.status === 'up' ? 'up' : 'down',
        error: dbHealth.error || null,
      },
      email: {
        resend: resendConfigured ? 'configured' : 'not-configured',
        smtp: smtpConfigured ? 'configured' : 'not-configured',
      },
    },
    configuration: {
      requiredEnvs: envCheck.requiredEnvs,
      missingEnvs: envCheck.missingEnvs,
    },
  };
  
  // Determine overall health status
  if (dbHealth.status !== 'up' || !envCheck.requiredEnvs) {
    healthStatus.status = 'unhealthy';
    return apiError(
      'HEALTH_CHECK_FAILED',
      'System is unhealthy',
      503,
      healthStatus,
      requestId
    );
  }
  
  if (!resendConfigured && !smtpConfigured) {
    healthStatus.status = 'degraded';
  }
  
  return apiSuccess(healthStatus, requestId);
});
