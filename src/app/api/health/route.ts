import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - verify the application is responding
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_VERSION || 'unknown',
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Support HEAD requests for simple health checks
export async function HEAD() {
  return new Response(null, { status: 200 });
}