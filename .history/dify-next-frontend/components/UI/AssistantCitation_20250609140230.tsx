import React, { useState } from 'react';

export interface CitationResource {
  dataset_name: string;
  document_name: string;
  content?: string;
  // ... 其他欄位 ...
}

interface AssistantCitationProps {
  resources: CitationResource[];
}

const AssistantCitation: React.FC<AssistantCitationProps> = ({ resources }) => {
  const [expanded, setExpanded] = useState(false);
  if (!resources || resources.length === 0) return null;
  return (
    <div className="mt-2 text-xs text-gray-500">
      <div className="font-semibold mb-1 cursor-pointer select-none" onClick={() => setExpanded(e => !e)}>
        引用來源：
        <span className="ml-1 text-blue-500 underline">{expanded ? '收合' : '展開'}</span>
      </div>
      {expanded && (
        <ul className="pl-6 list-disc">
          {resources.map((res, idx) => (
            <li key={idx} className="ml-2 mb-2">
              <div><span className="font-semibold">{res.dataset_name}</span> / <span>{res.document_name}</span></div>
              {res.content && (
                <div className="bg-gray-50 border rounded p-2 mt-1 whitespace-pre-wrap text-gray-700 text-xs">{res.content}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssistantCitation;
