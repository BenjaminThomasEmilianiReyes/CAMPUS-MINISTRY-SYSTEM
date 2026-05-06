const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Recollection = require('../models/Recollection');
const QRCode = require('qrcode');
const router = express.Router();
const departments = [
  'Nursing',
  'Computer Studies',
  'Engineering',
  'Agriculture',
  'Business Management',
  'Education',
  'Arts and Science'
];

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
        required: cleanQuestion.required ?? true
      };
    });

    const batch = req.body.batch || 'General';
    let assignedStudents = req.body.assignedStudents || [];
    
    // Auto-assign students based on batch if no specific students selected
    if (assignedStudents.length === 0 && batch && batch !== 'General') {
      const batchStudents = await User.find({ role: 'student', batch: batch }).select('_id');
      assignedStudents = batchStudents.map(s => s._id);
      console.log(`🎯 Auto-assigning ${assignedStudents.length} students from batch: ${batch}`);
    }

    const evaluationData = {
      title: req.body.title,
      description: req.body.description || '',
      questions: cleanQuestions,
      assignedStudents: assignedStudents,
      batch: batch,
      dueDate: new Date(req.body.dueDate),
      createdBy: req.user.id
    };

    console.log('✅ Cleaned questions:', cleanQuestions.length);

    const evaluation = new Evaluation(evaluationData);
    await evaluation.save();

    console.log(`🎉 Evaluation created: ${evaluation._id}`);

    // Assign to students
    if (assignedStudents && assignedStudents.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedStudents } },
        { $addToSet: { assignedEvaluations: evaluation._id } }
      );
      console.log(`👥 Assigned to ${assignedStudents.length} students`);
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

