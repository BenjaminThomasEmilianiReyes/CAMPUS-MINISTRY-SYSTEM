import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';  // ✅ FIXED
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import EvaluationForm from './components/EvaluationForm';
import EvaluationBuilder from './components/EvaluationBuilder';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function AppContent() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
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
              <ProtectedRoute role="admin">
                <EvaluationBuilder />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-right" />  // ✅ FIXED
      </div>
    </Router>
  );
}

function App() {
  return <AppContent />;
}

export default App;