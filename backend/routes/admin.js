const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Recollection = require('../models/Recollection');
const CmoEvent = require('../models/CmoEvent');
const CertificateTemplate = require('../models/CertificateTemplate');
const QRCode = require('qrcode');
const { sendEmail } = require('../services/emailService');
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

const adminOrFacultyAuth = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or formator access required' });
  }
  next();
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFacultyScope = async (req) => {
  if (req.user.role !== 'staff') return null;
  return User.findById(req.user.id).select('department batch').lean();
};

const applyFacultyStudentScope = (query, faculty) => {
  if (!faculty) return query;
  if (faculty.department) query.department = faculty.department;
  if (faculty.batch) query.batch = { $regex: `^${escapeRegex(faculty.batch)}` };
  return query;
};

const ensureFacultyBatchAccess = (faculty, batch) => {
  if (!faculty || !faculty.batch || !batch || batch === 'General') return true;
  return String(batch).startsWith(faculty.batch);
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getStudentsForRecollection = async (recollection) => {
  const yearPattern = `-${escapeRegex(recollection.yearLevel)}`;
  return User.find({
    role: 'student',
    department: recollection.department,
    batch: { $regex: yearPattern },
    email: { $exists: true, $ne: '' }
  })
    .select('fullName email studentId batch department')
    .lean();
};

const notifyStudentsForRecollection = async (recollection) => {
  const students = await getStudentsForRecollection(recollection);
  if (students.length === 0) {
    return { matchedStudents: 0, sent: 0, previewed: 0, failed: 0 };
  }

  const scheduleDate = new Date(recollection.date);
  const formattedDate = scheduleDate.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const subject = `New Recollection Schedule: ${recollection.title}`;
  const results = await Promise.allSettled(students.map((student) => {
    const text = [
      `Hello ${student.fullName},`,
      '',
      'A recollection schedule has been posted for your department and year level.',
      '',
      `Title: ${recollection.title}`,
      `Date and Time: ${formattedDate}`,
      `Venue: ${recollection.venue}`,
      `Department: ${recollection.department}`,
      `Year Level: ${recollection.yearLevel}`,
      recollection.facilitator ? `Facilitator: ${recollection.facilitator}` : '',
      '',
      recollection.description || '',
      '',
      'Please log in to the Campus Ministry System to view the schedule and register if needed.'
    ].filter(Boolean).join('\n');

    const html = `
      <p>Hello ${escapeHtml(student.fullName)},</p>
      <p>A recollection schedule has been posted for your department and year level.</p>
      <ul>
        <li><strong>Title:</strong> ${escapeHtml(recollection.title)}</li>
        <li><strong>Date and Time:</strong> ${formattedDate}</li>
        <li><strong>Venue:</strong> ${escapeHtml(recollection.venue)}</li>
        <li><strong>Department:</strong> ${escapeHtml(recollection.department)}</li>
        <li><strong>Year Level:</strong> ${escapeHtml(recollection.yearLevel)}</li>
        ${recollection.facilitator ? `<li><strong>Facilitator:</strong> ${escapeHtml(recollection.facilitator)}</li>` : ''}
      </ul>
      ${recollection.description ? `<p>${escapeHtml(recollection.description)}</p>` : ''}
      <p>Please log in to the Campus Ministry System to view the schedule and register if needed.</p>
    `;

    return sendEmail({
      to: student.email,
      subject,
      text,
      html
    });
  }));

  return results.reduce((summary, result) => {
    if (result.status === 'rejected') {
      return { ...summary, failed: summary.failed + 1 };
    }
    if (result.value.preview) {
      return { ...summary, previewed: summary.previewed + 1 };
    }
    return { ...summary, sent: summary.sent + 1 };
  }, { matchedStudents: students.length, sent: 0, previewed: 0, failed: 0 });
};

const buildEventQuery = ({ keyword, startDate, endDate } = {}) => {
  const query = {};
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), 'i');
    query.$or = [
      { department: regex },
      { description: regex },
      { batch: regex },
      { yearLevel: regex },
      { venue: regex },
      { inCharge: regex }
    ];
  }

  if (startDate || endDate) {
    query.eventDate = {};
    if (startDate) query.eventDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.eventDate.$lte = end;
    }
  }

  return query;
};

const normalizeRole = (role = '') => {
  const value = String(role).toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'staff' || value === 'formator') return 'staff';
  return 'student';
};

const splitName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
};

