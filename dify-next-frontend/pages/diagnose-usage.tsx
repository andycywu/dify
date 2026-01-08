import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';

interface DiagnosticCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface DiagnosticResult {
  timestamp: string;
  checks: DiagnosticCheck[];
}

const StatusBadge: React.FC<{ status: 'success' | 'warning' | 'error' }> = ({ status }) => {
  const colors = {
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✗',
  };

  return (
    <span className={`px-2 py-1 rounded border text-sm font-semibold ${colors[status]}`}>
      {icons[status]} {status.toUpperCase()}
    </span>
  );
};

export default function DiagnoseUsage() {
  const { user } = useAuth();
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/diagnose-usage');

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        setDiagnosticResult(data);
      } catch (err: any) {
        setError(err.message || 'Failed to run diagnostics');
      } finally {
        setLoading(false);
      }
    };

    runDiagnostics();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <MainLayout title="Usage Diagnostics">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-700">只有管理員可以訪問此診斷頁面。</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Usage Statistics Diagnostics">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 使用統計系統診斷
            </h1>
            <p className="text-gray-600">
              診斷 usage 頁面的 API 和資料庫連接狀況
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">正在執行診斷...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">診斷執行失敗</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {diagnosticResult && (
            <>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  執行時間: {new Date(diagnosticResult.timestamp).toLocaleString('zh-TW')}
                </p>
              </div>

              <div className="space-y-4">
                {diagnosticResult.checks.map((check, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-6 ${
                      check.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : check.status === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{check.name}</h3>
                      <StatusBadge status={check.status} />
                    </div>

                    <p className="text-gray-700 mb-3">{check.message}</p>

                    {check.details && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                          查看詳細資訊 ▼
                        </summary>
                        <pre className="mt-2 p-4 bg-white rounded border border-gray-300 overflow-x-auto text-xs">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 診斷結果摘要</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {diagnosticResult.checks.filter(c => c.status === 'success').length}
                    </div>
                    <div className="text-sm text-gray-600">成功</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {diagnosticResult.checks.filter(c => c.status === 'warning').length}
                    </div>
                    <div className="text-sm text-gray-600">警告</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {diagnosticResult.checks.filter(c => c.status === 'error').length}
                    </div>
                    <div className="text-sm text-gray-600">錯誤</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 建議修復步驟</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {diagnosticResult.checks.some(c => c.status === 'error' && c.name.includes('Connection')) && (
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>檢查資料庫連接配置（POSTGRES_HOST, POSTGRES_PASSWORD）</span>
                    </li>
                  )}
                  {diagnosticResult.checks.some(c => c.status === 'warning' && c.message.includes('empty')) && (
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>資料表為空 - 請先使用聊天功能產生一些對話記錄</span>
                    </li>
                  )}
                  {diagnosticResult.checks.some(c => c.status === 'warning' && c.name === 'User Mapping') && (
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>部分用戶缺少 Dify end_user 映射 - 請確認用戶已使用聊天功能</span>
                    </li>
                  )}
                  {diagnosticResult.checks.some(c => c.status === 'error' && c.name === 'Messages Table Schema') && (
                    <li className="flex items-start">
                      <span className="mr-2">4.</span>
                      <span>messages 表結構不完整 - 可能需要更新 Dify 版本或資料庫遷移</span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>如果問題持續，請查看 dify-next-frontend 容器日誌</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                >
                  🔄 重新執行診斷
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
