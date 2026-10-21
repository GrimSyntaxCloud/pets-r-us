const mongoose = require('mongoose');
const { MongoStore } = require('connect-mongo');
const createApp = require('./app');
async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Set MONGODB_URI in the server environment.');
  // Validate configuration before opening any database connection.
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith('replace-')) throw new Error('Set a random SESSION_SECRET of at least 32 characters.');
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000 });
  const store = MongoStore.create({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name, collectionName: 'pets_sessions', autoRemove: 'disabled' });
  const app = createApp({ store, secret, secure: process.env.NODE_ENV === 'production' });
  const server = app.listen(process.env.PORT || 3000, () => console.log('Pets-R-Us listening.'));
  const timer = setInterval(() => require('./lib/retention').cleanup({ User: require('./models/users'), Appointment: require('./models/appointments'), sessions: mongoose.connection.collection('pets_sessions') }).catch(() => console.error('Demo cleanup failed; retrying next hour.')), 60 * 60 * 1000);
  timer.unref();
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(async () => { clearInterval(timer); await mongoose.disconnect(); process.exit(0); }));
}
start().catch(() => { console.error('Startup failed. Check server environment and database availability; credentials are never logged.'); process.exitCode = 1; });
