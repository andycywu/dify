import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { retrieveChunks } from '../services/knowledgeAdmin';

interface SearchResult {
  content: string;
  score: number;
  document_name: string;
  dataset_name: string;
}

interface ChunkRecord {
  content: string;
  score: number;
  document_name: string;
  document_id: string;
  [key: string]: any;
}

// 優先欄位清單
const PRIORITY_FIELDS = [
  'Project Number', 'Model Name', 'Supplier', 'KO Date', 'MP Date',
  'EIT Plan Start Date', 'EIT Plan End Date',
  '專案編號', '機種名稱', '供應商', 'KO日期', 'MP日期', 'EIT開始日期', 'EIT結束日期',
];

// 提取 summary line 欄位
function extractSummaryFields(content: string): { [key: string]: string } {
  // 嘗試 JSON（並以不區分大小寫/空白的方式比對欄位）
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null) {
      const summary: { [key: string]: string } = {};
      const normalizedMap: { [lower: string]: string } = {};
      for (const k of Object.keys(parsed)) {
        normalizedMap[k.trim().toLowerCase().replace(/\s+/g, ' ')] = String((parsed as any)[k]);
      }
      for (const key of PRIORITY_FIELDS) {
        const nk = key.trim().toLowerCase().replace(/\s+/g, ' ');
        if (normalizedMap[nk]) summary[key] = normalizedMap[nk];
      }
      return summary;
    }
  } catch {}
  // 嘗試 key:value 解析
  const tryExtract = (sep: string) => {
    const fields: { [key: string]: string } = {};
    const parts = content.split(sep).map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      let k = '', v = '';
      if (part.includes(':')) [k, v] = part.split(/:(.+)/).map(s => s.trim());
      else if (part.includes('=')) [k, v] = part.split(/=(.+)/).map(s => s.trim());
      if (k && v && PRIORITY_FIELDS.includes(k)) fields[k] = v;
    }
    return fields;
  };
  // 分號、逗號、換行
  let summary = tryExtract(';');
  if (Object.keys(summary).length === 0) summary = tryExtract(',');
  if (Object.keys(summary).length === 0) summary = tryExtract('\n');
  return summary;
}

