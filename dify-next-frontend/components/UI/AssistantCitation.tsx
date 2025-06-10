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
  // 過濾掉沒有 dataset_name 或 document_name 的 citation
  const filtered = Array.isArray(resources)
    ? resources.filter(r => r.dataset_name && r.document_name)
    : [];
  const [expanded, setExpanded] = useState(false);
  if (!filtered || filtered.length === 0) return null;
  return (
    <div className="mt-2 text-xs text-gray-500">
      <div className="font-semibold mb-1 cursor-pointer select-none" onClick={() => setExpanded(e => !e)}>
        引用來源：
        <span className="ml-1 text-blue-500 underline">{expanded ? '收合' : '展開'}</span>
      </div>
      {expanded && (
        <ul className="pl-6 list-disc">
          {filtered.map((res, idx) => (
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
