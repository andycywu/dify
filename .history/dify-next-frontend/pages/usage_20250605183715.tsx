import React from 'react';

export default function Usage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-xl w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">用量 / 報表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-purple-50 rounded p-6 shadow flex flex-col items-center">
            <span className="text-3xl mb-2">🔢</span>
            <div className="font-semibold mb-1">API 用量</div>
            <div className="text-gray-700">（這裡顯示 API 用量統計）</div>
          </div>
          <div className="bg-purple-50 rounded p-6 shadow flex flex-col items-center">
            <span className="text-3xl mb-2">💰</span>
            <div className="font-semibold mb-1">費用統計</div>
            <div className="text-gray-700">（這裡顯示費用統計圖表）</div>
          </div>
        </div>
      </div>
    </div>
  );
}
