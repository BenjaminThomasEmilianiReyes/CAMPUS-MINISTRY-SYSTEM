import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import EvaluationForm from './components/EvaluationForm';
import EvaluationBuilder from './components/EvaluationBuilder';
import DataManagement from './components/DataManagement';
import CertificateGenerator from './components/CertificateGenerator';
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
          <Route path="/register" element={<Register />} />
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
          <Route 
            path="/admin/data" 
            element={
              <ProtectedRoute role="admin">
                <DataManagement />
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
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function App() {
  return <AppContent />;
}

export default App;