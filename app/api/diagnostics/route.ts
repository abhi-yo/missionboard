import { NextResponse } from 'next/server';
import { checkEnvironment } from '@/lib/env-check';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Define proper types for DB status
type DbStatusSuccess = {
  status: 'connected' | 'unknown';
};

type DbStatusError = {
  status: 'error';
  error: string;
};

type DbStatus = DbStatusSuccess | DbStatusError;

export async function GET(request: Request) {
  try {
    // Check if the request has an admin token/secret for non-authenticated access
    // In production, use a secure token verification
    const url = new URL(request.url);
    const adminToken = url.searchParams.get('admin_token');
    const isAdminRequest = adminToken === process.env.ADMIN_DIAGNOSTIC_TOKEN;
    
    // For authenticated users or admin token holders only
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !isAdminRequest) {
      return NextResponse.json({ 
        error: "Unauthorized",
        message: "Authentication required to access diagnostics" 
      }, { status: 401 });
    }

    // Basic server info
    const serverInfo = {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      vercelEnv: process.env.VERCEL_ENV,
      hasDbUrl: !!process.env.DB_URL,
      hasGithubAuth: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
      hasGoogleAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      timestamp: new Date().toISOString()
    };

    // Environment check (including DB connectivity)
    const envCheck = await checkEnvironment();
    
    let dbStatus: DbStatus = { status: 'unknown' };
    try {
      // Simple DB check
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = { status: 'connected' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      dbStatus = { 
        status: 'error', 
        error: errorMessage
      };
    }

    return NextResponse.json({
      status: 'ok',
      serverInfo,
      environmentCheck: envCheck,
      database: dbStatus,
      auth: {
        sessionAvailable: !!session
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Error running diagnostics',
      error: errorMessage
    }, { status: 500 });
  }
} 