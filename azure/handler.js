const serverless = require('serverless-http');
const { MongoStore } = require('connect-mongo');
const database = require('./database');
let pending;
function createHandler(app) {
 const wrapped = serverless(app, { provider: 'azure' });
 return async request => {
  if (process.env.DEMO_MAINTENANCE === 'true') return { status: 503, headers: { 'Retry-After': '120', 'Cache-Control': 'no-store' }, body: 'The demo is briefly unavailable for maintenance.' };
  try {
   const rawBody = await request.text();
   if (Buffer.byteLength(rawBody) > 8192) return { status: 413, body: 'Form too large.' };
   const url = new URL(request.url);
   const path = request.params.path === 'home' ? '' : request.params.path || '';
   // The provider logs its full response by default. Suppress that logger so
   // session cookies, CSRF tokens, and private pages never enter platform logs.
   const result = await wrapped({ log: () => {} }, { method: request.method, url: '/' + path + url.search, query: Object.fromEntries(url.searchParams), headers: Object.fromEntries(request.headers), rawBody });
   return { status: result.status, headers: result.headers, body: result.isBase64Encoded ? Buffer.from(result.body, 'base64') : result.body };
  } catch { return { status: 503, headers: { 'Cache-Control': 'no-store' }, body: 'The demo is temporarily unavailable. Please try again.' }; }
 };
}
async function site(request) {
 if (process.env.DEMO_MAINTENANCE === 'true') return { status: 503, headers: { 'Retry-After': '120' }, body: 'The demo is briefly unavailable for maintenance.' };
 try {
  if (!pending) pending = (async () => {
   const db = await database.connect();
   const store = MongoStore.create({ client: db.getClient(), dbName: db.name, collectionName: 'pets_sessions', autoRemove: 'disabled' });
   return createHandler(require('../app')({ store, secret: process.env.SESSION_SECRET, secure: true }));
  })().catch(error => { pending = undefined; throw error; });
  const handler = await pending;
  await database.cleanup();
  return handler(request);
 } catch { return { status: 503, headers: { 'Cache-Control': 'no-store' }, body: 'The demo is temporarily unavailable. Please try again.' }; }
}
async function health() {
 if (process.env.DEMO_MAINTENANCE === 'true') return { status: 503, jsonBody: { status: 'maintenance' } };
 try { const db = await database.connect(); await db.db.command({ ping: 1 }); return { jsonBody: { status: 'ok', database: 'connected' } }; }
 catch { return { status: 503, jsonBody: { status: 'unavailable' } }; }
}
module.exports = { createHandler, site, health };
