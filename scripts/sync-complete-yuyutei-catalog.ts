import { PrismaClient } from '@prisma/client';
import dns from 'node:dns';
import { syncYuyuSet } from './sync-yuyutei-v2';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const prisma = new PrismaClient();

export async function syncSet(setPrefix: string, defaultPackCode?: string) {
  await syncYuyuSet(defaultPackCode || setPrefix);
}

async function main() {
  const setsToSync = [
    // Starter decks ST01 to ST36
    'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06', 'ST07', 'ST08', 'ST09', 'ST10',
    'ST11', 'ST12', 'ST13', 'ST14', 'ST15', 'ST16', 'ST17', 'ST18', 'ST19', 'ST20',
    'ST21', 'ST22', 'ST23', 'ST24', 'ST25', 'ST26', 'ST27', 'ST28', 'ST29', 'ST30',
    'ST31', 'ST32', 'ST33', 'ST34', 'ST35', 'ST36',
    // Extra boosters
    'EB01', 'EB02', 'EB03', 'EB04',
    // Premium boosters
    'PRB01', 'PRB02',
    // Main boosters
    'OP01', 'OP02', 'OP03', 'OP04', 'OP05', 'OP06', 'OP07', 'OP08', 'OP09', 'OP10',
    'OP11', 'OP12', 'OP13', 'OP14', 'OP15', 'OP16', 'OP17',
  ];

  for (const set of setsToSync) {
    await syncSet(set);
    // Slight pause to be polite to Yuyu-tei server
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n🎉 All Yuyu-tei sets successfully synced into database!');
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
