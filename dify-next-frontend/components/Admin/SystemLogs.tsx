import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  image: string;
}

export default function SystemLogs() {
  const { t } = useTranslation(['admin']);
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lineCount, setLineCount] = useState<number>(100);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 獲取容器列表
  const fetchContainers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/docker-logs?action=list');
      if (!response.ok) throw new Error('Failed to fetch containers');
      const data = await response.json();
      setContainers(data.containers || []);

      // 如果還沒選擇容器，自動選擇第一個
      if (!selectedContainer && data.containers.length > 0) {
        setSelectedContainer(data.containers[0].name);
      }
    } catch (err: any) {
      console.error('Error fetching containers:', err);
      setError(err.message);
    }
  }, [selectedContainer]);

  // 獲取日誌
  const fetchLogs = useCallback(async (containerName?: string) => {
    const targetContainer = containerName || selectedContainer;
    if (!targetContainer) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/docker-logs?action=logs&container=${encodeURIComponent(targetContainer)}&lines=${lineCount}`
      );
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs || '');

      // 自動滾動到底部
      setTimeout(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message);
      setLogs('');
    } finally {
      setLoading(false);
    }
  }, [selectedContainer, lineCount]);

  // 初始化
  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  // 當選擇容器改變時獲取日誌
  useEffect(() => {
    if (selectedContainer) {
      fetchLogs();
    }
  }, [selectedContainer, lineCount, fetchLogs]);

  // 自動刷新
  useEffect(() => {
    if (autoRefresh && selectedContainer) {
      intervalRef.current = setInterval(() => {
        fetchLogs();
      }, 3000); // 每3秒刷新
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, selectedContainer, lineCount, fetchLogs]);

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('up')) {
      return 'text-green-600 bg-green-100';
    } else if (status.toLowerCase().includes('exited')) {
      return 'text-red-600 bg-red-100';
    } else {
      return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🐳 {t('admin:system_logs.title')}
        </h2>
        <p className="text-gray-600 mb-6">
          選擇容器查看即時日誌
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* 容器選擇器 */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇容器
              </label>
              <select
                value={selectedContainer}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedContainer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- 選擇容器 --</option>
                {containers.map((container: ContainerInfo) => (
                  <option key={container.id} value={container.name}>
                    {container.name} ({container.image})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                行數
              </label>
              <select
                value={lineCount}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLineCount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          </div>

          {/* 控制按鈕 */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => fetchLogs()}
              disabled={!selectedContainer || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '載入中...' : '🔄 刷新日誌'}
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              disabled={!selectedContainer}
              className={`px-4 py-2 rounded-md transition-colors ${
                autoRefresh
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {autoRefresh ? '⏸️ 停止自動刷新' : '▶️ 自動刷新'}
            </button>

            <button
              onClick={fetchContainers}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              🔄 更新容器列表
            </button>
          </div>
        </div>

        {/* 容器狀態顯示 */}
        {selectedContainer && (
          <div className="mb-4">
            {containers
              .filter((c) => c.name === selectedContainer)
              .map((container) => (
                <div
                  key={container.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">容器名稱</span>
                      <p className="font-mono text-sm font-semibold">
                        {container.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">映像</span>
                      <p className="font-mono text-sm">{container.image}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">狀態</span>
                      <p
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          container.status
                        )}`}
                      >
                        {container.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 日誌顯示區域 */}
        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
          {loading && !logs ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-2">載入日誌中...</p>
            </div>
          ) : logs ? (
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
              {logs}
              <div ref={logsEndRef} />
            </pre>
          ) : (
            <p className="text-gray-400 text-center py-8">
              {selectedContainer
                ? '請點擊「刷新日誌」查看容器日誌'
                : '請先選擇一個容器'}
            </p>
          )}
        </div>

        {logs && (
          <div className="mt-4 text-sm text-gray-600">
            <p>
              顯示最近 {lineCount} 行日誌
              {autoRefresh && ' • 自動刷新中 (每3秒)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
