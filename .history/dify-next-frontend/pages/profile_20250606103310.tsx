import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPwdEdit, setShowPwdEdit] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    setLoading(true);
    axios.get(`/api/user/${user.id}`)
      .then(res => setProfile(res.data))
      .catch(e => setError(e.message || 'Failed to fetch profile'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handlePwdChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError('請填寫所有欄位');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('新密碼與確認密碼不一致');
      return;
    }
    setPwdLoading(true);
    try {
      // 驗證舊密碼
      const verify = await axios.post('/api/user/verify-password', { userId: user.id, password: oldPwd });
      if (!verify.data.valid) {
        setPwdError('原密碼錯誤');
        setPwdLoading(false);
        return;
      }
      // 修改密碼
      await axios.put(`/api/user/${user.id}`, { password: newPwd });
      setPwdSuccess('密碼修改成功');
      setShowPwdEdit(false);
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) {
      setPwdError(e.response?.data?.error || e.message || '密碼修改失敗');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <MainLayout title="個人資料">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">個人資料</h2>
          {authLoading ? (
            <div className="text-center">載入中...</div>
          ) : !user ? (
            <div className="text-center text-red-500">請先登入</div>
          ) : loading ? (
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
                {showPwdEdit ? (
                  <form className="flex flex-col gap-2" onSubmit={handlePwdChange}>
                    <input
                      type="password"
                      className="border rounded px-3 py-2"
                      placeholder="原密碼"
                      value={oldPwd}
                      onChange={e => setOldPwd(e.target.value)}
                      autoFocus
                    />
                    <input
                      type="password"
                      className="border rounded px-3 py-2"
                      placeholder="新密碼"
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                    />
                    <input
                      type="password"
                      className="border rounded px-3 py-2"
                      placeholder="確認新密碼"
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                    />
                    {pwdError && <div className="text-red-500 text-sm">{pwdError}</div>}
                    {pwdSuccess && <div className="text-green-600 text-sm">{pwdSuccess}</div>}
                    <div className="flex gap-2 mt-2">
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={pwdLoading}>儲存</button>
                      <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => { setShowPwdEdit(false); setPwdError(null); setPwdSuccess(null); }}>取消</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="text-gray-700 italic text-gray-400">（請點選下方按鈕修改密碼）</div>
                    <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowPwdEdit(true)}>修改密碼</button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
