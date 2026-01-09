import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../lib/mockTranslation';

interface UsageItem {
  id: string;
  date: string;
  usage: number;
  cost: number;
  messages?: number;
  source?: string;
  difyUserId?: string;
  userId?: string;
}

interface UsageCostTableProps {
  usageData: UsageItem[];
  appStats?: {
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    uniqueUsers: number;
    avgMessagesPerUser: number;
    avgTokensPerMessage: number;
    avgCostPerMessage: number;
    totalConversations: number;
    avgMessagesPerConversation: number;
    activeUsersLast7Days: number;
    activeUsersLast30Days: number;
  } | null;
}

const UsageCostTable: React.FC<UsageCostTableProps> = ({ usageData: propUsageData, appStats }) => {
  const { user } = useAuth();
  const { t } = useTranslation('auth');
  const [usageData, setUsageData] = useState<UsageItem[]>(propUsageData);
  const [loading, setLoading] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalMessages: 0,
    totalTokens: 0,
    totalCost: 0,
    uniqueUsers: 0
  });

  // 計算總計的輔助函數
  const calculateStats = (data: UsageItem[]) => {
    const stats = data.reduce((acc, item) => ({
      totalMessages: acc.totalMessages + (item.messages || 0),
      totalTokens: acc.totalTokens + item.usage,
      totalCost: acc.totalCost + item.cost,
      uniqueUsers: acc.uniqueUsers
    }), { totalMessages: 0, totalTokens: 0, totalCost: 0, uniqueUsers: 0 });

    stats.uniqueUsers = new Set(data.map(d => d.difyUserId || d.userId)).size;
    return stats;
  };

  useEffect(() => {
    if (propUsageData && propUsageData.length > 0) {
      setUsageData(propUsageData);
      const calculatedStats = calculateStats(propUsageData);
      setTotalStats(calculatedStats);
      setLoading(false);
    }
  }, [propUsageData]);

  if (!user) return <div className="text-red-500">{t('profile_page.please_login')}</div>;
  if (loading) return <div>{t('usage_page.loading_stats')}</div>;

  return (
    <div>
      {/* 個人統計區塊 - 所有用戶都能看到 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">👤</span>
          個人使用統計
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm text-gray-600 mb-1">我的對話數</h4>
            <p className="text-2xl font-bold text-blue-600">{totalStats.totalMessages}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm text-gray-600 mb-1">模型類型</h4>
            <p className="text-lg font-bold text-green-600">Ollama 本地</p>
            <p className="text-xs text-gray-500 mt-1">無 Token 計費</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm text-gray-600 mb-1">總費用</h4>
            <p className="text-2xl font-bold text-purple-600">$0.00</p>
            <p className="text-xs text-gray-500 mt-1">本地模型無計費</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="text-sm text-gray-600 mb-1">平均響應時間</h4>
            <p className="text-2xl font-bold text-orange-600">N/A</p>
            <p className="text-xs text-gray-500 mt-1">未統計</p>
          </div>
        </div>

        {/* 個人使用詳細表格 */}
        <div className="overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">📅 每日對話紀錄（最新 30 天）</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">使用 Ollama 本地模型，無 Token 計費</span>
          </div>
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">日期</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">對話數</th>
              </tr>
            </thead>
            <tbody>
              {usageData.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    暫無使用數據
                  </td>
                </tr>
              ) : (
                usageData
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .filter(item => item.messages && item.messages > 0)
                  .slice(0, 30)
                  .map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{item.date}</td>
                      <td className="px-4 py-2 text-sm font-medium text-blue-600">{item.messages || 0} 則</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 管理員統計區塊 - 只有 admin 用戶才能看到 */}
      {(user?.role === 'admin' || user?.role === 'Administrator') && appStats && (
        <div className="mt-8 pt-8 border-t-4 border-indigo-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            應用級統計 (Admin Only)
          </h2>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200 mb-6">
            <p className="text-sm text-indigo-700 mb-2">
              📅 統計期間：最近 30 天
            </p>
            <p className="text-xs text-indigo-600">
              以下數據僅管理員可見，包含所有用戶的使用情況
            </p>
          </div>

          {/* 核心指標 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-700">📈 核心指標</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-indigo-200 shadow-sm">
                <h4 className="text-xs text-gray-600 mb-1">總對話數</h4>
                <p className="text-3xl font-bold text-indigo-600">{appStats.totalMessages.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total Messages</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-teal-200 shadow-sm">
                <h4 className="text-xs text-gray-600 mb-1">活躍用戶 (30天)</h4>
                <p className="text-3xl font-bold text-teal-600">{appStats.activeUsersLast30Days}</p>
                <p className="text-xs text-gray-500 mt-1">Active Users</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-emerald-200 shadow-sm">
                <h4 className="text-xs text-gray-600 mb-1">總 Token 數</h4>
                <p className="text-3xl font-bold text-emerald-600">{appStats.totalTokens.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total Tokens</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-rose-200 shadow-sm">
                <h4 className="text-xs text-gray-600 mb-1">總費用</h4>
                <p className="text-3xl font-bold text-rose-600">${appStats.totalCost.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Total Cost</p>
              </div>
            </div>
          </div>

          {/* 用戶活躍度 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-700">👥 用戶活躍度</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="text-sm text-gray-600 mb-1">7天活躍用戶</h4>
                <p className="text-2xl font-bold text-amber-600">{appStats.activeUsersLast7Days}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="text-sm text-gray-600 mb-1">30天活躍用戶</h4>
                <p className="text-2xl font-bold text-amber-600">{appStats.activeUsersLast30Days}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="text-sm text-gray-600 mb-1">平均每人對話數</h4>
                <p className="text-2xl font-bold text-amber-600">{appStats.avgMessagesPerUser.toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* 對話質量指標 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-700">💬 對話質量</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <h4 className="text-sm text-gray-600 mb-1">總會話數</h4>
                <p className="text-2xl font-bold text-cyan-600">{appStats.totalConversations.toLocaleString()}</p>
              </div>
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <h4 className="text-sm text-gray-600 mb-1">平均會話互動數</h4>
                <p className="text-2xl font-bold text-cyan-600">{appStats.avgMessagesPerConversation.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">messages/conversation</p>
              </div>
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <h4 className="text-sm text-gray-600 mb-1">平均 Token 數/對話</h4>
                <p className="text-2xl font-bold text-cyan-600">{appStats.avgTokensPerMessage.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">tokens/message</p>
              </div>
            </div>
          </div>

          {/* 成本分析 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-700">💰 成本分析</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
                <h4 className="text-sm text-gray-600 mb-1">平均成本/對話</h4>
                <p className="text-2xl font-bold text-violet-600">${appStats.avgCostPerMessage.toFixed(4)}</p>
              </div>
              <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
                <h4 className="text-sm text-gray-600 mb-1">成本/Token (千)</h4>
                <p className="text-2xl font-bold text-violet-600">
                  ${appStats.totalTokens > 0 ? ((appStats.totalCost / appStats.totalTokens) * 1000).toFixed(4) : '0.0000'}
                </p>
              </div>
              <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
                <h4 className="text-sm text-gray-600 mb-1">平均成本/用戶</h4>
                <p className="text-2xl font-bold text-violet-600">
                  ${appStats.uniqueUsers > 0 ? (appStats.totalCost / appStats.uniqueUsers).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageCostTable;
