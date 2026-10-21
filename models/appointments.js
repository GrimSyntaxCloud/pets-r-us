const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  firstName: { type: String, required: true, maxlength: 60 },
  lastName: { type: String, required: true, maxlength: 60 },
  email: { type: String, required: true, maxlength: 254 },
  service: { type: String, required: true, enum: ['grooming', 'boarding', 'training'] },
  createdAt: { type: Date, default: Date.now, immutable: true },
  expiresAt: { type: Date, immutable: true },
  isDemo: { type: Boolean, default: false, immutable: true }
}, { autoIndex: false, autoCreate: false, collection: 'pets_appointments' });
module.exports = mongoose.model('Appointment', schema);
