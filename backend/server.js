const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

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

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedUsers();
  })
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
