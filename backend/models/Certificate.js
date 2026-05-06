const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  qrCode: { type: String, required: true },
  status: { type: String, enum: ['pending', 'issued', 'verified'], default: 'pending' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);