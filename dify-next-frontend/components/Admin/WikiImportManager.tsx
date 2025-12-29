import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface ImportJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  totalPages: number;
  processedPages: number;
  errors: string[];
}

interface ImportHistory {
  jobs: ImportJob[];
  totalImports: number;
  successfulImports: number;
  failedImports: number;
}

const WikiImportManager: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [history, setHistory] = useState<ImportHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cronTime, setCronTime] = useState('');
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  const fetchImportHistory = useCallback(async () => {
    try {
      const response = await axios.get('/api/wiki/import/history');
      setHistory(response.data);
    } catch (err: any) {
      console.error('Failed to fetch import history:', err);
      // 設置模擬數據
      setHistory({
        jobs: [],
        totalImports: 0,
        successfulImports: 0,
        failedImports: 0
      });
    }
  }, []);

  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await axios.get(`/api/wiki/import/status/${jobId}`);
      setCurrentJob(response.data);

      if (response.data.status === 'completed' || response.data.status === 'failed') {
        setImporting(false);
        await fetchImportHistory();
      }
    } catch (err: any) {
      console.error('Failed to fetch job status:', err);
    }
  }, [fetchImportHistory]);

  useEffect(() => {
    fetchImportHistory();
  }, [fetchImportHistory]);

  useEffect(() => {
    if (!currentJob || currentJob.status !== 'processing') return;

    // 每5秒檢查一次進度
    const interval = setInterval(() => {
      fetchJobStatus(currentJob.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentJob, fetchJobStatus]);

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/json',
      'text/plain',
      'application/zip',
      'text/markdown'
    ];

    if (!allowedTypes.some(type => file.type === type || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json'))) {
      setError('不支援的檔案類型。請選擇 JSON、TXT、MD 或 ZIP 檔案。');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      setError('檔案大小不能超過 100MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const startImport = async () => {
    if (!selectedFile) {
      setError('請先選擇要導入的檔案');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('options', JSON.stringify({
        createTags: true,
        overwriteExisting: false,
        parentPath: '/imported'
      }));

      const response = await axios.post('/api/wiki/import/start', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCurrentJob(response.data.job);
      setSelectedFile(null);
    } catch (err: any) {
      setError('導入失敗: ' + (err.response?.data?.error || err.message));
      setImporting(false);
    }
  };

  const cancelImport = async () => {
    if (!currentJob) return;

    try {
      await axios.post(`/api/wiki/import/cancel/${currentJob.id}`);
      setCurrentJob(null);
      setImporting(false);
    } catch (err: any) {
      setError('取消導入失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      await axios.delete(`/api/wiki/import/job/${jobId}`);
      await fetchImportHistory();
    } catch (err: any) {
      setError('刪除任務失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const triggerManualSync = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/admin/sync-wiki');
      setCronMessage(response.data.message);
    } catch (err: any) {
      setError('手動同步失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const setupCronSync = async () => {
    if (!cronTime) {
      setError('請提供有效的 cron 時間格式');
      return;
    }

    try {
      setError(null);
      const response = await axios.post('/api/admin/setup-cron', { cron_time: cronTime });
      setCronMessage(response.data.message);
    } catch (err: any) {
      setError('設置自動同步失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待中';
      case 'processing': return '處理中';
      case 'completed': return '已完成';
      case 'failed': return '失敗';
      default: return '未知';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Wiki 批次導入管理</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 導入統計 */}
      {history && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">導入統計</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{history.totalImports}</div>
              <div className="text-sm text-gray-600">總導入次數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{history.successfulImports}</div>
              <div className="text-sm text-gray-600">成功導入</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{history.failedImports}</div>
              <div className="text-sm text-gray-600">導入失敗</div>
            </div>
          </div>
        </div>
      )}

      {/* 檔案上傳區域 */}
      {!importing && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">新增導入任務</h3>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                </svg>
              </div>

              <div>
                <p className="text-lg text-gray-600">
                  拖放檔案至此處，或
                  <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                    點擊選擇檔案
                    <input
                      type="file"
                      className="hidden"
                      accept=".json,.txt,.md,.zip"
                      onChange={handleFileInput}
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  支援格式：JSON、TXT、Markdown、ZIP（最大 100MB）
                </p>
              </div>

              {selectedFile && (
                <div className="bg-gray-50 border rounded p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      移除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={startImport}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                開始導入
              </button>
            </div>
          )}
        </div>
      )}

      {/* 當前導入進度 */}
      {currentJob && importing && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">導入進度</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{currentJob.filename}</span>
              <span className={`font-medium ${getStatusColor(currentJob.status)}`}>
                {getStatusText(currentJob.status)}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentJob.progress}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>{currentJob.processedPages} / {currentJob.totalPages} 頁面</span>
              <span>{currentJob.progress.toFixed(1)}%</span>
            </div>

            {currentJob.status === 'processing' && (
              <div className="flex justify-end">
                <button
                  onClick={cancelImport}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  取消導入
                </button>
              </div>
            )}

            {currentJob.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h4 className="font-medium text-red-800 mb-2">錯誤信息:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {currentJob.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 導入歷史 */}
      {history && history.jobs.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">導入歷史</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">檔案名稱</th>
                  <th className="text-left p-3">狀態</th>
                  <th className="text-left p-3">進度</th>
                  <th className="text-left p-3">開始時間</th>
                  <th className="text-left p-3">結束時間</th>
                  <th className="text-left p-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.jobs.slice(0, 10).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{job.filename}</td>
                    <td className={`p-3 ${getStatusColor(job.status)}`}>
                      {getStatusText(job.status)}
                    </td>
                    <td className="p-3">
                      {job.processedPages} / {job.totalPages} ({job.progress.toFixed(1)}%)
                    </td>
                    <td className="p-3">{new Date(job.startTime).toLocaleString()}</td>
                    <td className="p-3">
                      {job.endTime ? new Date(job.endTime).toLocaleString() : '-'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 手動同步 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">手動同步</h3>
        <button
          onClick={triggerManualSync}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          立即同步
        </button>
        {cronMessage && (
          <p className="mt-2 text-green-700">{cronMessage}</p>
        )}
      </div>

      {/* 自動同步設置 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">自動同步設置</h3>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={cronTime}
            onChange={(e) => setCronTime(e.target.value)}
            placeholder="例如: 0 2 * * *"
            className="border rounded px-4 py-2 w-full"
          />
          <button
            onClick={setupCronSync}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            設置
          </button>
        </div>
        {cronMessage && (
          <p className="mt-2 text-green-700">{cronMessage}</p>
        )}
      </div>
    </div>
  );
};

export default WikiImportManager;
