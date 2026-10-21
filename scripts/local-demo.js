const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
(async () => {
  const db = await MongoMemoryServer.create();
  const env = { ...process.env, MONGODB_URI: db.getUri('pets_r_us_preview'), SESSION_SECRET: randomBytes(32).toString('hex'), NODE_ENV: 'development', PORT: '3000' };
  const prep = spawn(process.execPath, ['scripts/prepare-db.js'], { env, stdio: 'inherit' });
  await new Promise((resolve, reject) => prep.on('exit', code => code === 0 ? resolve() : reject(new Error('Preparation failed'))));
  const server = spawn(process.execPath, ['index.js'], { env, stdio: 'inherit' });
  server.on('exit', async code => { await db.stop(); process.exit(code || 0); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
})().catch(() => { console.error('Local preview failed.'); process.exitCode = 1; });
