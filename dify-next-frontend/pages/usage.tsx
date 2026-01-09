import React, { useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import UsageCostTable from '../components/Usage/UsageCostTable';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../lib/mockTranslation';
import axios from 'axios';

function sumByDate(usageData: any, type = 'day') {
  if (!usageData || usageData.length === 0) return [];
  const grouped: Record<string, { usage: number; cost: number }> = {};
  usageData.forEach((item: any) => {
    let key;
    if (type === 'month') {
      key = item.date.slice(0, 7); // yyyy-mm
    } else {
      key = item.date.slice(0, 10); // yyyy-mm-dd
    }
    if (!grouped[key]) grouped[key] = { usage: 0, cost: 0 };
    grouped[key].usage += item.usage;
    grouped[key].cost += item.cost;
  });
  return Object.entries(grouped).map(([date, v]) => ({ date, ...v }));
}

interface AppStats {
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
}

function UsageStats() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation('auth');
  const [usageData, setUsageData] = React.useState<any[]>([]);
  const [appStats, setAppStats] = React.useState<AppStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    setLoading(true);

    const fetchData = async () => {
      try {
        // 首先獲取個人統計數據（必需）
        console.log('Fetching user stats for userId:', user.id);
        const userStatsResponse = await axios.get(`/api/user-token-stats?userId=${user.id}`);

        setUsageData(userStatsResponse.data.dailyUsage.map((d: any) => ({
          id: `${user.id}-${d.date}`,
          date: d.date.slice(0, 10),
          usage: d.tokenUsage,
          cost: d.billing,
          messages: d.messages || 0,
          source: d.source || 'wiki-db',
          difyUserId: user.id,
          userId: user.id
        })));

        // 如果是 admin 用戶，嘗試獲取應用級統計（可選）
        if (user.role === 'admin' || user.role === 'Administrator') {
          try {
            console.log('Fetching app stats for admin user');
            const appStatsResponse = await axios.get('/api/app-stats');
            setAppStats(appStatsResponse.data);
            console.log('App stats loaded successfully:', appStatsResponse.data);
          } catch (appStatsError: any) {
            console.warn('Failed to load app stats (non-critical):', appStatsError.response?.data || appStatsError.message);
            // 應用級統計失敗不影響頁面顯示，只記錄警告
            setAppStats(null);
          }
        }

      } catch (e: any) {
        console.error('Error loading data:', e.response?.data || e.message);
        setError(e.response?.data?.error || e.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const monthStats = useMemo(() => sumByDate(usageData, 'month'), [usageData]);
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const todayStat = usageData.find((d: any) => d.date === today);
  const thisMonthStat = monthStats.find(m => m.date === thisMonth);

  if (authLoading) return <div>{t('loading')}</div>;
  if (!user) return <div className="text-red-500">{t('profile_page.please_login')}</div>;
  if (loading) return <div>{t('usage_page.loading_stats')}</div>;
  if (error) return <div className="text-red-500">{t('usage_page.error_loading')}: {error}</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-purple-50 rounded p-6 shadow flex flex-col items-center">
          <span className="text-3xl mb-2">�</span>
          <div className="font-semibold mb-1">{t('usage_page.today_api_usage')}</div>
          <div className="text-gray-700">
            {todayStat ? todayStat.messages : 0} 則對話<br/>
            <span className="text-sm text-gray-500">Token/費用：N/A (本地模型)</span>
          </div>
        </div>
        <div className="bg-purple-50 rounded p-6 shadow flex flex-col items-center">
          <span className="text-3xl mb-2">📅</span>
          <div className="font-semibold mb-1">{t('usage_page.monthly_api_usage')}</div>
          <div className="text-gray-700">
            {monthStats.reduce((sum, m) => sum + (usageData.filter(d => d.date.startsWith(m.date)).reduce((s, d) => s + (d.messages || 0), 0)), 0)} 則對話<br/>
            <span className="text-sm text-gray-500">Token/費用：N/A (本地模型)</span>
          </div>
        </div>
      </div>
      <UsageCostTable usageData={usageData} appStats={appStats} />
    </>
  );
}

export default function Usage() {
  const { t } = useTranslation('auth');

  return (
    <MainLayout title={(t('usage_page.title') as string) || 'Usage / Reports'}>
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">{t('usage_page.title')}</h2>
          <UsageStats />
        </div>
      </div>
    </MainLayout>
  );
}
