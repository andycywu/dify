import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// 定義部門同步狀態的型別
interface DepartmentSyncStatus {
  totalPages: number;
  syncedPages: number;
  status: string;
  lastSyncTime: string;
}

const WikiImportManager: React.FC = () => {
  const [departments, setDepartments] = useState<[string, DepartmentSyncStatus][]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [cronStatus, setCronStatus] = useState<{ hasWikiSyncCron: boolean; cronJobs: string[] } | null>(null);
  const [autoSyncTime, setAutoSyncTime] = useState('02:00');

  const fetchSyncStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/sync-status');
      setDepartments(Object.entries(response.data) as [string, DepartmentSyncStatus][]);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCronStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/setup-cron');
      setCronStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch cron status:', error);
    }
  }, []);

  const handleManualSync = async (department: string) => {
    try {
      const response = await axios.post('/api/admin/sync-department', {
        department,
        action: 'sync'
      });
      alert(response.data.message);
      fetchSyncStatus();
    } catch (error) {
      console.error(`Failed to sync department ${department}:`, error);
      alert(`同步失敗: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleClearSync = async (department: string) => {
    if (!confirm(`確定要清除 ${department} 的同步狀態嗎？`)) return;

    try {
      const response = await axios.post('/api/admin/sync-department', {
        department,
        action: 'clear-sync'
      });
      alert(response.data.message);
      fetchSyncStatus();
    } catch (error) {
      console.error(`Failed to clear sync status for ${department}:`, error);
      alert(`清除失敗: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleClearDataset = async (department: string) => {
    if (!confirm(`確定要清除 ${department} 的同步狀態和 Dataset 記錄嗎？此操作無法恢復！`)) return;

    try {
      const response = await axios.post('/api/admin/sync-department', {
        department,
        action: 'clear-dataset'
      });
      alert(response.data.message);
      fetchSyncStatus();
    } catch (error) {
      console.error(`Failed to clear dataset for ${department}:`, error);
      alert(`清除失敗: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSyncAll = async () => {
    try {
      const response = await axios.post('/api/admin/sync-department', {
        department: 'all',
        action: 'clear-all'
      });
      alert(response.data.message);
      fetchSyncStatus();
    } catch (error) {
      console.error('Failed to sync all departments:', error);
      alert(`同步失敗: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAutoSyncSetup = async () => {
    try {
      const response = await axios.post('/api/admin/setup-cron', {
        action: 'setup',
        time: autoSyncTime
      });
      alert(response.data.message);
      fetchCronStatus();
    } catch (error) {
      console.error('Failed to setup auto sync:', error);
      alert(`設置失敗: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleRemoveCron = async () => {
    if (!confirm('確定要移除自動同步的 Cron Job 嗎？')) return;

    try {
      const response = await axios.post('/api/admin/setup-cron', {
        action: 'remove'
      });
      alert(response.data.message);
      fetchCronStatus();
    } catch (error) {
      console.error('Failed to remove cron job:', error);
      alert(`移除失敗: ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/admin/sync-log');
      setLogs(response.data.log);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    fetchCronStatus();
    const interval = setInterval(fetchSyncStatus, 5000); // 每 5 秒更新一次同步狀態
    return () => clearInterval(interval);
  }, [fetchSyncStatus, fetchCronStatus]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Wiki 批次導入管理</h2>
      </div>

      {/* 全域操作 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">全域操作</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSyncAll}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            同步所有部門
          </button>
          <button
            onClick={() => handleClearSync('all')}
            className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700"
          >
            清除所有同步狀態
          </button>
          <button
            onClick={() => handleClearDataset('all')}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            清除所有同步狀態和 Dataset
          </button>
        </div>
      </div>

      {/* 自動同步設置 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">自動同步設置</h3>
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center space-x-2">
            <span>同步時間：</span>
            <input
              type="time"
              value={autoSyncTime}
              onChange={(e) => setAutoSyncTime(e.target.value)}
              className="border rounded px-4 py-2"
            />
          </label>
          <button
            onClick={handleAutoSyncSetup}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            設置自動同步
          </button>
          <button
            onClick={handleRemoveCron}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            移除自動同步
          </button>
        </div>
        {cronStatus && (
          <div className="text-sm text-gray-600">
            <p>當前狀態: {cronStatus.hasWikiSyncCron ? '已設置自動同步' : '未設置自動同步'}</p>
            {cronStatus.cronJobs.length > 0 && (
              <div className="mt-2">
                <p>現有 Cron Jobs:</p>
                <ul className="list-disc list-inside">
                  {cronStatus.cronJobs.map((job, index) => (
                    <li key={index} className="font-mono text-xs">{job}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 部門同步管理 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">部門同步管理</h3>

        {loading ? (
          <p>載入中...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">部門</th>
                  <th className="text-left p-3">總頁數</th>
                  <th className="text-left p-3">已同步頁數</th>
                  <th className="text-left p-3">狀態</th>
                  <th className="text-left p-3">最後同步時間</th>
                  <th className="text-left p-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {departments.map(([department, data]) => (
                  <tr key={department} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{department}</td>
                    <td className="p-3">{data.totalPages}</td>
                    <td className="p-3">{data.syncedPages}</td>
                    <td className="p-3">{data.status}</td>
                    <td className="p-3">{data.lastSyncTime}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleManualSync(department)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          同步
                        </button>
                        <button
                          onClick={() => handleClearSync(department)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
                        >
                          清除同步
                        </button>
                        <button
                          onClick={() => handleClearDataset(department)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          清除 Dataset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 同步日誌 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">同步日誌</h3>
        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mb-4"
        >
          取得日誌
        </button>
        <pre className="whitespace-pre-wrap break-words max-h-96 overflow-y-auto bg-gray-50 p-4 rounded text-sm">
          {logs.length > 0 ? logs.join('\n') : '尚未載入日誌'}
        </pre>
      </div>
    </div>
  );
};

export default WikiImportManager;
