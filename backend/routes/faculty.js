const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Recollection = require('../models/Recollection');
const CertificateRecommendation = require('../models/CertificateRecommendation');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const facultyAuth = (req, res, next) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Faculty access required' });
  }
  next();
};

const getYearLevelFromBatch = (batch = '') => {
  const match = String(batch).match(/-(\d)/);
  return match ? match[1] : '';
};

const buildStudentScope = (faculty) => {
  const scope = { role: 'student' };
  if (faculty.department) scope.department = faculty.department;
  if (faculty.batch) scope.batch = { $regex: `^${faculty.batch}` };
  return scope;
};

router.get('/dashboard', [auth, facultyAuth], async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id).select('fullName email department batch');
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    const studentScope = buildStudentScope(faculty);
    const students = await User.find(studentScope)
      .select('fullName studentId email batch department certificates')
      .sort({ fullName: 1 })
      .lean();

    const studentIds = students.map((student) => student._id);
    const evaluations = await Evaluation.find({
      $or: [
        { assignedStudents: { $in: studentIds } },
        ...(faculty.batch ? [{ batch: { $regex: `^${faculty.batch}` } }] : [])
      ]
    })
      .populate('createdBy', 'fullName')
      .sort({ dueDate: 1 })
      .lean();

    const completionByStudent = new Map(students.map((student) => [student._id.toString(), 0]));
    evaluations.forEach((evaluation) => {
      (evaluation.submissions || []).forEach((submission) => {
        const studentId = submission.student?.toString();
        if (completionByStudent.has(studentId)) {
          completionByStudent.set(studentId, completionByStudent.get(studentId) + 1);
        }
      });
    });

    const studentsWithProgress = students.map((student) => {
      const completedEvaluations = completionByStudent.get(student._id.toString()) || 0;
      return {
        ...student,
        completedEvaluations,
        certificateCount: student.certificates?.length || 0
      };
    });

    const completedStudents = studentsWithProgress.filter((student) => student.completedEvaluations > 0).length;
    const pendingStudents = Math.max(studentsWithProgress.length - completedStudents, 0);

    const yearLevel = getYearLevelFromBatch(faculty.batch);
    const recollectionQuery = {
      date: { $gte: new Date() },
      ...(faculty.department ? { department: faculty.department } : {}),
      ...(yearLevel ? { yearLevel } : {})
    };
    const recollections = await Recollection.find(recollectionQuery)
      .populate('participants', 'fullName studentId batch department')
      .sort({ date: 1 })
      .lean();

    const recommendations = await CertificateRecommendation.find({ recommendedBy: req.user.id })
      .populate('student', 'fullName studentId batch department')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      faculty: {
        fullName: faculty.fullName,
        email: faculty.email,
        department: faculty.department || '',
        batch: faculty.batch || ''
      },
      stats: {
        assignedStudents: studentsWithProgress.length,
        completedStudents,
        pendingStudents,
        scopedEvaluations: evaluations.length,
        upcomingRecollections: recollections.length,
        recommendations: recommendations.length
      },
      students: studentsWithProgress,
      evaluations: evaluations.map((evaluation) => ({
        _id: evaluation._id,
        title: evaluation.title,
        batch: evaluation.batch,
        dueDate: evaluation.dueDate,
        assignedCount: evaluation.assignedStudents?.length || 0,
        submissionCount: evaluation.submissions?.length || 0,
        createdBy: evaluation.createdBy
      })),
      recollections: recollections.map((recollection) => ({
        ...recollection,
        participantCount: recollection.participants?.length || 0
      })),
      recommendations
    });
  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/certificate-recommendations', [auth, facultyAuth], async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id).select('department batch');
    const student = await User.findOne({
      _id: req.body.studentId,
      ...buildStudentScope(faculty)
    });

    if (!student) {
      return res.status(404).json({ message: 'Student is not in your assigned scope' });
    }

    const recommendation = await CertificateRecommendation.findOneAndUpdate(
      { student: student._id, recommendedBy: req.user.id, status: 'pending' },
      {
        student: student._id,
        recommendedBy: req.user.id,
        reason: req.body.reason || 'Completed assigned evaluation requirements',
        status: 'pending'
      },
      { upsert: true, new: true }
    ).populate('student', 'fullName studentId batch department');

    res.status(201).json({
      message: 'Certificate recommendation sent to admin',
      recommendation
    });
  } catch (error) {
    console.error('Certificate recommendation error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