// 解析內容函數：將結構化資料轉換為可讀格式
const parseContent = (content: string, full = false): React.ReactElement => {
  // 檢查內容是否有效
  if (!content || typeof content !== 'string') {
    return (
      <div className="text-gray-500 italic">
        無內容
      </div>
    );
  }

  // 嘗試解析為 JSON
  try {
    const parsed = JSON.parse(content);
    return (
      <div className="space-y-2">
        {Object.entries(parsed).map(([key, value], idx) => (
          <div key={idx} className="flex border-b border-gray-200 pb-2 last:border-b-0">
            <span className="font-semibold text-gray-700 min-w-[200px]">{key}:</span>
            <span className="text-gray-600 flex-1">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  } catch (e) {
    // 如果不是 JSON，先處理以分號分隔或逗號分隔的 key:value 對
    const normalizeKey = (k: string) => k.replace(/^\s*\d+\.?\s*/, '').trim();

    const tryParseKeyValueList = (items: string[]) => {
      const pairs: [string, string][] = [];
      for (const item of items) {
        const part = item.trim();
        if (!part) continue;
        if (part.includes(':')) {
          const [k, ...v] = part.split(':');
          pairs.push([normalizeKey(k), v.join(':').trim()]);
        } else if (part.includes('=')) {
          const [k, ...v] = part.split('=');
          pairs.push([normalizeKey(k), v.join('=').trim()]);
        } else {
          pairs.push([normalizeKey(part), '']);
        }
      }
      return pairs;
    };

    // 處理以分號分隔的情況（Outsourcing 與 InHouse 的大表常見）
    if (content.includes(';')) {
      const parts = content.split(';').map(s => s.trim()).filter(Boolean);
      const pairs = tryParseKeyValueList(parts);
      // 若有至少一個 pair 有值，視為 key:value 列表
      if (pairs.length > 0 && pairs.some(p => p[1] !== '')) {
        return (
          <div className="space-y-2">
            {pairs.map(([key, value], idx) => (
              <div key={idx} className="flex border-b border-gray-200 pb-2 last:border-b-0">
                <span className="font-semibold text-gray-700 min-w-[200px]">{key}:</span>
                <span className="text-gray-600 flex-1">{value}</span>
              </div>
            ))}
          </div>
        );
      }
      // 否則退回為普通表格顯示
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {parts.map((field, idx) => (
                  <td key={idx} className="px-3 py-2 text-sm text-gray-700 border border-gray-200">
                    {field}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // 處理以逗號分隔但可能為 key:value 列表的情況
    if (content.includes(',') && content.split(',').length > 3) {
      const fields = content.split(',').map(f => f.trim()).filter(Boolean);
      const pairs = tryParseKeyValueList(fields);
      if (pairs.length > 0 && pairs.some(p => p[1] !== '')) {
        return (
          <div className="space-y-2">
            {pairs.map(([key, value], idx) => (
              <div key={idx} className="flex border-b border-gray-200 pb-2 last:border-b-0">
                <span className="font-semibold text-gray-700 min-w-[200px]">{key}:</span>
                <span className="text-gray-600 flex-1">{value}</span>
              </div>
            ))}
          </div>
        );
      }
      // 否則表格顯示
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {fields.map((field, idx) => (
                  <td key={idx} className="px-3 py-2 text-sm text-gray-700 border border-gray-200">
                    {field}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // 嘗試將多行文字格式化
    if (content.includes('\n')) {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        return (
          <div className="space-y-1">
            {lines.map((line, idx) => {
              // 檢查是否是 key: value 格式
              if (line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                return (
                  <div key={idx} className="flex border-b border-gray-200 pb-1 last:border-b-0">
                    <span className="font-semibold text-gray-700 min-w-[200px]">{normalizeKey(key)}:</span>
                    <span className="text-gray-600 flex-1">{value}</span>
                  </div>
                );
              }
              return <div key={idx} className="text-gray-700">{line}</div>;
            })}
          </div>
        );
      }
    }

    // 如果都不是，顯示原始內容（縮短長度，除非要求 full）
    if (full) {
      return (
        <div className="text-gray-700 whitespace-pre-wrap">
          {content}
        </div>
      );
    }
    const maxLength = 500;
    const displayContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    return (
      <div className="text-gray-700 whitespace-pre-wrap">
        {displayContent}
      </div>
    );
  }
};

export default function BigTableSearch() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<'inhouse' | 'outsourcing' | 'both'>('both');
  const [topN, setTopN] = useState<5 | 10>(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 從環境變數或配置讀取 Dataset IDs
  const DATASETS = {
    inhouse: process.env.NEXT_PUBLIC_KB_INHOUSE_ID || '',
    outsourcing: process.env.NEXT_PUBLIC_KB_OUTSOURCING_ID || '',
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('請輸入搜尋關鍵字');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allResults: SearchResult[] = [];

      // 根據選擇的 Dataset 進行檢索
      const datasetsToSearch = selectedDataset === 'both'
        ? ['inhouse', 'outsourcing']
        : [selectedDataset];

      // helper: 嘗試從 record 裡取得可讀的 document name
      const getDocumentName = (record: ChunkRecord, dataset: string) => {
        if (record.document_name) return record.document_name;
        if (record.segment && record.segment.document_name) return record.segment.document_name;
        if (record.metadata && (record.metadata.title || record.metadata.name)) return record.metadata.title || record.metadata.name;
        if (record.document_id) return String(record.document_id);
        // 嘗試從 content 中抽取 Project Number 或第一行作為替代名稱
        try {
          const content = record.content || (record.segment && record.segment.content) || record.text || '';
          const m = content.match(/Project\s*Number[:=]\s*([A-Z0-9\-]+)/i) || content.match(/專案編號[:=]\s*([A-Z0-9\-]+)/i);
          if (m && m[1]) return m[1];
          const firstLine = (content || '').split(/\r?\n/).find((l: string) => Boolean(l && l.trim()));
          if (firstLine && firstLine.length < 120) return firstLine.trim().slice(0, 120);
        } catch {}
        return 'Unknown';
      };

      for (const dataset of datasetsToSearch) {
        const datasetId = DATASETS[dataset as keyof typeof DATASETS];
        if (!datasetId) {
          console.warn(`Dataset ID not configured for: ${dataset}`);
          continue;
        }

        try {
          const response = await retrieveChunks(datasetId, keyword, 50);

          // 將結果加上 dataset 標籤，優先使用 record.content，其次 segment.content，再其次 text
          const results = response.records.map((record: ChunkRecord) => ({
            content: record.content || (record.segment && record.segment.content) || record.text || '',
            score: record.score,
            document_name: getDocumentName(record, dataset),
            dataset_name: dataset === 'inhouse' ? 'Project KB (InHouse)' : 'Project KB (Outsourcing)',
          }));

          allResults.push(...results);
        } catch (err) {
          console.error(`Failed to search ${dataset}:`, err);
        }
      }

      // 按相關度排序
      allResults.sort((a, b) => b.score - a.score);
      setResults(allResults);

      if (allResults.length === 0) {
        setError('找不到相關資料，請嘗試使用不同的關鍵字');
      }

    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || '搜尋失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = results.map(r =>
      `"${r.dataset_name}","${r.document_name}","${r.content.replace(/"/g, '""')}","${r.score}"`
    ).join('\n');

    const header = 'Dataset,Document,Content,Score\n';
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Modal 狀態
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  // 展開狀態：使用 index 作為 key
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleExpanded = (idx: number) => {
    console.log('toggleExpanded called for', idx);
    setExpandedIndices(prev => {
      const found = prev.includes(idx);
      const next = found ? prev.filter(i => i !== idx) : [...prev, idx];
      console.log('expandedIndices =>', next);
      return next;
    });
  };

  return (
    <MainLayout title="大表檢索系統">
      <div className="w-full max-w-6xl">
        {/* Debug badge: shows expanded indices for quick visual verification */}
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-xs text-gray-800 px-3 py-1 rounded shadow z-50">
          展開: {expandedIndices.length} {expandedIndices.length ? `(${expandedIndices.join(',')})` : ''}
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 標題 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🔍 大表檢索系統
            </h1>
            <p className="text-gray-600">
              在 Knowledge Base 中搜尋專案資料
            </p>
          </div>

          {/* 搜尋區域 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* 關鍵字輸入 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜尋關鍵字
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
                  placeholder="輸入關鍵字，如：專案名稱、負責人、技術名稱..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Dataset 選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜尋範圍
                </label>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="both">全部 (InHouse + Outsourcing)</option>
                  <option value="inhouse">InHouse 專案</option>
                  <option value="outsourcing">Outsourcing 專案</option>
                </select>
              </div>

              {/* Top N 選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  顯示數量
                </label>
                <select
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value) as 5 | 10)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                </select>
              </div>
            </div>

            {/* 搜尋按鈕 */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading || !keyword.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? '搜尋中...' : '🔍 開始搜尋'}
              </button>

              {results.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  📥 匯出結果 (CSV)
                </button>
              )}
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              ⚠️ {error}
            </div>
          )}

          {/* 搜尋結果 */}
          {results.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  搜尋結果 (顯示前 {topN} 筆)
                </h2>
                <span className="text-sm text-gray-600">
                  共找到 {results.length} 筆資料 | 顯示 Top {topN}
                </span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {results.slice(0, topN).map((result, index) => {
                  // 提取 summary 欄位
                  const summaryFields = extractSummaryFields(result.content);
                  return (
                    <div
                      key={`${result.document_name || 'doc'}-${index}`}
                      aria-expanded={expandedIndices.includes(index)}
                      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative ${expandedIndices.includes(index) ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}
                    >
                      {/* 排名標籤 */}
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>

                      {/* 標題列 */}
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2 pl-10">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {result.dataset_name}
                          </span>
                          <span className="text-sm text-gray-600">
                            📄 {result.document_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">相關度</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                            {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* summary line */}
                      {Object.keys(summaryFields).length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-x-6 gap-y-1 pl-10">
                          {PRIORITY_FIELDS.filter(f => summaryFields[f]).map(f => (
                            <span key={f} className="inline-block text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 font-semibold">
                              {f}: {summaryFields[f]}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 內容 + 展開/收合 + 查看原始 */}
                      <div className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-200 text-sm relative">
                        {expandedIndices.includes(index) ? (
                          <div>
                            {parseContent(result.content, true)}
                            <div className="mt-3 bg-white border border-gray-100 p-3 rounded">
                              <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-[40vh] overflow-y-auto">{result.content}</pre>
                            </div>
                          </div>
                        ) : (
                          parseContent(result.content)
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            data-index={index}
                            aria-expanded={expandedIndices.includes(index)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 border border-gray-300 cursor-pointer"
                            onClick={() => toggleExpanded(index)}
                          >
                            {expandedIndices.includes(index) ? '收合' : '展開'}
                          </button>
                          <button
                            data-index={index}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 border border-gray-300 cursor-pointer"
                            onClick={() => {
                              console.log('open modal for', index);
                              setModalContent(result.content);
                              setModalOpen(true);
                            }}
                          >
                            查看原始
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Modal for 原始內容 */}
              <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                  <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
                  <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto p-6 z-10">
                    <Dialog.Title className="text-lg font-bold mb-2">原始內容</Dialog.Title>
                    <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 max-h-[60vh] overflow-y-auto text-sm">
                      {modalContent}
                    </pre>
                    <div className="mt-4 flex justify-end">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => setModalOpen(false)}
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog>
            </div>
          )}

          {/* 空狀態 */}
          {!loading && !error && results.length === 0 && keyword && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                找不到相關資料
              </h3>
              <p className="text-gray-600">
                請嘗試使用不同的關鍵字或調整搜尋範圍
              </p>
            </div>
          )}

          {/* 初始狀態提示 */}
          {!keyword && !loading && results.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💡 使用說明
              </h3>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li>輸入關鍵字進行全文搜尋</li>
                <li>支援模糊匹配和語義搜尋</li>
                <li>可選擇特定 Dataset 或搜尋全部</li>
                <li>選擇顯示 Top 5 或 Top 10 結果</li>
                <li>結果按相關度自動排序</li>
                <li>資料以結構化格式清晰呈現</li>
                <li>可匯出搜尋結果為 CSV 檔案</li>
              </ul>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚙️ 設定說明：</strong>請確保已在 .env 檔案中設定 Dataset IDs：
                </p>
                <code className="block mt-2 text-xs bg-white p-2 rounded border border-yellow-300">
                  NEXT_PUBLIC_KB_INHOUSE_ID=your_dataset_id<br/>
                  NEXT_PUBLIC_KB_OUTSOURCING_ID=your_dataset_id
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
