const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const QRCode = require('qrcode');
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

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// 🔥 FIXED: Create Evaluation (Removes invalid _id from questions)
router.post('/evaluations', [auth, adminAuth], async (req, res) => {
  try {
    console.log('📝 Creating evaluation:', req.body.title);
    
    // ✅ CRITICAL FIX: Remove _id from questions (frontend timestamp bug)
    const cleanQuestions = (req.body.questions || []).map(question => {
      const { _id, id, ...cleanQuestion } = question;
      return {
        ...cleanQuestion,
        required: cleanQuestion.required || true
      };
    });

    const evaluationData = {
      title: req.body.title,
      description: req.body.description || '',
      questions: cleanQuestions,
      assignedStudents: req.body.assignedStudents || [],
      batch: req.body.batch || 'General',
      dueDate: new Date(req.body.dueDate),
      createdBy: req.user.id
    };

    console.log('✅ Cleaned questions:', cleanQuestions.length);

    const evaluation = new Evaluation(evaluationData);
    await evaluation.save();

    console.log(`🎉 Evaluation created: ${evaluation._id}`);

    // Assign to students
    if (evaluationData.assignedStudents && evaluationData.assignedStudents.length > 0) {
      await User.updateMany(
        { _id: { $in: evaluationData.assignedStudents } },
        { $addToSet: { assignedEvaluations: evaluation._id } }
      );
      console.log(`👥 Assigned to ${evaluationData.assignedStudents.length} students`);
    }

    const populatedEval = await Evaluation.findById(evaluation._id)
      .populate('createdBy', 'fullName')
      .populate('assignedStudents', 'fullName studentId');

    res.status(201).json(populatedEval);
  } catch (error) {
    console.error('❌ Create evaluation ERROR:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      message: 'Failed to create evaluation',
      error: error.message,
      details: error.errors ? Object.keys(error.errors) : 'Unknown'
    });
  }
});

// Get evaluations
router.get('/evaluations', [auth, adminAuth], async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate('createdBy', 'fullName')
      .populate('assignedStudents', 'fullName studentId')
      .sort({ createdAt: -1 });
    res.json(evaluations);
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate certificate
router.post('/certificates', [auth, adminAuth], async (req, res) => {
  try {
    const { studentId, eventName, eventDate } = req.body;
    
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const qrData = `CERT:${student._id}:${Date.now()}:Xavier-eCMS`;
    const qrCode = await QRCode.toDataURL(qrData);

    const certificate = new Certificate({
      student: studentId,
      eventName,
      eventDate: new Date(eventDate),
      qrCode,
      issuedBy: req.user.id,
      status: 'issued'
    });

    await certificate.save();
    await User.findByIdAndUpdate(studentId, { $push: { certificates: certificate._id } });

    const populatedCert = await Certificate.findById(certificate._id)
      .populate('student', 'fullName studentId')
      .populate('issuedBy', 'fullName');

    res.status(201).json(populatedCert);
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Stats
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const [evaluations, students, certificates] = await Promise.all([
      Evaluation.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Certificate.countDocuments()
    ]);

    const pendingEvaluations = await Evaluation.countDocuments({
      'submissions.0': { $exists: false }
    });

    const totalSubmissions = await Evaluation.aggregate([
      { $unwind: '$submissions' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).then(result => result[0]?.count || 0);

    res.json({
      totalEvaluations: evaluations,
      totalStudents: students,
      totalCertificates: certificates,
      pendingEvaluations,
      totalSubmissions
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Students list
router.get('/students', [auth, adminAuth], async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('fullName studentId email batch')
      .sort({ fullName: 1 })
      .limit(50);
    res.json(students);
  } catch (error) {
    console.error('Students error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;