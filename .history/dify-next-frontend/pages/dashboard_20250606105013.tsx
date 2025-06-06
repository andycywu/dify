import React from 'react';
import Head from 'next/head';
import MainLayout from '../components/Layout/MainLayout';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <MainLayout title="Dashboard">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">👤</span>
          <h2 className="text-xl font-semibold mb-1">個人資料</h2>
          <p className="text-gray-600 mb-2 text-center">查看與編輯您的個人資訊</p>
          <Link href="/profile" className="text-blue-600 hover:underline">前往</Link>
        </div>
        <div className="bg-green-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">⚙️</span>
          <h2 className="text-xl font-semibold mb-1">設定</h2>
          <p className="text-gray-600 mb-2 text-center">調整系統或個人偏好</p>
          <Link href="/settings" className="text-green-600 hover:underline">前往</Link>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">🤖</span>
          <h2 className="text-xl font-semibold mb-1">對話機器人</h2>
          <p className="text-gray-600 mb-2 text-center">啟動 test-agentic 對話助理</p>
          <Link href="/test-agentic" className="text-yellow-600 hover:underline">前往</Link>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 shadow flex flex-col items-center">
          <span className="text-4xl mb-2">📊</span>
          <h2 className="text-xl font-semibold mb-1">用量/報表</h2>
          <p className="text-gray-600 mb-2 text-center">查看 API 用量與統計</p>
          <Link href="/usage" className="text-purple-600 hover:underline">前往</Link>
        </div>
      </div>
    </MainLayout>
  );
}
