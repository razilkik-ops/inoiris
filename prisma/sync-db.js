const { spawnSync } = require('child_process');

function runPrisma(args, options = {}) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return spawnSync(command, ['prisma', ...args], {
    stdio: options.stdio || 'inherit',
    encoding: 'utf8'
  });
}

function main() {
  const push = runPrisma(['db', 'push', '--accept-data-loss']);
  if (push.status === 0) return;

  console.warn('Prisma db push failed. Resetting database schema for this initial deployment...');
  const reset = runPrisma(['db', 'push', '--force-reset', '--accept-data-loss']);
  if (reset.status !== 0) {
    process.exit(reset.status || 1);
  }
}

main();
