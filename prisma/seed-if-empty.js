const { spawnSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  if (productCount > 0) {
    console.log(`Seed skipped: ${productCount} products already exist`);
    return;
  }

  console.log('Database is empty, running seed...');
  const result = spawnSync(process.execPath, [path.join(__dirname, 'seed.js')], {
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
