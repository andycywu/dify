import React, { useState } from 'react';

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
  maxContentLength?: number; // 新增可選參數
}

const AssistantCitation: React.FC<AssistantCitationProps> = ({ resources, maxContentLength = 120 }) => {
  if (!resources || resources.length === 0) return null;
  return (
    <div className="mt-2 text-xs text-gray-500">
      <div className="font-semibold mb-1">引用來源：</div>
      <ul className="list-disc pl-5">
        {resources.map((item, idx) => (
          <CitationItem key={idx} item={item} maxContentLength={maxContentLength} />
        ))}
      </ul>
    </div>
  );
};

const CitationItem: React.FC<{ item: CitationResource; maxContentLength: number }> = ({ item, maxContentLength }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = item.content.length > maxContentLength;
  return (
    <li className="mb-1">
      <span className="font-medium">{item.document_name}</span>
      <span className="ml-2 text-gray-400">({item.dataset_name})</span>
      <div className="text-gray-400 whitespace-pre-wrap">
        {isLong && !expanded
          ? <>{item.content.slice(0, maxContentLength)}... <button className="text-blue-500 underline" onClick={() => setExpanded(true)}>顯示更多</button></>
          : <>{item.content}{isLong && <button className="text-blue-500 underline ml-2" onClick={() => setExpanded(false)}>收起</button>}</>
        }
      </div>
    </li>
  );
};

export default AssistantCitation;
