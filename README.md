# eCMS - Campus Ministry Evaluation Management System

A comprehensive web-based system for managing student evaluations, certificates, and academic tracking for Xavier University Ateneo de Cagayan's Campus Ministry.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

### Core Features
- **User Authentication** - Secure login with role-based access (Admin/Student)
- **Evaluation Management** - Create, assign, and manage evaluation forms
- **Certificate Generation** - QR-code enabled digital certificates
- **Student Dashboard** - View pending evaluations and certificates
- **Admin Dashboard** - Comprehensive analytics and management

### New Features (v1.1.0)
- ✅ **X Button Exit** - Exit evaluations with confirmation modal
- ✅ **Conditional Navbar** - Hide redundant links based on current page
- ✅ **Xavier University Theme** - Gold cross symbol, blue gradient theme
- ✅ **Saved Drafts** - Auto-save evaluation progress (30-second intervals)
- ✅ **Registration** - Student and admin self-registration
- ✅ **Delete Evaluations** - Admin can delete evaluations with confirmation
- ✅ **Logout Confirmation** - Professional logout confirmation modal
- ✅ **Post Evaluation to Students** - Proper evaluation assignment to students

## 📋 Table of Contents

1. [Installation](#installation)
2. [Environment Setup](#environment-setup)
3. [Running the Application](#running-the-application)
4. [Deployment](#deployment)
5. [API Documentation](#api-documentation)
6. [Testing](#testing)
7. [Release History](#release-history)
8. [Contributing](#contributing)
9. [License](#license)

## 🛠️ Installation

### Prerequisites
- Node.js 18.x or higher
- MongoDB 6.x or higher
- Docker & Docker Compose (optional)

### Clone the Repository
```bash
git clone https://github.com/your-org/campus-ministry-ecms.git
cd campus-ministry-ecms/ecms
```

### Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

## ⚙️ Environment Setup

### Backend Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/ecms

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🏃 Running the Application

### Development Mode

#### Start Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Start Frontend
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

### Docker Mode
```bash
# From ecms directory
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Default Credentials
After running the seed script:
- **Admin**: admin@xavier.edu.ph / admin123
- **Student**: student1@xavier.edu.ph / password123

## ☁️ Deployment

### Staging Environment

The staging environment is automatically deployed when code is merged to the `staging` branch.

#### Deployment Providers

| Provider | Setup Instructions |
|----------|-------------------|
| **Render** | 1. Create account at render.com<br>2. Connect GitHub repository<br>3. Set environment variables<br>4. Deploy from staging branch |
| **Vercel** | 1. Import GitHub repository<br>2. Configure build settings<br>3. Add environment variables<br>4. Deploy automatically |
| **Azure** | 1. Create Azure App Service<br>2. Configure CI/CD pipeline<br>3. Set environment variables |

#### Environment Variables for Production

```env
# Backend
PORT=5000
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-secret

# Frontend
REACT_APP_API_URL=https://your-api-domain.com/api
```

### CI/CD Pipeline

The project includes GitHub Actions workflows for:

1. **deploy.yml** - Automatic deployment to staging
2. **release.yml** - Semantic versioning and releases

#### Triggering Deployment
```bash
# Merge to staging branch
git checkout staging
git merge develop
git push origin staging
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/seed` | Create test users |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/evaluations` | List all evaluations |
| POST | `/api/admin/evaluations` | Create evaluation |
| DELETE | `/api/admin/evaluations/:id` | Delete evaluation |
| GET | `/api/admin/stats` | Get dashboard statistics |
| POST | `/api/admin/certificates` | Generate certificate |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/dashboard` | Get student dashboard |
| POST | `/api/student/evaluations/:id/submit` | Submit evaluation |
| POST | `/api/student/evaluations/:id/enroll` | Self-enroll in evaluation |

### Evaluation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/evaluation/:id` | Get evaluation details |

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
- Unit tests for API endpoints
- Component tests for React components
- Integration tests for user flows

## 📦 Release History

### v1.1.0 (Current)
- ✅ Added X button to exit evaluations
- ✅ Conditional navbar for admin
- ✅ Xavier University theme
- ✅ Saved draft functionality
- ✅ Student and admin registration
- ✅ Delete evaluation functionality
- ✅ Logout confirmation modal
- ✅ Fixed post evaluation to students

### v1.0.0
- ✅ Initial release
- ✅ User authentication
- ✅ Evaluation management
- ✅ Certificate generation
- ✅ Basic dashboard

## 🔧 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Branch Strategy
- `main` - Production code
- `develop` - Development code
- `staging` - Staging/deployment code
- `feature/*` - Feature branches

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Xavier University Ateneo de Cagayan
- Campus Ministry Department
- All contributors and testers

---

<p align="center">Made with ❤️ by the eCMS Team</p>