// Delete evaluation
router.delete('/evaluations/:id', [auth, adminAuth], async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Remove evaluation from all students' assignedEvaluations
    await User.updateMany(
      { assignedEvaluations: req.params.id },
      { $pull: { assignedEvaluations: req.params.id } }
    );

    // Delete the evaluation
    await Evaluation.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Evaluation deleted: ${req.params.id}`);
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get recollection schedules
router.get('/recollections', [auth, adminAuth], async (req, res) => {
  try {
    const recollections = await Recollection.find()
      .populate('participants', 'fullName studentId batch department')
      .sort({ date: 1 });

    res.json(recollections);
  } catch (error) {
    console.error('Get recollections error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get one recollection schedule with registrants
router.get('/recollections/:id', [auth, adminAuth], async (req, res) => {
  try {
    const recollection = await Recollection.findById(req.params.id)
      .populate('participants', 'fullName studentId email batch department')
      .sort({ date: 1 });

    if (!recollection) {
      return res.status(404).json({ message: 'Recollection schedule not found' });
    }

    res.json(recollection);
  } catch (error) {
    console.error('Get recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create recollection schedule
router.post('/recollections', [auth, adminAuth], async (req, res) => {
  try {
    if (!['1', '2', '3', '4'].includes(req.body.yearLevel)) {
      return res.status(400).json({ message: 'Please select a valid year level' });
    }

    if (!departments.includes(req.body.department)) {
      return res.status(400).json({ message: 'Please select a valid department' });
    }

    const recollection = new Recollection({
      title: req.body.title,
      description: req.body.description || '',
      date: new Date(req.body.date),
      venue: req.body.venue,
      department: req.body.department,
      yearLevel: req.body.yearLevel,
      facilitator: req.body.facilitator || '',
      slots: Number(req.body.slots) || 40
    });

    await recollection.save();
    res.status(201).json(recollection);
  } catch (error) {
    console.error('Create recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete recollection schedule
router.delete('/recollections/:id', [auth, adminAuth], async (req, res) => {
  try {
    const recollection = await Recollection.findById(req.params.id);
    if (!recollection) {
      return res.status(404).json({ message: 'Recollection schedule not found' });
    }

    await User.updateMany(
      { registeredRecollections: req.params.id },
      { $pull: { registeredRecollections: req.params.id } }
    );
    await Recollection.findByIdAndDelete(req.params.id);

    res.json({ message: 'Recollection schedule deleted successfully' });
  } catch (error) {
    console.error('Delete recollection error:', error);
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

const getSubmissionRows = async () => {
  const evaluations = await Evaluation.find({ 'submissions.0': { $exists: true } })
    .populate('submissions.student', 'fullName studentId email batch')
    .sort({ updatedAt: -1 });

  return evaluations.flatMap((evaluation) =>
    evaluation.submissions.map((submission) => ({
      _id: submission._id,
      studentId: submission.student?._id,
      studentName: submission.student?.fullName || 'Unknown student',
      studentNumber: submission.student?.studentId || '',
      studentEmail: submission.student?.email || '',
      batch: submission.student?.batch || '',
      evaluationId: evaluation._id,
      evaluationTitle: evaluation.title,
      submittedAt: submission.submittedAt,
      answers: submission.answers || {}
    }))
  ).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

// Detailed analytics for the data management page
router.get('/stats-detailed', [auth, adminAuth], async (req, res) => {
  try {
    const [totalEvaluations, totalStudents, totalCertificates, totalUsers, submissionRows] = await Promise.all([
      Evaluation.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Certificate.countDocuments(),
      User.countDocuments(),
      getSubmissionRows()
    ]);

    res.json({
      totalEvaluations,
      totalStudents,
      totalCertificates,
      totalUsers,
      totalSubmissions: submissionRows.length
    });
  } catch (error) {
    console.error('Detailed stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Recent evaluation submissions
router.get('/submissions', [auth, adminAuth], async (req, res) => {
  try {
    const submissions = await getSubmissionRows();
    res.json(submissions);
  } catch (error) {
    console.error('Submissions error:', error);
    res.status(500).json({ message: error.message });
  }
});

const csvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

// Export submissions as CSV
router.get('/export-csv', [auth, adminAuth], async (req, res) => {
  try {
    const submissions = await getSubmissionRows();
    const header = [
      'Student Name',
      'Student ID',
      'Email',
      'Batch',
      'Evaluation',
      'Submitted At',
      'Answers'
    ];

    const rows = submissions.map((submission) => [
      submission.studentName,
      submission.studentNumber,
      submission.studentEmail,
      submission.batch,
      submission.evaluationTitle,
      submission.submittedAt ? new Date(submission.submittedAt).toISOString() : '',
      JSON.stringify(submission.answers)
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvValue).join(','))
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`ecms-report-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Students list
router.get('/students', [auth, adminAuth], async (req, res) => {
  try {
    const { batch, yearLevel, completionStatus } = req.query;
    const query = { role: 'student' };

    if (batch) {
      query.batch = batch;
    } else if (yearLevel) {
      query.batch = { $regex: `-${yearLevel}` };
    }

    let students = await User.find(query)
      .select('fullName studentId email batch department')
      .sort({ fullName: 1 })
      .limit(200)
      .lean();

    const studentIds = students.map((student) => student._id);
    const submissionCounts = await Evaluation.aggregate([
      { $unwind: '$submissions' },
      { $match: { 'submissions.student': { $in: studentIds } } },
      {
        $group: {
          _id: '$submissions.student',
          completedEvaluations: { $sum: 1 },
          latestSubmissionAt: { $max: '$submissions.submittedAt' }
        }
      }
    ]);

    const completionByStudent = new Map(
      submissionCounts.map((submission) => [submission._id.toString(), submission])
    );

    students = students.map((student) => {
      const completion = completionByStudent.get(student._id.toString());
      return {
        ...student,
        completedEvaluations: completion?.completedEvaluations || 0,
        latestSubmissionAt: completion?.latestSubmissionAt || null
      };
    });

    if (completionStatus === 'completed') {
      students = students.filter((student) => student.completedEvaluations > 0);
    }

    res.json(students);
  } catch (error) {
    console.error('Students error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const users = await User.find()
      .select('fullName email role batch createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get certificates
router.get('/certificates', [auth, adminAuth], async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('student', 'fullName studentId')
      .populate('issuedBy', 'fullName')
      .sort({ createdAt: -1 });
    res.json(certificates);
  } catch (error) {
    console.error('Certificates error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
