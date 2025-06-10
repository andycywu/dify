import React from 'react';

interface AssistantSuggestedQuestionsProps {
  questions?: string[];
  onSelect?: (q: string) => void;
}

const AssistantSuggestedQuestions: React.FC<AssistantSuggestedQuestionsProps> = ({ questions, onSelect }) => {
  if (!questions || questions.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="font-semibold text-xs text-gray-500 mb-1">猜你想問：</div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs hover:bg-blue-100 border border-blue-100"
            onClick={() => onSelect?.(q)}
            type="button"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssistantSuggestedQuestions;