router.get('/dashboard-cards', [auth, adminAuth], async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalStudents, totalCertificates, eventsNextWeek, eventsThisMonth] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Certificate.countDocuments(),
      CmoEvent.countDocuments({ eventDate: { $gte: now, $lte: nextWeek } }),
      CmoEvent.countDocuments({ eventDate: { $gte: monthStart, $lte: monthEnd } })
    ]);

    res.json({ totalStudents, totalCertificates, eventsNextWeek, eventsThisMonth });
  } catch (error) {
    console.error('Dashboard cards error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/events', [auth, adminAuth], async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const query = buildEventQuery(req.query);

    const [events, totalCount] = await Promise.all([
      CmoEvent.find(query)
        .sort({ eventDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CmoEvent.countDocuments(query)
    ]);

    res.json({ data: events, totalCount, page, limit });
  } catch (error) {
    console.error('Events list error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/events', [auth, adminAuth], async (req, res) => {
  try {
    const required = ['eventDate', 'department', 'description', 'batch', 'yearLevel', 'venue', 'inCharge'];
    const missing = required.filter((field) => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const event = await CmoEvent.create({
      eventDate: new Date(req.body.eventDate),
      department: req.body.department,
      description: req.body.description,
      batch: req.body.batch,
      yearLevel: req.body.yearLevel,
      venue: req.body.venue,
      inCharge: req.body.inCharge,
      createdBy: req.user.id
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/events/:id', [auth, adminAuth], async (req, res) => {
  try {
    const event = await CmoEvent.findByIdAndUpdate(
      req.params.id,
      {
        eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
        department: req.body.department,
        description: req.body.description,
        batch: req.body.batch,
        yearLevel: req.body.yearLevel,
        venue: req.body.venue,
        inCharge: req.body.inCharge
      },
      { new: true, runValidators: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/events/:id', [auth, adminAuth], async (req, res) => {
  try {
    const event = await CmoEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/certificate-templates', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim();
    const query = keyword
      ? { templateTitle: { $regex: escapeRegex(keyword), $options: 'i' } }
      : {};

    const templates = await CertificateTemplate.find(query).sort({ createdAt: -1 }).lean();
    res.json(templates);
  } catch (error) {
    console.error('Certificate templates error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/certificate-templates', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const required = ['templateTitle', 'certEventYearLevel', 'certEventType', 'certEventTheme', 'certEventDate', 'certEventVenue', 'certDirectorName'];
    const missing = required.filter((field) => !req.body[field]);
    if (missing.length) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });

    const template = await CertificateTemplate.create({
      templateTitle: req.body.templateTitle,
      certBgImgKey: req.body.certBgImgKey || '',
      certEventYearLevel: req.body.certEventYearLevel,
      certEventType: req.body.certEventType,
      certEventTheme: req.body.certEventTheme,
      certEventDate: req.body.certEventDate,
      certEventVenue: req.body.certEventVenue,
      certDirectorName: req.body.certDirectorName,
      certSigImgKey: req.body.certSigImgKey || '',
      createdBy: req.user.id
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create certificate template error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/certificate-templates/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    console.error('Update certificate template error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/certificate-templates/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete certificate template error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/student-profile/:studentId', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const student = await User.findOne({
      role: 'student',
      studentId: req.params.studentId
    })
      .populate({
        path: 'certificates',
        populate: { path: 'issuedBy', select: 'fullName email' }
      })
      .lean();

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const certificates = (student.certificates || []).map((certificate) => ({
      certificateId: certificate._id,
      certificateURL: certificate.qrCode || '',
      eventName: certificate.eventName,
      eventDate: certificate.eventDate,
      DateGenerated: certificate.createdAt,
      CreatedBy: certificate.issuedBy?.fullName || 'Campus Ministry',
      status: certificate.status
    }));

    res.json({
      studentName: student.fullName,
      studentId: student.studentId,
      college: student.college || '',
      department: student.department || '',
      major: student.major || '',
      yearStanding: student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || '',
      departmentYearStanding: `${student.department || 'No Department'} - ${student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || 'No Year'}`,
      certificatesTotal: certificates.length,
      certificates
    });
  } catch (error) {
    console.error('Student profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 🔥 FIXED: Create Evaluation (Removes invalid _id from questions)
router.post('/evaluations', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    console.log('📝 Creating evaluation:', req.body.title);
    const faculty = await getFacultyScope(req);
    
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

    if (!ensureFacultyBatchAccess(faculty, batch)) {
      return res.status(403).json({ message: 'Formator can only create evaluations for their assigned course/year scope' });
    }
    
    // Auto-assign students based on batch if no specific students selected
    if (assignedStudents.length === 0 && batch && batch !== 'General') {
      const studentQuery = applyFacultyStudentScope({ role: 'student', batch: { $regex: `^${escapeRegex(batch)}` } }, faculty);
      const batchStudents = await User.find(studentQuery).select('_id');
      assignedStudents = batchStudents.map(s => s._id);
      console.log(`🎯 Auto-assigning ${assignedStudents.length} students from batch: ${batch}`);
    } else if (faculty && assignedStudents.length > 0) {
      const scopedStudents = await User.find(applyFacultyStudentScope({
        role: 'student',
        _id: { $in: assignedStudents }
      }, faculty)).select('_id');
      if (scopedStudents.length !== assignedStudents.length) {
        return res.status(403).json({ message: 'Formator can only assign students in their assigned scope' });
      }
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
router.get('/evaluations', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const faculty = await getFacultyScope(req);
    const query = faculty?.batch ? { batch: { $regex: `^${escapeRegex(faculty.batch)}` } } : {};
    const evaluations = await Evaluation.find(query)
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
router.get('/recollections', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const faculty = await getFacultyScope(req);
    const query = faculty
      ? {
          ...(faculty.department ? { department: faculty.department } : {}),
          ...(faculty.batch ? { yearLevel: String(faculty.batch).match(/-(\d)/)?.[1] || undefined } : {})
        }
      : {};
    if (query.yearLevel === undefined) delete query.yearLevel;

    const recollections = await Recollection.find(query)
      .populate('participants', 'fullName studentId batch department')
      .sort({ date: 1 });

    res.json(recollections);
  } catch (error) {
    console.error('Get recollections error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get one recollection schedule with registrants
router.get('/recollections/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const faculty = await getFacultyScope(req);
    const recollection = await Recollection.findById(req.params.id)
      .populate('participants', 'fullName studentId email batch department')
      .sort({ date: 1 });

    if (!recollection) {
      return res.status(404).json({ message: 'Recollection schedule not found' });
    }

    if (faculty) {
      const facultyYearLevel = String(faculty.batch || '').match(/-(\d)/)?.[1] || '';
      if ((faculty.department && recollection.department !== faculty.department) ||
        (facultyYearLevel && recollection.yearLevel !== facultyYearLevel)) {
        return res.status(403).json({ message: 'Formator can only view recollections in their assigned scope' });
      }
    }

    res.json(recollection);
  } catch (error) {
    console.error('Get recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create recollection schedule
router.post('/recollections', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const faculty = await getFacultyScope(req);
    if (!['1', '2', '3', '4'].includes(req.body.yearLevel)) {
      return res.status(400).json({ message: 'Please select a valid year level' });
    }

    if (!departments.includes(req.body.department)) {
      return res.status(400).json({ message: 'Please select a valid department' });
    }

    if (faculty) {
      const facultyYearLevel = String(faculty.batch || '').match(/-(\d)/)?.[1] || '';
      if ((faculty.department && req.body.department !== faculty.department) ||
        (facultyYearLevel && req.body.yearLevel !== facultyYearLevel)) {
        return res.status(403).json({ message: 'Formator can only create recollections in their assigned scope' });
      }
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
    let emailNotification = { matchedStudents: 0, sent: 0, previewed: 0, failed: 0 };
    try {
      emailNotification = await notifyStudentsForRecollection(recollection);
    } catch (notificationError) {
      console.error('Recollection email notification error:', notificationError);
      emailNotification = {
        ...emailNotification,
        failed: 1,
        error: 'Schedule was created, but email notifications failed.'
      };
    }

    res.status(201).json({
      ...recollection.toObject(),
      emailNotification
    });
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
      qrData,
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

// Verify certificate QR code
router.post('/certificates/verify', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const { code } = req.body;
    const scannedCode = String(code || '').trim();

    if (!scannedCode) {
      return res.status(400).json({ message: 'QR code data is required' });
    }

    const query = {
      $or: [
        { qrData: scannedCode },
        { qrCode: scannedCode }
      ]
    };

    if (/^[0-9a-fA-F]{24}$/.test(scannedCode)) {
      query.$or.push({ _id: scannedCode });
    }

    if (scannedCode.startsWith('CERT:')) {
      const [, studentId, timestamp] = scannedCode.split(':');
      if (timestamp) query.$or.push({ qrData: { $regex: `^CERT:${escapeRegex(studentId || '')}:${escapeRegex(timestamp)}:` } });
    }

    const certificate = await Certificate.findOne(query)
      .populate('student', 'fullName studentId email batch department')
      .populate('issuedBy', 'fullName email');

    if (!certificate) {
      return res.status(404).json({ valid: false, message: 'Certificate not found or QR code is invalid' });
    }

    if (certificate.status !== 'verified') {
      certificate.status = 'verified';
      await certificate.save();
    }

    res.json({
      valid: true,
      message: 'Certificate verified successfully',
      certificate
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
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
router.get('/students', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const { batch, yearLevel, completionStatus } = req.query;
    const faculty = await getFacultyScope(req);
    const query = applyFacultyStudentScope({ role: 'student' }, faculty);

    if (batch) {
      if (!ensureFacultyBatchAccess(faculty, batch)) {
        return res.status(403).json({ message: 'Formator can only view students in their assigned scope' });
      }
      query.batch = { $regex: `^${escapeRegex(batch)}` };
    } else if (yearLevel && !faculty?.batch) {
      const facultyYearLevel = String(faculty?.batch || '').match(/-(\d)/)?.[1] || '';
      if (facultyYearLevel && String(yearLevel) !== facultyYearLevel) {
        return res.status(403).json({ message: 'Formator can only view students in their assigned year level' });
      }
      query.batch = { $regex: `-${yearLevel}` };
    }

    let students = await User.find(query)
      .select('fullName firstName lastName studentId email batch college department major yearStanding certificates')
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
        firstName: student.firstName || splitName(student.fullName).firstName,
        lastName: student.lastName || splitName(student.fullName).lastName,
        yearStanding: student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || '',
        certificateCount: student.certificates?.length || 0,
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
    const role = req.query.role ? normalizeRole(req.query.role) : null;
    const query = role ? { role } : {};
    const users = await User.find(query)
      .select('fullName email role status batch department studentId createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/users', [auth, adminAuth], async (req, res) => {
  try {
    const { fullName, username, email, password, role, status, department, batch } = req.body;
    if (!email || !password || !(fullName || username)) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const displayName = fullName || username;
    const accountRole = normalizeRole(role);
    const newUser = new User({
      fullName: displayName,
      email: String(email).toLowerCase(),
      password,
      role: accountRole,
      status: ['active', 'inactive'].includes(status) ? status : 'active',
      department: department || '',
      batch: batch || '',
      studentId: accountRole === 'student' ? req.body.studentId || `STU${Date.now()}` : req.body.studentId || `USR${Date.now()}`
    });

    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      batch: newUser.batch,
      department: newUser.department,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id', [auth, adminAuth], async (req, res) => {
  try {
    const { fullName, username, email, password, role, status, department, batch } = req.body;
    const updates = {
      ...(fullName || username ? { fullName: fullName || username } : {}),
      ...(email ? { email: String(email).toLowerCase() } : {}),
      ...(role ? { role: normalizeRole(role) } : {}),
      ...(status && ['active', 'inactive'].includes(status) ? { status } : {}),
      ...(department !== undefined ? { department } : {}),
      ...(batch !== undefined ? { batch } : {})
    };

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.assign(user, updates);
    if (password) user.password = password;
    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      batch: user.batch,
      department: user.department,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', [auth, adminAuth], async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/students', [auth, adminAuth], async (req, res) => {
  try {
    const { studentId, college, department, major, email, firstName, lastName, yearStanding } = req.body;
    if (!studentId || !department || !email || !firstName || !lastName || !yearStanding) {
      return res.status(400).json({ message: 'Student ID, name, email, department, and year standing are required' });
    }

    const existing = await User.findOne({ $or: [{ studentId }, { email: String(email).toLowerCase() }] });
    if (existing) return res.status(400).json({ message: 'Student ID or email already exists' });

    const student = new User({
      studentId,
      college: college || '',
      department,
      major: major || '',
      email: String(email).toLowerCase(),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      yearStanding,
      batch: `${department}-${yearStanding}`,
      role: 'student',
      password: 'password123'
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/students/:id', [auth, adminAuth], async (req, res) => {
  try {
    const { college, department, major, email, firstName, lastName, yearStanding } = req.body;
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    const names = splitName(req.body.fullName || student.fullName);
    student.college = college ?? student.college;
    student.department = department ?? student.department;
    student.major = major ?? student.major;
    student.email = email ? String(email).toLowerCase() : student.email;
    student.firstName = firstName || names.firstName;
    student.lastName = lastName || names.lastName;
    student.fullName = `${student.firstName} ${student.lastName}`.trim();
    student.yearStanding = yearStanding ?? student.yearStanding;
    if (student.department && student.yearStanding) student.batch = `${student.department}-${student.yearStanding}`;
    await student.save();

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/students/:id', [auth, adminAuth], async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
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
