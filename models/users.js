const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 32 },
  email: { type: String, required: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now, immutable: true },
  expiresAt: { type: Date, immutable: true },
  isDemo: { type: Boolean, default: false, immutable: true }
}, { autoIndex: false, autoCreate: false, collection: 'pets_users' });
schema.methods.name = function () { return this.username; };
module.exports = mongoose.model('User', schema);
