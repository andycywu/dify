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

  const handleManualSync = async (department: string) => {
    try {
      const response = await axios.post('/api/admin/sync-department', { department });
      alert(response.data.message);
      fetchSyncStatus();
    } catch (error) {
      console.error(`Failed to sync department ${department}:`, error);
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
    const interval = setInterval(fetchSyncStatus, 5000); // 每 5 秒更新一次同步狀態
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Wiki 批次導入管理</h2>
      </div>

      {/* 手動同步 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">手動同步</h3>
        <button
          onClick={() => handleManualSync('all')}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          立即同步
        </button>
      </div>

      {/* 部門同步管理 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">部門同步管理</h3>

        <div className="flex items-center space-x-4 mb-4">
          <input
            type="time"
            // value={autoSyncTime}
            // onChange={(e) => setAutoSyncTime(e.target.value)}
            className="border rounded px-4 py-2"
          />
          <button
            // onClick={handleAutoSyncSetup}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            設置自動同步時間
          </button>
        </div>

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
                      <button
                        onClick={() => handleManualSync(department)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        手動同步
                      </button>
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
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          取得日誌
        </button>
        <pre className="whitespace-pre-wrap break-words mt-4">
          {logs.join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default WikiImportManager;
