import { NextRequest } from 'next/server'
import { withApiHandler } from '../../../lib/middleware/apiMiddleware'
import { apiSuccess, apiError } from '../../../lib/apiResponse'
import { checkDatabaseHealth, validateRequiredEnvVars } from '../../../lib/utils/apiMigration'
import { env } from '../../../lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const { requestId } = context;
  
  // Check database connection
  const dbHealth = await checkDatabaseHealth();
  
  // Check required environment variables
  const requiredEnvs = ['DATABASE_URL', 'ADMIN_SESSION_SECRET'];
  const envCheck = validateRequiredEnvVars(requiredEnvs);
  
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
      siteUrl: env.siteUrl,
    },
    services: {
      database: {
        status: dbHealth.healthy ? 'up' : 'down',
        error: dbHealth.error || null,
      },
      email: {
        resend: resendConfigured ? 'configured' : 'not-configured',
        smtp: smtpConfigured ? 'configured' : 'not-configured',
      },
    },
    configuration: {
      requiredEnvs: envCheck.valid,
      missingEnvs: envCheck.missing,
    },
  };
  
  // Determine overall health status
  if (!dbHealth.healthy || !envCheck.valid) {
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
