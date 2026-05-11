import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    totalStudents: 0,
    totalCertificates: 0,
    pendingEvaluations: 0,
    totalSubmissions: 0
  });
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, evaluationId: null });

  const fetchDashboardData = useCallback(async () => {
    try {
      const [evalsRes, statsRes] = await Promise.all([
        api.get('/admin/evaluations'),
        api.get('/admin/stats')
      ]);
      setEvaluations(evalsRes.data);
      setStats(statsRes.data || mockStats());
    } catch (error) {
      toast.error('Failed to load dashboard');
      setStats(mockStats());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Mock stats for demo (remove when backend stats endpoint is ready)
  const mockStats = () => ({
    totalEvaluations: 12,
    totalStudents: 156,
    totalCertificates: 89,
    pendingEvaluations: 5,
    totalSubmissions: 234
  });

  const handleDeleteEvaluation = async () => {
    if (!deleteModal.evaluationId) return;
    
    try {
      await api.delete(`/admin/evaluations/${deleteModal.evaluationId}`);
      toast.success('Evaluation deleted successfully');
      setEvaluations(evaluations.filter(e => e._id !== deleteModal.evaluationId));
      setStats({ ...stats, totalEvaluations: stats.totalEvaluations - 1 });
    } catch (error) {
      toast.error('Failed to delete evaluation');
    } finally {
      setDeleteModal({ show: false, evaluationId: null });
    }
  };

  const confirmDelete = (id) => {
    setDeleteModal({ show: true, evaluationId: id });
  };

  const statCards = [
    {
      label: 'Total Evaluations',
      value: stats.totalEvaluations,
      icon: (
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
      )
    },
    {
      label: 'Pending Evaluations',
      value: stats.pendingEvaluations,
      icon: (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
      )
    },
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
      )
    },
    {
      label: 'Certificates',
      value: stats.totalCertificates,
      icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    {
      label: 'Submissions',
      value: stats.totalSubmissions,
      icon: (
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976c.419-.491.672-1.102.723-1.745a3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
      )
    }
  ];

  const actionCards = [
    { to: '/admin/evaluation-builder', title: 'New Evaluation', description: 'Create evaluation form' },
    { to: '/admin/certificates', title: 'Generate Certificates', description: 'Issue QR certificates' },
    { to: '/admin/recollections', title: 'Recollections', description: 'Create schedules' },
    { to: '/admin/data', title: 'View Reports', description: 'Download CSV reports' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        DASHBOARD
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => (
            <div key={card.label} className="flex items-center justify-between rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg">
              <div>
                <div className="text-sm font-semibold uppercase text-gray-500">{card.label}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{card.value || 0}</div>
              </div>
              <svg className="h-9 w-9 text-[#3a53a5]" fill="currentColor" viewBox="0 0 20 20">
                {card.icon}
              </svg>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actionCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <h2 className="text-xl font-semibold text-[#3a53a5]">{card.title}</h2>
              <p className="mt-2 text-sm text-gray-500">{card.description}</p>
            </Link>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-3 border-b px-6 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Evaluations</h2>
              <p className="text-sm text-gray-500">Manage evaluation forms and submissions.</p>
            </div>
            {evaluations.length > 5 && (
              <Link to="/admin/evaluations" className="text-sm font-semibold text-[#3a53a5] hover:underline">
                View All Evaluations
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Batch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Submissions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {evaluations.slice(0, 5).map((evaluation) => (
                  <tr key={evaluation._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {evaluation.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {evaluation.batch}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {new Date(evaluation.dueDate).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {evaluation.submissions?.length || 0}/{evaluation.assignedStudents?.length || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold ${
                        evaluation.submissions?.length === evaluation.assignedStudents?.length
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {evaluation.submissions?.length === evaluation.assignedStudents?.length ? 'Complete' : 'Pending'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => confirmDelete(evaluation._id)}
                        className="font-semibold text-red-600 transition hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {evaluations.length === 0 && (
              <div className="py-10 text-center text-gray-500">No evaluations found.</div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Evaluation?</h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. All submissions and student data associated with this evaluation will be removed.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setDeleteModal({ show: false, evaluationId: null })}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvaluation}
                  className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
