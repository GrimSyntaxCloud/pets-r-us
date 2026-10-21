const mongoose = require('mongoose');
let pending;
async function connect() {
 if (!pending) pending = mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE || 'portfolio-demos', retryWrites: false, autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000, maxPoolSize: 5 }).catch(error => { pending = undefined; throw error; });
 await pending;
 return mongoose.connection;
}
async function cleanup() {
 const db = await connect();
 return require('../lib/retention').cleanup({ User: require('../models/users'), Appointment: require('../models/appointments'), sessions: db.collection('pets_sessions') });
}
module.exports = { connect, cleanup };
