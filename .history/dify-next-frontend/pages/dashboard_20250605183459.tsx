import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 shadow flex flex-col items-center">
            <span className="text-4xl mb-2">👤</span>
            <h2 className="text-xl font-semibold mb-1">個人資料</h2>
            <p className="text-gray-600 mb-2 text-center">查看與編輯您的個人資訊</p>
            <a href="/profile" className="text-blue-600 hover:underline">前往</a>
          </div>
          <div className="bg-green-50 rounded-lg p-6 shadow flex flex-col items-center">
            <span className="text-4xl mb-2">⚙️</span>
            <h2 className="text-xl font-semibold mb-1">設定</h2>
            <p className="text-gray-600 mb-2 text-center">調整系統或個人偏好</p>
            <a href="/settings" className="text-green-600 hover:underline">前往</a>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 shadow flex flex-col items-center">
            <span className="text-4xl mb-2">🤖</span>
            <h2 className="text-xl font-semibold mb-1">對話機器人</h2>
            <p className="text-gray-600 mb-2 text-center">啟動 test-agentic 對話助理</p>
            <a href="/test-agentic" className="text-yellow-600 hover:underline">前往</a>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 shadow flex flex-col items-center">
            <span className="text-4xl mb-2">📊</span>
            <h2 className="text-xl font-semibold mb-1">用量/報表</h2>
            <p className="text-gray-600 mb-2 text-center">查看 API 用量與統計</p>
            <a href="/usage" className="text-purple-600 hover:underline">前往</a>
          </div>
        </div>
      </div>
    </div>
  );
}
