const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const Certificate = require('../models/Certificate');
const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('assignedEvaluations certificates');
    
    const evaluations = await Evaluation.find({
      assignedStudents: req.user.id,
      submissions: { $not: { $elemMatch: { student: req.user.id } } }
    }).populate('createdBy', 'fullName');

    res.json({
      announcements: [
        "Welcome back to Campus Ministry!",
        "Complete your evaluations before the deadline",
        "Check your certificates below"
      ],
      pendingEvaluations: evaluations,
      certificates: user.certificates
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/evaluations/:id/submit', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation.assignedStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    evaluation.submissions.push({
      student: req.user.id,
      answers: req.body.answers
    });

    await evaluation.save();
    
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { assignedEvaluations: req.params.id }
    });

    res.json({ message: 'Evaluation submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;