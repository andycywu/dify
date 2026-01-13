import React from 'react';
import Head from 'next/head';
import MainLayout from '../components/Layout/MainLayout';
import Link from 'next/link';
import { useTranslation } from '../lib/mockTranslation';

export default function Dashboard() {
  const { t } = useTranslation('auth');

  return (
    <MainLayout title={t('dashboard') || 'Dashboard'}>
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">👤</span>
          <h2 className="text-xl font-semibold mb-1">{t('dashboard_cards.profile.title')}</h2>
          <p className="text-gray-600 mb-2 text-center">{t('dashboard_cards.profile.description')}</p>
          <Link href="/profile" className="text-blue-600 hover:underline">{t('dashboard_cards.profile.go')}</Link>
        </div>
        <div className="bg-green-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">⚙️</span>
          <h2 className="text-xl font-semibold mb-1">{t('dashboard_cards.settings.title')}</h2>
          <p className="text-gray-600 mb-2 text-center">{t('dashboard_cards.settings.description')}</p>
          <Link href="/settings" className="text-green-600 hover:underline">{t('dashboard_cards.settings.go')}</Link>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">🤖</span>
          <h2 className="text-xl font-semibold mb-1">{t('dashboard_cards.chatbot.title')}</h2>
          <p className="text-gray-600 mb-2 text-center">{t('dashboard_cards.chatbot.description')}</p>
          <Link href="/test-agentic" className="text-yellow-600 hover:underline">{t('dashboard_cards.chatbot.go')}</Link>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">📊</span>
          <h2 className="text-xl font-semibold mb-1">{t('dashboard_cards.reports.title')}</h2>
          <p className="text-gray-600 mb-2 text-center">{t('dashboard_cards.reports.description')}</p>
          <Link href="/usage" className="text-purple-600 hover:underline">{t('dashboard_cards.reports.go')}</Link>
        </div>
        <div className="bg-red-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">🎯</span>
          <h2 className="text-xl font-semibold mb-1">AIC 戰情室</h2>
          <p className="text-gray-600 mb-2 text-center">查詢 Urtracker 專案數據</p>
          <Link href="/aic-dashboard" className="text-red-600 hover:underline">前往戰情室</Link>
        </div>
        <div className="bg-orange-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">📋</span>
          <h2 className="text-xl font-semibold mb-1">Test Plan 戰情室</h2>
          <p className="text-gray-600 mb-2 text-center">統計各 ODM 測試進度</p>
          <Link href="/test-plan-dashboard" className="text-orange-600 hover:underline">前往 Test Plan</Link>
        </div>
        <div className="bg-indigo-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">🔍</span>
          <h2 className="text-xl font-semibold mb-1">大表檢索</h2>
          <p className="text-gray-600 mb-2 text-center">搜尋 InHouse 和 Outsourcing 專案資料</p>
          <Link href="/big-table-search" className="text-indigo-600 hover:underline">前往檢索</Link>
        </div>
        <div className="bg-teal-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">📚</span>
          <h2 className="text-xl font-semibold mb-1">Knowledge 管理</h2>
          <p className="text-gray-600 mb-2 text-center">管理知識庫和文檔</p>
          <Link href="/knowledge-management" className="text-teal-600 hover:underline">前往管理</Link>
        </div>
      </div>
    </MainLayout>
  );
}
