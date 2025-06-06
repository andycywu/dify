import React, { useEffect, useState, useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function calcStats(usages: any[]) {
  if (!usages || usages.length === 0) return { total: 0, avg: 0, cost: 0, avgCost: 0 };
  const total = usages.reduce((sum, u) => sum + (u.tokenUsage || 0), 0);
  const cost = usages.reduce((sum, u) => sum + (u.billing || 0), 0);
  const months = usages.reduce((set, u) => set.add(u.date?.slice(0, 7)), new Set()).size || 1;
  return {
    total,
    avg: Math.round(total / months),
    cost: Number(cost.toFixed(4)),
    avgCost: Number((cost / months).toFixed(4)),
  };
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState<any>({ email: '', name: '', password: '', role: 'user' });
  const [rate, setRate] = useState<number>(0.01);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Admin] useEffect', { user, authLoading });
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      setError('您沒有權限瀏覽此頁面');
      setLoading(false);
      return;
    }
    fetchAll();
    fetchRate();
  }, [user, authLoading]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/user');
      // 取得每個用戶的用量
      const all = await Promise.all(res.data.map(async (u: any) => {
        const usageRes = await axios.get(`/api/user-token-stats?userId=${u.id}`);
        return { ...u, usages: usageRes.data.dailyUsage };
      }));
      setUsers(all);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRate = async () => {
    setRateLoading(true);
    setRateError(null);
    try {
      const res = await axios.get('/api/billing-rate');
      setRate(res.data.rate);
    } catch (e: any) {
      setRateError(e.message || 'Failed to fetch rate');
    } finally {
      setRateLoading(false);
    }
  };

  const handleEdit = (u: any) => {
    setEditing(u.id);
    setEditData({ ...u });
  };
  const handleEditSave = async () => {
    await axios.put(`/api/user/${editing}`, editData);
    setEditing(null);
    fetchAll();
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除這個用戶嗎？')) return;
    await axios.delete(`/api/user/${id}`);
    fetchAll();
  };
  const handleCreate = async () => {
    await axios.post('/api/user', createData);
    setShowCreate(false);
    setCreateData({ email: '', name: '', password: '', role: 'user' });
    fetchAll();
  };
  const handleRateSave = async () => {
    setRateLoading(true);
    setRateError(null);
    try {
      await axios.post('/api/billing-rate', { rate });
      fetchAll();
    } catch (e: any) {
      setRateError(e.message || 'Failed to save rate');
    } finally {
      setRateLoading(false);
    }
  };

  return (
    <MainLayout title="管理員介面">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">用戶管理</h2>
          <pre className="text-xs bg-gray-100 p-2 mb-2 rounded text-gray-600">user: {JSON.stringify(user)}\nauthLoading: {String(authLoading)}\nerror: {error}</pre>
          {authLoading ? (
            <div className="text-center">載入中...</div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowCreate(v => !v)}>新增用戶</button>
                </div>
                <div className="flex items-center gap-2">
                  <span>Token 計費費率 (USD/1K Token):</span>
                  <input type="number" step="0.0001" value={rate} onChange={e => setRate(Number(e.target.value))} className="border rounded px-2 py-1 w-28" />
                  <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleRateSave} disabled={rateLoading}>儲存</button>
                  {rateError && <span className="text-red-500 ml-2">{rateError}</span>}
                </div>
              </div>
              {showCreate && (
                <div className="mb-6 p-4 border rounded bg-gray-50">
                  <h3 className="font-semibold mb-2">新增用戶</h3>
                  <div className="flex flex-col gap-2">
                    <input className="border rounded px-2 py-1" placeholder="Email" value={createData.email} onChange={e => setCreateData(d => ({ ...d, email: e.target.value }))} />
                    <input className="border rounded px-2 py-1" placeholder="姓名" value={createData.name} onChange={e => setCreateData(d => ({ ...d, name: e.target.value }))} />
                    <input className="border rounded px-2 py-1" placeholder="密碼" type="password" value={createData.password} onChange={e => setCreateData(d => ({ ...d, password: e.target.value }))} />
                    <select className="border rounded px-2 py-1" value={createData.role} onChange={e => setCreateData(d => ({ ...d, role: e.target.value }))}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <div className="flex gap-2 mt-2">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCreate}>建立</button>
                      <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowCreate(false)}>取消</button>
                    </div>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="text-center">載入中...</div>
              ) : error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : (
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border">姓名</th>
                      <th className="px-4 py-2 border">Email</th>
                      <th className="px-4 py-2 border">角色</th>
                      <th className="px-4 py-2 border">建立時間</th>
                      <th className="px-4 py-2 border">總用量</th>
                      <th className="px-4 py-2 border">月平均用量</th>
                      <th className="px-4 py-2 border">總費用</th>
                      <th className="px-4 py-2 border">月平均費用</th>
                      <th className="px-4 py-2 border">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const stats = calcStats(u.usages);
                      return editing === u.id ? (
                        <tr key={u.id} className="text-center bg-yellow-50">
                          <td className="border px-4 py-2"><input className="border rounded px-2 py-1" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} /></td>
                          <td className="border px-4 py-2"><input className="border rounded px-2 py-1" value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} /></td>
                          <td className="border px-4 py-2"><select className="border rounded px-2 py-1" value={editData.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}><option value="user">user</option><option value="admin">admin</option></select></td>
                          <td className="border px-4 py-2">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                          <td className="border px-4 py-2">{stats.total}</td>
                          <td className="border px-4 py-2">{stats.avg}</td>
                          <td className="border px-4 py-2">{stats.cost}</td>
                          <td className="border px-4 py-2">{stats.avgCost}</td>
                          <td className="border px-4 py-2 flex gap-2 justify-center"><button className="bg-green-600 text-white px-2 py-1 rounded" onClick={handleEditSave}>儲存</button><button className="bg-gray-300 px-2 py-1 rounded" onClick={() => setEditing(null)}>取消</button></td>
                        </tr>
                      ) : (
                        <tr key={u.id} className="text-center">
                          <td className="border px-4 py-2">{u.name || <span className="italic text-gray-400">未設定</span>}</td>
                          <td className="border px-4 py-2">{u.email}</td>
                          <td className="border px-4 py-2">{u.role}</td>
                          <td className="border px-4 py-2">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                          <td className="border px-4 py-2">{stats.total}</td>
                          <td className="border px-4 py-2">{stats.avg}</td>
                          <td className="border px-4 py-2">{stats.cost}</td>
                          <td className="border px-4 py-2">{stats.avgCost}</td>
                          <td className="border px-4 py-2 flex gap-2 justify-center"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(u)}>編輯</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(u.id)}>刪除</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
