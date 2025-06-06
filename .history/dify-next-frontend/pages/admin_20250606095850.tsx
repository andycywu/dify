import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('您沒有權限瀏覽此頁面');
      setLoading(false);
      return;
    }
    axios.get('/api/user')
      .then(res => setUsers(res.data))
      .catch(e => setError(e.message || 'Failed to fetch users'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <MainLayout title="管理員介面">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">用戶管理</h2>
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
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="text-center">
                    <td className="border px-4 py-2">{u.name || <span className="italic text-gray-400">未設定</span>}</td>
                    <td className="border px-4 py-2">{u.email}</td>
                    <td className="border px-4 py-2">{u.role}</td>
                    <td className="border px-4 py-2">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
