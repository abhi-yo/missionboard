import { PrismaClient } from './generated/prisma';

export interface EnvCheckResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details: {
    missingVars?: string[];
    dbConnection?: 'success' | 'error';
    dbError?: string;
  };
}

const REQUIRED_ENV_VARS = [
  'DB_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
];

const RECOMMENDED_ENV_VARS = [
  'GITHUB_ID',
  'GITHUB_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

export async function checkEnvironment(): Promise<EnvCheckResult> {
  console.log('Starting environment check...');
  
  // Check required environment variables
  const missingRequired = REQUIRED_ENV_VARS.filter(
    varName => !process.env[varName]
  );
  
  const missingRecommended = RECOMMENDED_ENV_VARS.filter(
    varName => !process.env[varName]
  );

  // If missing required variables, return error immediately
  if (missingRequired.length > 0) {
    return {
      status: 'error',
      message: `Missing required environment variables: ${missingRequired.join(', ')}`,
      details: {
        missingVars: missingRequired,
      }
    };
  }

  // Check database connection
  let dbConnectionStatus: 'success' | 'error' = 'error';
  let dbError: string | undefined;

  try {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DB_URL,
        },
      },
    });
    
    // Test connection
    await client.$connect();
    console.log('Database connection test successful');
    await client.$disconnect();
    
    dbConnectionStatus = 'success';
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Database connection test failed:', dbError);
  }

  // If DB connection failed, it's an error
  if (dbConnectionStatus === 'error') {
    return {
      status: 'error',
      message: `Database connection failed: ${dbError}`,
      details: {
        dbConnection: 'error',
        dbError,
      }
    };
  }

  // If we're missing recommended variables, return warning
  if (missingRecommended.length > 0) {
    return {
      status: 'warning',
      message: `Environment check passed with warnings. Missing recommended variables: ${missingRecommended.join(', ')}`,
      details: {
        missingVars: missingRecommended,
        dbConnection: 'success',
      }
    };
  }

  // All good!
  return {
    status: 'success',
    message: 'Environment check passed successfully',
    details: {
      dbConnection: 'success',
    }
  };
} 