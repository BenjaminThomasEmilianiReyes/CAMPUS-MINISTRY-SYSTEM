const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String },
  role: { type: String, enum: ['student', 'admin', 'staff'], required: true },
  fullName: { type: String, required: true },
  studentId: { type: String },
  department: { type: String },
  batch: { type: String },
  assignedEvaluations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation' }],
  registeredRecollections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recollection' }],
  certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
