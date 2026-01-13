import React, { useState } from 'react';
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

export default function BigTableSearch() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<'inhouse' | 'outsourcing' | 'both'>('both');
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

      for (const dataset of datasetsToSearch) {
        const datasetId = DATASETS[dataset as keyof typeof DATASETS];
        if (!datasetId) {
          console.warn(`Dataset ID not configured for: ${dataset}`);
          continue;
        }

        try {
          const response = await retrieveChunks(datasetId, keyword, 50);

          // 將結果加上 dataset 標籤
          const results = response.records.map((record: ChunkRecord) => ({
            content: record.content,
            score: record.score,
            document_name: record.document_name || 'Unknown',
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

  return (
    <MainLayout title="大表檢索系統">
      <div className="w-full max-w-6xl">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  搜尋結果
                </h2>
                <span className="text-sm text-gray-600">
                  共找到 {results.length} 筆資料
                </span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* 標題列 */}
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {result.dataset_name}
                        </span>
                        <span className="text-sm text-gray-600">
                          📄 {result.document_name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        相關度: {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* 內容 */}
                    <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                      {result.content}
                    </div>
                  </div>
                ))}
              </div>
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
                <li>結果按相關度排序</li>
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
