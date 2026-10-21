const { app } = require('@azure/functions');
const { site, health } = require('./handler');
app.http('site', { methods: ['GET', 'POST'], authLevel: 'anonymous', route: 'site/{*path}', handler: site });
app.http('health', { methods: ['GET'], authLevel: 'anonymous', route: 'health', handler: health });
