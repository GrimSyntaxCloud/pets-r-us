const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(require('../lib/local-database').localUri());
  console.log(await require('../lib/retention').cleanup({ User: require('../models/users'), Appointment: require('../models/appointments'), sessions: mongoose.connection.collection('pets_sessions') }));
})().catch(() => { console.error('Local cleanup failed.'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
