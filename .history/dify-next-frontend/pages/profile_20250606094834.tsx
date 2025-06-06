import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    axios.get(`/api/user/${user.id}`)
      .then(res => setProfile(res.data))
      .catch(e => setError(e.message || 'Failed to fetch profile'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <MainLayout title="個人資料">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">個人資料</h2>
          {loading ? (
            <div className="text-center">載入中...</div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : profile ? (
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 rounded p-4 shadow">
                <div className="font-semibold mb-1">姓名</div>
                <div className="text-gray-700">{profile.name || <span className="italic text-gray-400">未設定</span>}</div>
              </div>
              <div className="bg-blue-50 rounded p-4 shadow">
                <div className="font-semibold mb-1">Email</div>
                <div className="text-gray-700">{profile.email}</div>
              </div>
              <div className="bg-blue-50 rounded p-4 shadow">
                <div className="font-semibold mb-1">密碼</div>
                <div className="text-gray-700 italic text-gray-400">（請點選下方按鈕修改密碼）</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
