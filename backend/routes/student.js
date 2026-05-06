const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Recollection = require('../models/Recollection');
const router = express.Router();

const getYearLevelFromBatch = (batch = '') => {
  const match = String(batch).match(/-(\d)/);
  return match ? match[1] : '';
};

const inferDepartmentFromBatch = (batch = '') => {
  if (/^BSIT-|^BSCS-|^BSIS-/.test(batch)) return 'Computer Studies';
  if (/^ABCom-/.test(batch)) return 'Arts and Science';
  return '';
};

const getStudentDepartment = (user) => user?.department || inferDepartmentFromBatch(user?.batch || '');

const departments = [
  'Nursing',
  'Computer Studies',
  'Engineering',
  'Agriculture',
  'Business Management',
  'Education',
  'Arts and Science'
];

const courses = ['BSIT', 'BSCS', 'BSIS', 'ABCom'];

const getCourseFromBatch = (batch = '') => {
  const match = String(batch).match(/^([A-Za-z]+)-/);
  return match ? match[1] : '';
};

const buildStudentProfile = (user) => {
  const batch = user?.batch || '';
  const department = getStudentDepartment(user);
  const yearLevel = getYearLevelFromBatch(batch);
  const course = getCourseFromBatch(batch);

  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    department,
    course,
    yearLevel,
    batch,
    profileComplete: Boolean(department && course && yearLevel)
  };
};

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
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentYearLevel = getYearLevelFromBatch(user?.batch);
    const studentDepartment = getStudentDepartment(user);
    
    // Get evaluations assigned to this student that haven't been submitted
    const evaluations = await Evaluation.find({
      assignedStudents: req.user.id,
      submissions: { $not: { $elemMatch: { student: req.user.id } } }
    }).populate('createdBy', 'fullName');

    // Also get evaluations that might be available for self-enrollment
    const availableEvaluations = await Evaluation.find({
      _id: { $nin: user.assignedEvaluations || [] },
      dueDate: { $gte: new Date() }
    }).populate('createdBy', 'fullName');

    const recollections = await Recollection.find({
      date: { $gte: new Date() },
      department: studentDepartment,
      yearLevel: studentYearLevel
    }).sort({ date: 1 });

    const recollectionSchedules = recollections.map((recollection) => {
      const participants = recollection.participants || [];
      return {
        ...recollection.toObject(),
        participantCount: participants.length,
        isRegistered: participants.some(
          participantId => participantId.toString() === req.user.id
        )
      };
    });

    res.json({
      profile: buildStudentProfile(user),
      announcements: [
        "Welcome back to Campus Ministry!",
        "Complete your evaluations before the deadline",
        "Check your certificates below"
      ],
      pendingEvaluations: evaluations,
      availableEvaluations: availableEvaluations,
      recollectionSchedules,
      certificates: user.certificates || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(buildStudentProfile(user));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { department, course, yearLevel } = req.body;

    if (!departments.includes(department)) {
      return res.status(400).json({ message: 'Please select a valid department' });
    }

    if (!courses.includes(course)) {
      return res.status(400).json({ message: 'Please select a valid course' });
    }

    if (!['1', '2', '3', '4'].includes(String(yearLevel))) {
      return res.status(400).json({ message: 'Please select a valid year level' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        department,
        batch: `${course}-${yearLevel}`
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: buildStudentProfile(user),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
        department: user.department || '',
        batch: user.batch || ''
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Participate in a recollection schedule
router.post('/recollections/:id/participate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('batch department');
    const studentYearLevel = getYearLevelFromBatch(user?.batch);
    const studentDepartment = getStudentDepartment(user);
    const recollection = await Recollection.findById(req.params.id);
    if (!recollection) {
      return res.status(404).json({ message: 'Recollection schedule not found' });
    }

    if (new Date(recollection.date) < new Date()) {
      return res.status(400).json({ message: 'This recollection schedule has already passed' });
    }

    if (recollection.yearLevel !== studentYearLevel) {
      return res.status(403).json({ message: 'This recollection is not assigned to your year level' });
    }

    if (recollection.department !== studentDepartment) {
      return res.status(403).json({ message: 'This recollection is not assigned to your department' });
    }

    const alreadyRegistered = recollection.participants.some(
      participantId => participantId.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this recollection' });
    }

    if (recollection.slots && recollection.participants.length >= recollection.slots) {
      return res.status(400).json({ message: 'This recollection schedule is already full' });
    }

    recollection.participants.push(req.user.id);
    await recollection.save();

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { registeredRecollections: recollection._id }
    });

    res.json({ message: 'Successfully registered for recollection', recollection });
  } catch (error) {
    console.error('Participate recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Self-enroll in an evaluation
router.post('/evaluations/:id/enroll', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if already enrolled
    const alreadyEnrolled = evaluation.assignedStudents.some(
      studentId => studentId.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this evaluation' });
    }

    // Add student to evaluation
    evaluation.assignedStudents.push(req.user.id);
    await evaluation.save();

    // Add evaluation to student's assigned list
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { assignedEvaluations: evaluation._id }
    });

    res.json({ message: 'Successfully enrolled in evaluation', evaluation });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/evaluations/:id/submit', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    const isAssigned = evaluation.assignedStudents.some(
      studentId => studentId.toString() === req.user.id
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const alreadySubmitted = evaluation.submissions.some(
      submission => submission.student?.toString() === req.user.id
    );

    if (alreadySubmitted) {
      return res.status(400).json({ message: 'Evaluation already submitted' });
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
