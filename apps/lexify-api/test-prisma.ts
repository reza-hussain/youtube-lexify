import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['query'] });
async function main() {
  const words = await prisma.wordSense.findMany({
    include: { encounters: true }
  });
  console.log(JSON.stringify(words, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
