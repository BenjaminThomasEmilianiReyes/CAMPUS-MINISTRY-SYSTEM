import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import StudentProfile from './components/StudentProfile';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';
import EvaluationForm from './components/EvaluationForm';
import EvaluationBuilder from './components/EvaluationBuilder';
import DataManagement from './components/DataManagement';
import CertificateGenerator from './components/CertificateGenerator';
import RecollectionRegistrants from './components/RecollectionRegistrants';
import RecollectionScheduleManager from './components/RecollectionScheduleManager';
import ManageAccounts from './components/ManageAccounts';
import StudentRecords from './components/StudentRecords';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const getHomePath = (role) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'staff') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  // Prevent back button from returning to login page
  useEffect(() => {
    if (user && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate(getHomePath(user.role));
    }
    
    // Prevent browser back button
    const preventBack = (e) => {
      if (user && !isAuthPage) {
        e.preventDefault();
        window.history.pushState(null, null, window.location.href);
      }
    };
    
    window.addEventListener('popstate', preventBack);
    window.history.pushState(null, null, window.location.href);
    
    return () => window.removeEventListener('popstate', preventBack);
  }, [user, location.pathname, isAuthPage, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

if (isAuthPage || !user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#edf0f7] text-text-dark">
      {/* SIDEBAR */}
      <aside className="fixed h-full w-[260px] bg-[#3a53a5] p-4 text-white">
        <div className="mb-8 flex items-center gap-3 px-2">
          <img className="h-12 w-12 object-contain" src="/assets/CMO_Seal.png" alt="CMO Seal" />
          <div>
            <h2 className="text-xl font-bold">CMS</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Campus Ministry</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {user.role === 'admin' ? (
            <>
              {/* Only show links that are NOT the current page for admin */}
              {location.pathname !== '/admin/dashboard' && (
                <Link to="/admin/dashboard" className="p-3 hover:bg-[#2a3a85]">Dashboard</Link>
              )}
              {location.pathname !== '/admin/evaluation-builder' && (
                <Link to="/admin/evaluation-builder" className="p-3 hover:bg-[#2a3a85]">Create Evaluation</Link>
              )}
              {location.pathname !== '/admin/data' && (
                <Link to="/admin/data" className="p-3 hover:bg-[#2a3a85]">Data</Link>
              )}
              {location.pathname !== '/admin/accounts' && (
                <Link to="/admin/accounts" className="p-3 hover:bg-[#2a3a85]">Manage Accounts</Link>
              )}
              {location.pathname !== '/admin/student-records' && (
                <Link to="/admin/student-records" className="p-3 hover:bg-[#2a3a85]">Student Records</Link>
              )}
              {location.pathname !== '/admin/certificates' && (
                <Link to="/admin/certificates" className="p-3 hover:bg-[#2a3a85]">Certificates</Link>
              )}
              {location.pathname !== '/admin/recollections' && (
                <Link to="/admin/recollections" className="p-3 hover:bg-[#2a3a85]">Recollections</Link>
              )}
            </>
          ) : user.role === 'staff' ? (
            <>
              {location.pathname !== '/faculty/dashboard' && (
                <Link to="/faculty/dashboard" className="p-3 hover:bg-[#2a3a85]">Dashboard</Link>
              )}
              {location.pathname !== '/admin/evaluation-builder' && (
                <Link to="/admin/evaluation-builder" className="p-3 hover:bg-[#2a3a85]">Create Evaluation</Link>
              )}
              {location.pathname !== '/admin/recollections' && (
                <Link to="/admin/recollections" className="p-3 hover:bg-[#2a3a85]">Recollections</Link>
              )}
              {location.pathname !== '/admin/student-records' && (
                <Link to="/admin/student-records" className="p-3 hover:bg-[#2a3a85]">Student Records</Link>
              )}
            </>
          ) : (
            <>
              {location.pathname !== '/student/dashboard' && (
                <Link to="/student/dashboard" className="p-3 hover:bg-[#2a3a85]">Dashboard</Link>
              )}
              {location.pathname !== '/student/profile' && (
                <Link to="/student/profile" className="p-3 hover:bg-[#2a3a85]">Student Profile</Link>
              )}
            </>
          )}
        </nav>
<button onClick={handleLogout} className="absolute bottom-5 flex w-[228px] items-center gap-2 p-3 text-left hover:bg-[#2a3a85]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <div className="ml-[260px] flex-1">
        {/* TOPBAR */}
        <header className="flex h-[70px] items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          <h1 className="text-lg font-semibold text-[#3a53a5]">
            {user.role === 'admin'
              ? location.pathname === '/admin/recollections'
                ? 'Recollection Schedules'
                : location.pathname === '/admin/certificates'
                  ? 'Certificates'
                  : location.pathname === '/admin/data'
                    ? 'Data'
                    : location.pathname === '/admin/accounts'
                      ? 'Manage Accounts'
                      : location.pathname === '/admin/student-records'
                        ? 'Student Records'
                        : location.pathname === '/admin/evaluation-builder'
                          ? 'Create Evaluation'
                          : 'Admin Dashboard'
              : user.role === 'staff'
                ? location.pathname === '/admin/student-records'
                  ? 'Student Records'
                  : location.pathname === '/admin/recollections'
                  ? 'Recollection Schedules'
                  : location.pathname === '/admin/evaluation-builder'
                    ? 'Create Evaluation'
                    : 'Faculty Dashboard'
              : location.pathname === '/student/profile'
                ? 'Student Profile'
                : 'Student Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-medium">{user.fullName}</span>
            <span className="text-sm capitalize text-gray-500">({user.role})</span>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-6">
          <Routes>
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <ProtectedRoute role="student">
                  <StudentProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty/dashboard" 
              element={
                <ProtectedRoute role="staff">
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/evaluation/:id" element={<EvaluationForm />} />
            <Route 
              path="/admin/evaluation-builder" 
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <EvaluationBuilder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/data" 
              element={
                <ProtectedRoute role="admin">
                  <DataManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/accounts" 
              element={
                <ProtectedRoute role="admin">
                  <ManageAccounts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/student-records" 
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <StudentRecords />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/certificates" 
              element={
                <ProtectedRoute role="admin">
                  <CertificateGenerator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/recollections" 
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <RecollectionScheduleManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/recollections/:id/registrants" 
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <RecollectionRegistrants />
                </ProtectedRoute>
              } 
            />
<Route path="/" element={<Navigate to={getHomePath(user.role)} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
