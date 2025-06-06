import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

interface LoginProps {
  onSuccess?: () => void;
  primaryColor?: string;
  customLogo?: string;
}

const Login: React.FC<LoginProps> = ({ 
  onSuccess, 
  primaryColor = '#3B82F6',
  customLogo
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<string|null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        username: email, // 修正這裡，傳 username 給 NextAuth
        password,
        redirect: false,
      });
      if (result?.ok && !result?.error) {
        if (onSuccess) onSuccess();
        // 強制跳轉到首頁
        router.push('/');
        return;
      }
      setError('Invalid username or password');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setResetLoading(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg('密碼已重設並寄送通知信，請檢查信箱 (新密碼: dify12345)');
      } else {
        setResetMsg(data.error || '重設失敗');
      }
    } catch (e: any) {
      setResetMsg('重設失敗');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          {customLogo && (
            <img 
              src={customLogo} 
              alt="Logo" 
              className="h-16 w-auto mb-2" 
            />
          )}
          <h2 className="text-2xl font-bold text-center">TPV OBM測試助理</h2>
          <p className="mt-2 text-center text-gray-600">Login to access your assistant</p>
          <p className="mt-1 text-center text-gray-500 text-xs">Default: admin / dify12345</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: primaryColor }}
            className="w-full py-2 px-4 text-white rounded hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => setShowReset(v => !v)}>
            忘記密碼？
          </button>
        </div>
        {showReset && (
          <form className="mt-4" onSubmit={handleReset}>
            <div className="mb-2 text-sm">請輸入註冊信箱，系統會將密碼重設為 <b>dify12345</b> 並寄送通知信。</div>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
              placeholder="Email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded" disabled={resetLoading}>
              {resetLoading ? '重設中...' : '重設密碼'}
            </button>
            {resetMsg && <div className="mt-2 text-center text-sm text-green-700">{resetMsg}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
