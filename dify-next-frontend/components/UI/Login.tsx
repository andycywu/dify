import React, { useState } from 'react';
import Image from 'next/image';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        username: email, // NextAuth 配置中使用 username 欄位名稱
        password,
        redirect: false,
      });
      if (result?.ok && !result?.error) {
        console.log('Login successful, refreshing session...');
        
        // 強制刷新 session
        await getSession();
        
        if (onSuccess) onSuccess();
        
        // 直接跳轉，不需要延遲
        router.push('/dashboard');
        return;
      }
      setError(t('login_page.login_error'));
    } catch (err) {
      setError(t('login_page.network_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setResetLoading(true);

    // Redirect to Wiki.js password reset page
    const wikiUrl = process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3000';
    setResetMsg(t('login_page.reset_info'));

    setTimeout(() => {
      window.open(`${wikiUrl}/login`, '_blank', 'noopener,noreferrer');
      setResetLoading(false);
      setShowReset(false);
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          {customLogo && (
            <Image
              src={customLogo}
              alt="Logo"
              width={64}
              height={64}
              className="h-16 w-auto mb-2"
              unoptimized
            />
          )}
          <h2 className="text-2xl font-bold text-center">{t('login_page.title')}</h2>
          <p className="mt-2 text-center text-gray-600">{t('login_page.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('login_page.email_label')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login_page.email_placeholder') || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('login_page.password_label')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login_page.password_placeholder') || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: primaryColor }}
            className="w-full py-2 px-4 text-white rounded hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? t('login_page.logging_in') : t('login_page.login_button')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => setShowReset(v => !v)}>
            {t('login_page.forgot_password')}
          </button>
        </div>
        {showReset && (
          <form className="mt-4" onSubmit={handleReset}>
            <div className="mb-2 text-sm">{t('login_page.reset_info')}</div>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
              placeholder={t('login_page.email_placeholder') || ''}
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50" disabled={resetLoading}>
              {resetLoading ? t('login_page.opening') : t('login_page.reset_button')}
            </button>
            {resetMsg && <div className="mt-2 text-center text-sm text-green-700">{resetMsg}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
