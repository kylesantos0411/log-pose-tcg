import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

function getDatabaseDatasourceUrl(): string {
  // Check if running in a serverless environment (e.g. Vercel, AWS Lambda)
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const tmpDir = process.platform === 'win32' ? os.tmpdir() : '/tmp';
    const tmpDbPath = path.join(tmpDir, 'dev.db');
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');

    try {
      // Copy the bundled database file to writable temp directory if it doesn't exist or is empty
      const shouldCopy = !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0;
      if (shouldCopy && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
        if (fs.existsSync(`${sourceDbPath}-wal`)) {
          fs.copyFileSync(`${sourceDbPath}-wal`, `${tmpDbPath}-wal`);
        }
        if (fs.existsSync(`${sourceDbPath}-shm`)) {
          fs.copyFileSync(`${sourceDbPath}-shm`, `${tmpDbPath}-shm`);
        }
      }
    } catch (err) {
      console.error('Failed to copy SQLite database to writable temporary directory:', err);
    }

    if (fs.existsSync(tmpDbPath)) {
      // Convert Windows backslashes to forward slashes for SQLite URI if needed
      const normalizedPath = tmpDbPath.replace(/\\/g, '/');
      return `file:${normalizedPath}`;
    }
  }

  // If DATABASE_URL is explicitly configured, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return 'file:./dev.db';
}

const datasourceUrl = getDatabaseDatasourceUrl();
process.env.DATABASE_URL = datasourceUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: datasourceUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
