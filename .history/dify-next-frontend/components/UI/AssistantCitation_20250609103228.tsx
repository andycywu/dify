import React from 'react';

export interface CitationResource {
  position: number;
  dataset_id: string;
  dataset_name: string;
  document_id: string;
  document_name: string;
  segment_id: string;
  score: number;
  content: string;
}

interface AssistantCitationProps {
  resources?: CitationResource[];
}

const AssistantCitation: React.FC<AssistantCitationProps> = ({ resources }) => {
  if (!resources || resources.length === 0) return null;
  return (
    <div className="mt-2 text-xs text-gray-500">
      <div className="font-semibold mb-1">引用來源：</div>
      <ul className="list-disc pl-5">
        {resources.map((item, idx) => (
          <li key={idx} className="mb-1">
            <span className="font-medium">{item.document_name}</span>
            <span className="ml-2 text-gray-400">({item.dataset_name})</span>
            <div className="text-gray-400 whitespace-pre-wrap">{item.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssistantCitation;
