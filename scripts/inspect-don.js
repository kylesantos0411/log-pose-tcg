const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL = 'file:C:/Users/kyle/.gemini/antigravity/scratch/optcg-app/prisma/dev.db';
const prisma = new PrismaClient();

async function run() {
  const packs = await prisma.pack.findMany({
    select: { id: true, code: true, name: true }
  });
  console.log('Total packs in DB:', packs.length);
  packs.forEach(p => console.log(`${p.id} | ${p.code} | ${p.name}`));
}

run().catch(console.error);
