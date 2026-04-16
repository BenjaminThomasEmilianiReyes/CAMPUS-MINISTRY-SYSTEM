import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const EvaluationCard = ({ evaluation }) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-gradient-to-r from-blue-50 to-blue-50 p-6 rounded-xl border-2 border-transparent hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
         onClick={() => navigate(`/evaluation/${evaluation._id}`)}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
          {evaluation.title}
        </h3>
        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Due {format(new Date(evaluation.dueDate), 'MMM dd, yyyy')}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{evaluation.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {evaluation.questions.length} questions
        </span>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Start Evaluation
        </button>
      </div>
    </div>
  );
};

export default EvaluationCard;