import React, { useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import UsageCostTable from '../components/Usage/UsageCostTable';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function sumByDate(usageData, type = 'day') {
  if (!usageData || usageData.length === 0) return [];
  const grouped = {};
  usageData.forEach(item => {
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

function UsageStats() {
  const { user } = useAuth();
  const [usageData, setUsageData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    axios.get(`/api/user-token-stats?userId=${user.id}`)
      .then(res => {
        setUsageData(res.data.dailyUsage.map((d) => ({
          date: d.date.slice(0, 10),
          usage: d.tokenUsage,
          cost: d.billing,
        })));
      })
      .catch(e => setError(e.message || 'Failed to fetch usage data'))
      .finally(() => setLoading(false));
  }, [user]);

  const monthStats = useMemo(() => sumByDate(usageData, 'month'), [usageData]);
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const todayStat = usageData.find(d => d.date === today);
  const thisMonthStat = monthStats.find(m => m.date === thisMonth);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-purple-50 rounded p-6 shadow flex flex-col items-center">
          <span className="text-3xl mb-2">🔢</span>
          <div className="font-semibold mb-1">今日 API 用量</div>
          <div className="text-gray-700">{todayStat ? todayStat.usage : 0} tokens<br/>${todayStat ? todayStat.cost.toFixed(4) : '0.0000'}</div>
        </div>
        <div className="bg-purple-50 rounded p-6 shadow flex flex-col items-center">
          <span className="text-3xl mb-2">📅</span>
          <div className="font-semibold mb-1">本月 API 用量</div>
          <div className="text-gray-700">{thisMonthStat ? thisMonthStat.usage : 0} tokens<br/>${thisMonthStat ? thisMonthStat.cost.toFixed(4) : '0.0000'}</div>
        </div>
      </div>
      <UsageCostTable usageData={usageData} />
    </>
  );
}

export default function Usage() {
  return (
    <MainLayout title="用量 / 報表">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">用量 / 報表</h2>
          <UsageStats />
        </div>
      </div>
    </MainLayout>
  );
}
