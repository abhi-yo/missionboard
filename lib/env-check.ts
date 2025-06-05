import { PrismaClient } from './generated/prisma';

export interface EnvCheckResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details: {
    missingVars?: string[];
    autoDetectedVars?: string[];
    dbConnection?: 'success' | 'error';
    dbError?: string;
  };
}

const REQUIRED_ENV_VARS = [
  'DB_URL',
  'NEXTAUTH_SECRET',
];

const AUTO_DETECTED_ENV_VARS = [
  { name: 'NEXTAUTH_URL', autoDetectSource: 'VERCEL_URL' }
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

  // Check for auto-detected variables
  const autoDetectedVars: string[] = [];
  const stillMissingVars: string[] = [];
  
  AUTO_DETECTED_ENV_VARS.forEach(varConfig => {
    if (!process.env[varConfig.name] && process.env[varConfig.autoDetectSource]) {
      // This variable is missing but can be auto-detected
      autoDetectedVars.push(varConfig.name);
    } else if (!process.env[varConfig.name]) {
      // This variable is missing and cannot be auto-detected
      stillMissingVars.push(varConfig.name);
    }
  });

  // Combine still missing with required vars
  const allMissingRequired = [...missingRequired, ...stillMissingVars];

  // If missing required variables (excluding those that can be auto-detected), return error
  if (allMissingRequired.length > 0) {
    return {
      status: 'error',
      message: `Missing required environment variables: ${allMissingRequired.join(', ')}`,
      details: {
        missingVars: allMissingRequired,
        autoDetectedVars
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
        autoDetectedVars
      }
    };
  }

  // If we're missing recommended variables or using auto-detected values, return warning
  if (missingRecommended.length > 0 || autoDetectedVars.length > 0) {
    const warningParts = [];
    if (missingRecommended.length > 0) {
      warningParts.push(`Missing recommended variables: ${missingRecommended.join(', ')}`);
    }
    if (autoDetectedVars.length > 0) {
      warningParts.push(`Auto-detected variables: ${autoDetectedVars.join(', ')}`);
    }
    
    return {
      status: 'warning',
      message: `Environment check passed with warnings. ${warningParts.join('. ')}`,
      details: {
        missingVars: missingRecommended.length > 0 ? missingRecommended : undefined,
        autoDetectedVars: autoDetectedVars.length > 0 ? autoDetectedVars : undefined,
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