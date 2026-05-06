const mongoose = require('mongoose');

const recollectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  department: { type: String, required: true },
  yearLevel: { type: String, enum: ['1', '2', '3', '4'], required: true },
  facilitator: String,
  slots: { type: Number, default: 40 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Recollection', recollectionSchema);
