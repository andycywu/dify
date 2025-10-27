import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ServiceStatus {
  running: boolean;
  uptime: string;
  requests: number;
  errors: number;
}

interface ProxyConfig {
  port: number;
  wsdlUrl: string;
  timeout: number;
  enableLogging: boolean;
}

const RestToSoapManager: React.FC = () => {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [config, setConfig] = useState<ProxyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchServiceStatus();
    fetchConfig();
    fetchLogs();
  }, []);

  const fetchServiceStatus = async () => {
    try {
      // 檢查 REST-to-SOAP 服務狀態
      const response = await axios.get('/api/proxy/rest-to-soap/status', { timeout: 5000 });
      setStatus(response.data);
    } catch (err: any) {
      console.error('Failed to fetch REST-to-SOAP status:', err);
      setStatus({
        running: false,
        uptime: '0s',
        requests: 0,
        errors: 0
      });
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/proxy/rest-to-soap/config');
      setConfig(response.data);
    } catch (err: any) {
      console.error('Failed to fetch config:', err);
      setConfig({
        port: 3002,
        wsdlUrl: 'https://fwtrack.tpv-tech.com/api/issue.asmx',
        timeout: 30000,
        enableLogging: true
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/proxy/rest-to-soap/logs');
      setLogs(response.data.logs || []);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
      setLogs(['無法獲取日誌']);
    } finally {
      setLoading(false);
    }
  };

  const restartService = async () => {
    try {
      setLoading(true);
      await axios.post('/api/proxy/rest-to-soap/restart');
      await fetchServiceStatus();
      setError(null);
    } catch (err: any) {
      setError('重啟服務失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async () => {
    try {
      setLoading(true);
      await axios.put('/api/proxy/rest-to-soap/config', config);
      await restartService(); // 重啟服務以應用新配置
      setError(null);
    } catch (err: any) {
      setError('更新配置失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/proxy/rest-to-soap/test');
      alert('連接測試成功: ' + JSON.stringify(response.data, null, 2));
    } catch (err: any) {
      alert('連接測試失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return <div className="text-center">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">REST-to-SOAP 代理管理</h2>
        <div className="space-x-2">
          <button
            onClick={restartService}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '處理中...' : '重啟服務'}
          </button>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            測試連接
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 服務狀態 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">服務狀態</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{status?.running ? '運行中' : '已停止'}</div>
            <div className="text-sm text-gray-600">狀態</div>
            <div className={`inline-block w-3 h-3 rounded-full mt-2 ${status?.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{status?.uptime || '0s'}</div>
            <div className="text-sm text-gray-600">運行時間</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{status?.requests || 0}</div>
            <div className="text-sm text-gray-600">請求數</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{status?.errors || 0}</div>
            <div className="text-sm text-gray-600">錯誤數</div>
          </div>
        </div>
      </div>

      {/* 配置管理 */}
      {config && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">配置管理</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">服務端口</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WSDL URL</label>
              <input
                type="text"
                value={config.wsdlUrl}
                onChange={(e) => setConfig({...config, wsdlUrl: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">請求超時 (毫秒)</label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig({...config, timeout: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableLogging}
                  onChange={(e) => setConfig({...config, enableLogging: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">啟用日誌記錄</span>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={updateConfig}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '更新中...' : '更新配置'}
            </button>
          </div>
        </div>
      )}

      {/* 服務日誌 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">服務日誌</h3>
        <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded h-64 overflow-y-auto">
          {logs.length > 0 ? (
            logs.slice(-20).map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          ) : (
            <div className="text-gray-500">暫無日誌</div>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={fetchLogs}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            重新整理日誌
          </button>
        </div>
      </div>

      {/* API 文檔連結 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">API 使用說明</h3>
        <div className="space-y-2 text-sm">
          <div><strong>服務端點：</strong> http://localhost:{config?.port || 3002}</div>
          <div><strong>健康檢查：</strong> GET /health</div>
          <div><strong>SOAP 代理：</strong> POST /soap/:method</div>
          <div><strong>狀態查詢：</strong> GET /status</div>
        </div>
        <div className="mt-4">
          <a
            href={`http://localhost:${config?.port || 3002}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            檢查服務健康狀態
          </a>
        </div>
      </div>
    </div>
  );
};

export default RestToSoapManager;
