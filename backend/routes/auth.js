const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Creating test users...');

    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await User.findOneAndUpdate(
      { email: 'admin@xavier.edu.ph' },
      {
        email: 'admin@xavier.edu.ph',
        password: adminHash,
        role: 'admin',
        fullName: 'Campus Ministry Admin',
        studentId: 'ADMIN001'
      },
      { upsert: true, new: true }
    );

    const studentHash = await bcrypt.hash('password123', 12);
    const student = await User.findOneAndUpdate(
      { email: 'student1@xavier.edu.ph' },
      {
        email: 'student1@xavier.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'John Doe',
        studentId: '2023001',
        batch: 'BSIT-1A'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test users created!');
    console.log(`👨‍💼 Admin: admin@xavier.edu.ph / admin123`);
    console.log(`👨‍🎓 Student: student1@xavier.edu.ph / password123`);

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