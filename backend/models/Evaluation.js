const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['text', 'radio', 'checkbox', 'rating'], required: true },
  options: [String],
  required: { type: Boolean, default: true }
});

const evaluationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  questions: [questionSchema],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  batch: { type: String, required: true },
  dueDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: mongoose.Schema.Types.Mixed,
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);