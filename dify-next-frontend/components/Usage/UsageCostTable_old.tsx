import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
      <h2 className="text-xl font-semibold mb-4">{t('usage_page.dify_usage_stats')}</h2>
      
      {/* 系統級統計 - 只有 admin 用戶才能看到應用級統計 */}
      {user?.role === 'admin' && appStats && (
        <>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">📊 Application-wide Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm text-gray-600">{t('usage_page.total_messages')}</h4>
              <p className="text-2xl font-bold text-blue-600">{appStats.totalMessages.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm text-gray-600">{t('usage_page.total_tokens')}</h4>
              <p className="text-2xl font-bold text-green-600">{appStats.totalTokens.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm text-gray-600">{t('usage_page.total_cost')}</h4>
              <p className="text-2xl font-bold text-purple-600">${appStats.totalCost.toFixed(4)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="text-sm text-gray-600">{t('usage_page.active_users')}</h4>
              <p className="text-2xl font-bold text-orange-600">{appStats.uniqueUsers}</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">👤 Your Personal Usage</h3>
        </>
      )}

      {/* 個人統計摘要 */}
      {!appStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-600">{t('usage_page.total_messages')}</h4>
            <p className="text-2xl font-bold text-blue-600">{totalStats.totalMessages}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-600">{t('usage_page.total_tokens')}</h4>
            <p className="text-2xl font-bold text-green-600">{totalStats.totalTokens.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-600">{t('usage_page.total_cost')}</h4>
            <p className="text-2xl font-bold text-purple-600">${totalStats.totalCost.toFixed(4)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-600">{t('usage_page.active_users')}</h4>
            <p className="text-2xl font-bold text-orange-600">1</p>
          </div>
        </div>
      )}

      {/* 詳細表格 */}
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">{t('usage_page.table_date')}</th>
            <th className="px-4 py-2 border">{t('usage_page.table_source')}</th>
            <th className="px-4 py-2 border">{t('usage_page.table_messages')}</th>
            <th className="px-4 py-2 border">{t('usage_page.table_tokens')}</th>
            <th className="px-4 py-2 border">{t('usage_page.table_cost')}</th>
            <th className="px-4 py-2 border">{t('usage_page.table_user_id')}</th>
          </tr>
        </thead>
        <tbody>
          {usageData.map((item, idx) => (
            <tr key={item.id || `${item.date}-${idx}`} className="text-center hover:bg-gray-50">
              <td className="border px-4 py-2">{item.date}</td>
              <td className="border px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  item.source === 'api' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {item.source}
                </span>
              </td>
              <td className="border px-4 py-2">{item.messages || 0}</td>
              <td className="border px-4 py-2">{item.usage.toLocaleString()}</td>
              <td className="border px-4 py-2">${item.cost.toFixed(4)}</td>
              <td className="border px-4 py-2 text-xs text-gray-600">
                {item.difyUserId || item.userId || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>{t('usage_page.data_source_note')}</p>
        <p>{t('usage_page.cost_calculation_note')}</p>
      </div>
    </div>
  );
};

export default UsageCostTable;