import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker containers and load balancers
 * Returns application status and basic system information
 */
export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    }

    // Optional: Add database connectivity check
    // Uncomment if you want to verify database connection
    /*
    try {
      // Add your database ping logic here
      // const dbStatus = await checkDatabaseConnection()
      // health.database = dbStatus
    } catch (error) {
      health.database = { status: 'error', message: error.message }
    }
    */

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * HEAD request for simple health checks
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
