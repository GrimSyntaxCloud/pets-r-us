const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(require('../lib/local-database').localUri());
  await require('../lib/prepare').prepare();
  console.log('Local indexes and fictional sample appointment prepared.');
})().catch(() => { console.error('Local database preparation failed.'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
