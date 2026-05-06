const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createAuthResponse = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      studentId: user.studentId,
      batch: user.batch || ''
    }
  };
};

// Auth route health check
router.get('/', (req, res) => {
  res.json({
    message: 'Auth route is live. Use POST /login, POST /register, POST /autoseed, or POST /seed.'
  });
});

// Register new user (student or admin)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, studentId, password, role, batch } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if studentId already exists (for students)
    if (studentId) {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({ message: 'Student ID already registered' });
      }
    }

    // Create new user
    const newUser = new User({
      fullName,
      email,
      studentId: studentId || `ADMIN${Date.now()}`,
      password,
      role: role || 'student',
      batch: batch || ''
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'Registration successful',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
        studentId: newUser.studentId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Auto-seed on first login attempt
router.post('/autoseed', async (req, res) => {
  try {
    console.log('🌱 Auto-creating test users...');

    const adminHash = await bcrypt.hash('admin123', 12);
    await User.findOneAndUpdate(
      { email: 'dfabela@xu.edu.ph' },
      {
        email: 'dfabela@xu.edu.ph',
        password: adminHash,
        role: 'admin',
        fullName: 'Dean Fabela',
        studentId: 'ADMIN001'
      },
      { upsert: true, new: true }
    );

    const studentHash = await bcrypt.hash('password123', 12);
    await User.findOneAndUpdate(
      { studentId: '20230028369' },
      {
        email: '20230028369@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'John Doe',
        studentId: '20230028369',
        batch: 'BSIT-1A'
      },
      { upsert: true, new: true }
    );

    // Also create a few more test students for different batches
    await User.findOneAndUpdate(
      { studentId: '20230028370' },
      {
        email: '20230028370@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'Jane Smith',
        studentId: '20230028370',
        batch: 'BSIT-1B'
      },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { studentId: '20230028371' },
      {
        email: '20230028371@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'Bob Wilson',
        studentId: '20230028371',
        batch: 'BSIT-2A'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test users auto-created!');
    res.json({ message: 'Test users created' });
  } catch (error) {
    console.error('Auto-seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Auto-create test users if they don't exist (for demo purposes)
    let user = await User.findOne({ email });
    
    // If user doesn't exist, check if it's a test account.
    if (!user) {
      // Check if it's a test account and create it with the documented password.
      if (email === '20230028369@my.xu.edu.ph' || email === 'dfabela@xu.edu.ph') {
        const isAdminTestUser = email === 'dfabela@xu.edu.ph';
        const hashedPassword = await bcrypt.hash(isAdminTestUser ? 'admin123' : 'password123', 12);
        user = await User.findOneAndUpdate(
          { email },
          {
            email,
            password: hashedPassword,
            role: isAdminTestUser ? 'admin' : 'student',
            fullName: isAdminTestUser ? 'Dean Fabela' : 'John Doe',
            studentId: isAdminTestUser ? 'ADMIN001' : '20230028369',
            batch: isAdminTestUser ? '' : 'BSIT-1A'
          },
          { upsert: true, new: true }
        );
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json(createAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google login is not configured on the server' });
    }

    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    const email = payload.email.toLowerCase();
    const studentId = email.endsWith('@my.xu.edu.ph')
      ? email.split('@')[0]
      : `GOOGLE-${payload.sub}`;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
    } else {
      user = await User.create({
        email,
        googleId: payload.sub,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'student',
        fullName: payload.name || email,
        studentId,
        batch: ''
      });
    }

    res.json(createAuthResponse(user));
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Google login failed' });
  }
});

router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Creating test users...');

    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await User.findOneAndUpdate(
      { email: 'dfabela@xu.edu.ph' },
      {
        email: 'dfabela@xu.edu.ph',
        password: adminHash,
        role: 'admin',
        fullName: 'Dean Fabela',
        studentId: 'ADMIN001'
      },
      { upsert: true, new: true }
    );

    const studentHash = await bcrypt.hash('password123', 12);
    const student = await User.findOneAndUpdate(
      { studentId: '20230028369' },
      {
        email: '20230028369@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'John Doe',
        studentId: '20230028369',
        batch: 'BSIT-1A'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test users created!');
    console.log(`👨‍💼 Admin: dfabela@xu.edu.ph / admin123`);
    console.log(`👨‍🎓 Student: 20230028369@my.xu.edu.ph / password123`);

    res.json({ 
      message: 'Test users created successfully!',
      admin: admin.email,
      student: student.email 
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
