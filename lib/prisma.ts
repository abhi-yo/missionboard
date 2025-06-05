import { PrismaClient } from './generated/prisma';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaInstance = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
      errorFormat: 'pretty',
    });
  }
  prismaInstance = global.prisma;
}

// Add connection validation
async function validateConnection() {
  try {
    await prismaInstance.$connect();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Run connection validation (non-blocking)
validateConnection().catch(console.error);

export const prisma = prismaInstance; 