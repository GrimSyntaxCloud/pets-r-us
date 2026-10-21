const mongoose = require('mongoose');
const User = require('../models/users');
const Appointment = require('../models/appointments');
async function prepare() {
  await User.createCollection();
  await Appointment.createCollection();
  await User.collection.createIndex({ username: 1 }, { unique: true });
  await Appointment.collection.createIndex({ userId: 1, createdAt: -1 });
  // Standard MongoDB TTL. Cosmos 4.2 requires a different, approved TTL setup.
  for (const model of [User, Appointment]) await model.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await mongoose.connection.collection('pets_sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  const demoId = new mongoose.Types.ObjectId('000000000000000000000001');
  await Appointment.updateOne({ _id: demoId }, { $setOnInsert: { userId: new mongoose.Types.ObjectId('000000000000000000000002'), firstName: 'Taylor', lastName: 'Sample', email: 'taylor@example.com', service: 'grooming', createdAt: new Date('2026-01-01'), isDemo: true } }, { upsert: true });
}
module.exports = { prepare };
