const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Recollection = require('./models/Recollection');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
app.use('/api/evaluation', require('./routes/evaluation'));

// Keep demo credentials usable even if older bad hashes already exist.
const seedUsers = async () => {
  try {
    await User.updateMany(
      {
        $or: [
          { department: { $exists: false } },
          { department: '' }
        ],
        batch: { $regex: /^(BSIT|BSCS|BSIS)-/ }
      },
      { $set: { department: 'Computer Studies' } }
    );

    await User.updateMany(
      {
        $or: [
          { department: { $exists: false } },
          { department: '' }
        ],
        batch: { $regex: /^ABCom-/ }
      },
      { $set: { department: 'Arts and Science' } }
    );

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
    console.log('Test admin ready: dfabela@xu.edu.ph');

    const studentHash = await bcrypt.hash('password123', 12);
    await User.findOneAndUpdate(
      { studentId: '20230028369' },
      {
        email: '20230028369@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'John Doe',
        studentId: '20230028369',
        department: 'Computer Studies',
        batch: 'BSIT-1A'
      },
      { upsert: true, new: true }
    );
    console.log('Test student ready: 20230028369@my.xu.edu.ph');

    console.log('Test users ready');
  } catch (error) {
    console.log('Could not seed test users:', error.message);
  }
};

const seedRecollections = async () => {
  try {
    await Recollection.updateMany(
      { department: { $exists: false } },
      { $set: { department: 'Computer Studies' } }
    );

    const now = new Date();
    const makeDate = (daysFromNow, hour, minute = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysFromNow);
      date.setHours(hour, minute, 0, 0);
      return date;
    };

    const recollections = [
      {
        title: 'First Year Recollection',
        description: 'A guided recollection for prayer, reflection, and community sharing.',
        date: makeDate(7, 8, 30),
        venue: 'Xavier University Chapel',
        department: 'Computer Studies',
        yearLevel: '1',
        facilitator: 'Campus Ministry Office',
        slots: 40
      },
      {
        title: 'Midyear Recollection',
        description: 'A half-day recollection focused on gratitude, purpose, and renewal.',
        date: makeDate(14, 13, 0),
        venue: 'AVR 1, Main Campus',
        department: 'Computer Studies',
        yearLevel: '2',
        facilitator: 'Fr. Campus Ministry Team',
        slots: 35
      },
      {
        title: 'Senior Students Recollection',
        description: 'A reflective session for students preparing for practicum and graduation.',
        date: makeDate(21, 9, 0),
        venue: 'Little Theater',
        department: 'Computer Studies',
        yearLevel: '4',
        facilitator: 'Campus Ministry Office',
        slots: 50
      }
    ];

    for (const recollection of recollections) {
      await Recollection.findOneAndUpdate(
        { title: recollection.title },
        recollection,
        { upsert: true, new: true }
      );
    }

    console.log('Recollection schedules ready');
  } catch (error) {
    console.log('Could not seed recollections:', error.message);
  }
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedUsers();
    await seedRecollections();
  })
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
