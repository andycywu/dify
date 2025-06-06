import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface UsageItem {
  id: string;
  date: string;
  usage: number;
  cost: number;
}

interface UsageCostTableProps {
  usageData?: UsageItem[];
}

const UsageCostTable: React.FC<UsageCostTableProps> = ({ usageData: propUsageData }) => {
  const { user, loading: authLoading } = useAuth();
  const [usageData, setUsageData] = useState<UsageItem[]>(propUsageData || []);
  const [loading, setLoading] = useState(!propUsageData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propUsageData) return;
    if (authLoading) return;
    if (!user) return;
    const fetchUsageData = async () => {
      try {
        // 取得該使用者的每日用量
        const response = await axios.get(`/api/user-token-stats?userId=${user.id}`);
        // dailyUsage: [{ date, tokenUsage, billing }]
        setUsageData(response.data.dailyUsage.map((d: any, idx: number) => ({
          id: `${user.id}-${d.date}`,
          date: d.date.slice(0, 10),
          usage: d.tokenUsage,
          cost: d.billing,
        })));
      } catch (error: any) {
        setError(error.message || 'Failed to fetch usage data');
      } finally {
        setLoading(false);
      }
    };
    fetchUsageData();
  }, [user, propUsageData, authLoading]);

  if (authLoading) return <div>載入中...</div>;
  if (!user) return <div className="text-red-500">請先登入</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Usage & Cost Table</h2>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Date</th>
            <th className="px-4 py-2 border">Usage (Tokens)</th>
            <th className="px-4 py-2 border">Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {usageData.map((item) => (
            <tr key={item.id} className="text-center">
              <td className="border px-4 py-2">{item.date}</td>
              <td className="border px-4 py-2">{item.usage}</td>
              <td className="border px-4 py-2">{item.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsageCostTable;