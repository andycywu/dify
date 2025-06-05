import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface UserTokenStat {
  userId: string;
  email: string;
  totalTokens: number;
}

interface OpenAIRate {
  model: string;
  pricePer1KToken: number;
}

interface DailyUsage {
  date: string;
  tokenUsage: number;
  billing: number;
}

const TokenStatsTable: React.FC = () => {
  const [stats, setStats] = useState<UserTokenStat[]>([]);
  const [rate, setRate] = useState<OpenAIRate>({ model: '', pricePer1KToken: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editRate, setEditRate] = useState(false);
  const [newRate, setNewRate] = useState(rate.pricePer1KToken);
  const { user } = useAuth();
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [showUserDaily, setShowUserDaily] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, rateRes] = await Promise.all([
          axios.get('/api/user-token-stats'),
          axios.get('/api/openai-rate'),
        ]);
        setStats(statsRes.data);
        setRate(rateRes.data);
        setNewRate(rateRes.data.pricePer1KToken);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleRateSave = async () => {
    try {
      await axios.post('/api/openai-rate', { model: rate.model, pricePer1KToken: newRate });
      setRate(r => ({ ...r, pricePer1KToken: newRate }));
      setEditRate(false);
    } catch (e: any) {
      setError(e.message || 'Failed to update rate');
    }
  };

  const fetchDailyUsage = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/user-token-stats?userId=${userId}`);
      setDailyUsage(res.data.dailyUsage);
      setShowUserDaily(userId);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch daily usage');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">User Token Usage & Cost</h2>
      <div className="mb-4">
        <span className="font-semibold">OpenAI Rate:</span>{' '}
        {editRate ? (
          <>
            <input
              type="number"
              step="0.0001"
              value={newRate}
              onChange={e => setNewRate(Number(e.target.value))}
              className="border p-1 rounded w-32 mr-2"
            />
            <button className="bg-blue-600 text-white px-2 py-1 rounded mr-2" onClick={handleRateSave}>Save</button>
            <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditRate(false)}>Cancel</button>
          </>
        ) : (
          <>
            <span>${rate.pricePer1KToken} / 1K tokens</span>
            <button className="ml-2 text-blue-600 underline" onClick={() => setEditRate(true)}>Edit</button>
          </>
        )}
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Total Tokens</th>
            <th className="p-2 border">Cost (USD)</th>
            <th className="p-2 border">Details</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(u => (
            <tr key={u.userId}>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">{u.totalTokens}</td>
              <td className="p-2 border">${((u.totalTokens / 1000) * rate.pricePer1KToken).toFixed(4)}</td>
              <td className="p-2 border">
                <button className="text-blue-600 underline" onClick={() => fetchDailyUsage(u.userId)}>
                  View Daily
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showUserDaily && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Daily Usage</h3>
          <button className="mb-2 text-blue-600 underline" onClick={() => { setShowUserDaily(null); setDailyUsage([]); }}>Back</button>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Tokens</th>
                <th className="p-2 border">Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {dailyUsage.map((d) => (
                <tr key={d.date}>
                  <td className="p-2 border">{d.date.slice(0, 10)}</td>
                  <td className="p-2 border">{d.tokenUsage}</td>
                  <td className="p-2 border">${((d.tokenUsage / 1000) * rate.pricePer1KToken).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TokenStatsTable;
