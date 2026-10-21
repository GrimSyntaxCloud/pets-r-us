if (process.env.DEMO_MAINTENANCE === 'true') process.exit(0);
require('./database').cleanup().then(counts => console.log(JSON.stringify(counts))).catch(() => { console.error('Cleanup failed; no private details logged.'); process.exitCode = 1; }).finally(() => require('mongoose').disconnect());
