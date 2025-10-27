import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [wikiUrl, setWikiUrl] = useState<string>('');
  const { t } = useTranslation('auth');

  useEffect(() => {
    // Get Wiki.js URL from environment variables or config
    setWikiUrl(process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3000');
  }, []);

  const openWikiProfile = () => {
    const url = `${wikiUrl}/profile`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <MainLayout title={t('profile_page.title') || 'Profile'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">{t('profile_page.title')}</h2>
          {authLoading ? (
            <div className="text-center">{t('profile_page.loading')}</div>
          ) : !user ? (
            <div className="text-center text-red-500">{t('profile_page.please_login')}</div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* User information */}
              <div className="bg-blue-50 rounded p-4 shadow">
                <div className="font-semibold mb-1">{t('profile_page.name_label')}</div>
                <div className="text-gray-700">{user.name || t('profile_page.not_set')}</div>
              </div>
              <div className="bg-blue-50 rounded p-4 shadow">
                <div className="font-semibold mb-1">{t('profile_page.email_label')}</div>
                <div className="text-gray-700">{user.email}</div>
              </div>
              <div className="bg-blue-50 rounded p-4 shadow">
                <div className="font-semibold mb-1">{t('profile_page.role_label')}</div>
                <div className="text-gray-700">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' ? t('profile_page.admin') : t('profile_page.user')}
                  </span>
                </div>
              </div>

              {/* Wiki.js integration notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">{t('profile_page.wiki_integration.title')}</h3>
                    <p className="text-yellow-700 text-sm mb-3">
                      {t('profile_page.wiki_integration.description')}
                    </p>
                    <button
                      onClick={openWikiProfile}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      {t('profile_page.wiki_integration.button')}
                    </button>
                  </div>
                </div>
              </div>

              {/* System information */}
              <div className="bg-gray-50 rounded p-4 shadow">
                <div className="font-semibold mb-2">{t('profile_page.system_info.title')}</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{t('profile_page.system_info.auth_system')}: Wiki.js</div>
                  <div>{t('profile_page.system_info.user_id')}: {user.id}</div>
                  <div>{t('profile_page.system_info.last_login')}: {t('profile_page.system_info.unknown')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
