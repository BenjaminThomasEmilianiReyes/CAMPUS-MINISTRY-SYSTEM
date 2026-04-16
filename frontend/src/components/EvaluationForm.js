import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const EvaluationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      const response = await api.get(`/evaluation/${id}`);
      setEvaluation(response.data);
    } catch (error) {
      toast.error('Failed to load evaluation');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post(`/student/evaluations/${id}/submit`, { answers: data });
      toast.success('Evaluation submitted successfully!');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!evaluation) {
    return <div>Evaluation not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-4">
              {evaluation.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {evaluation.description}
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
              <p className="text-sm font-medium text-blue-800">
                📅 Due: {new Date(evaluation.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {evaluation.questions.map((question, index) => (
              <div key={question._id || index} className="bg-gray-50 p-8 rounded-2xl border-2 border-gray-100">
                <label className="block text-lg font-semibold text-gray-900 mb-6">
                  Q{index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {question.type === 'text' && (
                  <textarea
                    {...register(`q${index}`, { required: question.required })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[120px]"
                    placeholder="Enter your response here..."
                  />
                )}

                {question.type === 'radio' && (
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => (
                      <label key={optIndex} className="flex items-center p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                        <input
                          type="radio"
                          value={option}
                          {...register(`q${index}`, { required: question.required })}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className="flex items-center space-x-2">
                    {[1,2,3,4,5].map((star) => (
                      <label key={star} className="cursor-pointer">
                        <input
                          type="radio"
                          value={star}
                          {...register(`q${index}`, { required: question.required })}
                          className="sr-only"
                        />
                        <svg
                          className="w-8 h-8 text-yellow-400 hover:text-yellow-500 transition-colors"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </label>
                    ))}
                  </div>
                )}

                {errors[`q${index}`] && (
                  <p className="mt-2 text-sm text-red-600">This field is required</p>
                )}
              </div>
            ))}

            <div className="flex justify-between pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-12 py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;