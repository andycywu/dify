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
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      alert(`同步失敗: ${errorMessage}`);
    }
  };

  const handleForceSync = async (department: string) => {
    try {
      const response = await axios.post('/api/admin/sync-department', {
        department,
        action: 'force-sync'
      });
      alert(response.data.message);
      fetchSyncStatus();
    } catch (error) {
      console.error(`Failed to force sync department ${department}:`, error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      alert(`強制同步失敗: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      alert(`清除失敗: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      alert(`清除失敗: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      alert(`同步失敗: ${errorMessage}`);
    }
  };

  const handleAutoSyncSetup = async () => {
    console.log('Setting up auto sync with time:', autoSyncTime);
    const requestData = {
      action: 'setup',
      time: autoSyncTime
    };
    console.log('Sending request data:', requestData);

    // 先測試 API 調用
    try {
      console.log('Testing API call first...');
      const testResponse = await axios.post('/api/admin/test', requestData);
      console.log('Test API response:', testResponse.data);
    } catch (testError: any) {
      console.error('Test API failed:', testError.response?.data);
    }

    // 然後調用真正的 API
    try {
      const response = await axios.post('/api/admin/setup-cron', requestData);
      console.log('Setup response:', response.data);
      alert(response.data.message);
      fetchCronStatus();
    } catch (error: any) {
      console.error('Failed to setup auto sync:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.error || error.message || '未知錯誤';
      alert(`設置失敗: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      alert(`移除失敗: ${errorMessage}`);
    }
  };

  const handleTestAutoSync = async () => {
    if (!confirm('確定要測試自動同步功能嗎？這將同步所有部門。')) return;

    try {
      const response = await axios.post('/api/admin/auto-sync');
      alert(`自動同步測試完成: ${response.data.message}`);
      fetchSyncStatus();
    } catch (error) {
      console.error('Failed to test auto sync:', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      alert(`自動同步測試失敗: ${errorMessage}`);
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      console.log('Fetching logs...');
      const response = await axios.get('/api/admin/sync-log');
      console.log('Logs response:', response.data);
      console.log('Logs array:', response.data.log);
      setLogs(response.data.log || []);
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
      console.error('Error response:', error.response?.data);
      setLogs(['獲取日誌失敗: ' + (error.response?.data?.error || error.message)]);
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus();
    fetchCronStatus();
    fetchLogs(); // 初始載入日誌
    const interval = setInterval(fetchSyncStatus, 5000); // 每 5 秒更新一次同步狀態
    const logInterval = setInterval(fetchLogs, 10000); // 每 10 秒更新一次日誌
    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, [fetchSyncStatus, fetchCronStatus, fetchLogs]);

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
            強制同步所有部門
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
          <button
            onClick={handleTestAutoSync}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            測試自動同步
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-3 h-3 rounded-full ${cronStatus?.hasWikiSyncCron ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium">
              自動同步狀態: {cronStatus?.hasWikiSyncCron ? '已啟用' : '未啟用'}
            </span>
          </div>
          {cronStatus?.cronJobs && cronStatus.cronJobs.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <p>同步時間: {cronStatus.cronJobs[0]}</p>
            </div>
          )}
        </div>
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
                          onClick={() => handleForceSync(department)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          強制同步
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
        <h3 className="text-lg font-semibold mb-4 text-gray-700">同步日誌 (自動刷新)</h3>
        <pre className="whitespace-pre-wrap break-words max-h-96 overflow-y-auto bg-gray-50 p-4 rounded text-sm">
          {logs.length > 0 ? logs.reverse().join('\n') : '載入日誌中...'}
        </pre>
      </div>
    </div>
  );
};

export default WikiImportManager;
