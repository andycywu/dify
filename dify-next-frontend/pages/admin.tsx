import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import RestToSoapManager from '../components/Admin/RestToSoapManager';
import WikiImportManager from '../components/Admin/WikiImportManager';
import WikiChatbotSettings from '../components/Admin/WikiChatbotSettings';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation(['admin', 'auth']);
  const [activeTab, setActiveTab] = useState<'overview' | 'rest-to-soap' | 'wiki-import' | 'chatbot-settings'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Admin] useEffect', { user, authLoading });
    if (authLoading) return;

    // Check admin permissions (using Wiki.js groups)
    if (!user || user.role !== 'admin') {
      setError(t('admin:no_permission'));
      return;
    }
  }, [user, authLoading, t]);

  // Admin permission check
  if (authLoading) {
    return (
      <MainLayout title={t('admin:title') as string}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">{t('admin:loading')}</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title={t('admin:title') as string}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('admin:title') as string}>
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{t('admin:system_management')}</h1>

          {/* Navigation tabs */}
          <div className="flex mb-6 border-b overflow-x-auto">
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              {t('admin:overview')}
            </button>
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'chatbot-settings'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab('chatbot-settings')}
            >
              {t('admin:chatbot_settings')}
            </button>
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'rest-to-soap'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab('rest-to-soap')}
            >
              {t('admin:rest_to_soap_proxy')}
            </button>
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'wiki-import'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab('wiki-import')}
            >
              {t('admin:wiki_import')}
            </button>
          </div>

          {/* Content area */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* System status card */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">🖥️</span>
                  <h3 className="text-lg font-semibold text-blue-800">{t('admin:system_status.title')}</h3>
                </div>
                <p className="text-blue-700">{t('admin:system_status.description')}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('admin:system_status.dify_api')}：</span>
                    <span className="text-green-600">{t('admin:system_status.running')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin:system_status.postgresql')}：</span>
                    <span className="text-green-600">{t('admin:system_status.running')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin:system_status.redis')}：</span>
                    <span className="text-green-600">{t('admin:system_status.running')}</span>
                  </div>
                </div>
              </div>

              {/* REST-to-SOAP status */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">🔗</span>
                  <h3 className="text-lg font-semibold text-green-800">{t('admin:rest_to_soap.title')}</h3>
                </div>
                <p className="text-green-700">{t('admin:rest_to_soap.description')}</p>
                <button
                  onClick={() => setActiveTab('rest-to-soap')}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  {t('admin:rest_to_soap.manage_service')}
                </button>
              </div>

              {/* Wiki-Dify Auto Sync status */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">📚</span>
                  <h3 className="text-lg font-semibold text-purple-800">{t('admin:wiki_batch_import.title')}</h3>
                </div>
                <p className="text-purple-700">{t('admin:wiki_batch_import.description')}</p>
                <button
                  onClick={() => setActiveTab('wiki-import')}
                  className="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                >
                  {t('admin:wiki_batch_import.manage_import')}
                </button>
              </div>

              {/* Wiki.js user statistics */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">👥</span>
                  <h3 className="text-lg font-semibold text-yellow-800">{t('admin:user_statistics.title')}</h3>
                </div>
                <p className="text-yellow-700">{t('admin:user_statistics.description')}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('admin:user_statistics.active_users')}：</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin:user_statistics.administrators')}：</span>
                    <span className="font-semibold">-</span>
                  </div>
                </div>
              </div>

              {/* Knowledge base management */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">🧠</span>
                  <h3 className="text-lg font-semibold text-indigo-800">{t('admin:knowledge_management.title')}</h3>
                </div>
                <p className="text-indigo-700">{t('admin:knowledge_management.description')}</p>
                <Link
                  href="/knowledge-management"
                  className="mt-3 inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                >
                  {t('admin:knowledge_management.manage_kb')}
                </Link>
              </div>

              {/* System logs */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">📋</span>
                  <h3 className="text-lg font-semibold text-gray-800">{t('admin:system_logs.title')}</h3>
                </div>
                <p className="text-gray-700">{t('admin:system_logs.description')}</p>
                <button className="mt-3 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                  {t('admin:system_logs.view_logs')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rest-to-soap' && (
            <RestToSoapManager />
          )}

          {activeTab === 'wiki-import' && (
            <WikiImportManager />
          )}

          {activeTab === 'chatbot-settings' && (
            <WikiChatbotSettings />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
