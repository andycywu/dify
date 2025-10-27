import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface UsageItem {
  id: string;
  date: string;
  usage: number;
  cost: number;
  messages?: number;
  source?: string;
  difyUserId?: string;
}

interface UsageCostTableProps {
  usageData?: UsageItem[];
}

const UsageCostTable: React.FC<UsageCostTableProps> = ({ usageData: propUsageData }) => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation('auth');
  const [usageData, setUsageData] = useState<UsageItem[]>(propUsageData || []);
  const [loading, setLoading] = useState(!propUsageData);
  const [error, setError] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState({
    totalMessages: 0,
    totalTokens: 0,
    totalCost: 0,
    uniqueUsers: 0
  });

  useEffect(() => {
    if (propUsageData) return;
    if (authLoading) return;
    if (!user) return;
    
    const fetchUsageData = async () => {
      try {
        // 使用 email 查詢 Dify 原生統計 API（因為 user.id 是 Wiki.js ID 而不是 Dify UUID）
        const response = await axios.get(`/api/user-token-stats?email=${user.email}`);
        
        // 處理 Dify 原生數據格式
        const formattedData = response.data.dailyUsage.map((d: any, idx: number) => ({
          id: `${d.difyUserId || 'unknown'}-${d.date}`,
          date: d.date,
          usage: d.tokenUsage,
          cost: d.billing,
          messages: d.messages,
          source: d.source,
          difyUserId: d.difyUserId
        }));

        setUsageData(formattedData);

        // 計算總計
        const stats = formattedData.reduce((acc: {
          totalMessages: number;
          totalTokens: number;
          totalCost: number;
          uniqueUsers: number;
        }, item: {
          messages?: number;
          usage: number;
          cost: number;
          difyUserId?: string;
        }) => ({
          totalMessages: acc.totalMessages + (item.messages || 0),
          totalTokens: acc.totalTokens + item.usage,
          totalCost: acc.totalCost + item.cost,
          uniqueUsers: acc.uniqueUsers
        }), { totalMessages: 0, totalTokens: 0, totalCost: 0, uniqueUsers: 0 });

        stats.uniqueUsers = new Set(formattedData.map((d: any) => d.difyUserId)).size;
        setTotalStats(stats);

      } catch (error: any) {
        setError(error.message || 'Failed to fetch usage data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsageData();
  }, [user, propUsageData, authLoading]);

  if (authLoading) return <div>{t('loading')}</div>;
  if (!user) return <div className="text-red-500">{t('profile_page.please_login')}</div>;
  if (loading) return <div>{t('usage_page.loading_stats')}</div>;
  if (error) return <div className="text-red-500">{t('usage_page.error_loading')}: {error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{t('usage_page.dify_usage_stats')}</h2>
      
      {/* 總覽統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">{t('usage_page.total_messages')}</h3>
          <p className="text-2xl font-bold text-blue-600">{totalStats.totalMessages}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">{t('usage_page.total_tokens')}</h3>
          <p className="text-2xl font-bold text-green-600">{totalStats.totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">{t('usage_page.total_cost')}</h3>
          <p className="text-2xl font-bold text-purple-600">${totalStats.totalCost.toFixed(4)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">{t('usage_page.active_users')}</h3>
          <p className="text-2xl font-bold text-orange-600">{totalStats.uniqueUsers}</p>
        </div>
      </div>

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
                {item.difyUserId?.slice(0, 8)}...
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