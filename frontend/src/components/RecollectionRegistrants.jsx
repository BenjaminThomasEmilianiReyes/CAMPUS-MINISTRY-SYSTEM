import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const RecollectionRegistrants = () => {
  const { id } = useParams();
  const [recollection, setRecollection] = useState(null);
  const [loading, setLoading] = useState(true);

  const yearLevelLabels = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year'
  };

  useEffect(() => {
    const fetchRecollection = async () => {
      try {
        const response = await api.get(`/admin/recollections/${id}`);
        setRecollection(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load registrants');
      } finally {
        setLoading(false);
      }
    };

    fetchRecollection();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!recollection) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <Link to="/admin/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
          Back to Dashboard
        </Link>
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 text-center text-gray-500">
          Recollection schedule not found.
        </div>
      </div>
    );
  }

  const registrants = recollection.participants || [];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/admin/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{recollection.title}</h1>
            <p className="text-gray-600 max-w-3xl">{recollection.description}</p>
          </div>
          <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-4 py-2 rounded-full w-fit">
            {registrants.length}/{recollection.slots || 0} registrants
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-700">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 mb-1">Date and Time</p>
            <p>{new Date(recollection.date).toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 mb-1">Venue</p>
            <p>{recollection.venue}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 mb-1">Department</p>
            <p>{recollection.department || 'Not set'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 mb-1">Year Level</p>
            <p>{yearLevelLabels[recollection.yearLevel] || 'Not set'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 mb-1">Facilitator</p>
            <p>{recollection.facilitator || 'Not set'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Registrants</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
            {registrants.length}
          </span>
        </div>

        {registrants.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
            No students have registered for this recollection yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrants.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{student.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.studentId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.batch || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecollectionRegistrants;
