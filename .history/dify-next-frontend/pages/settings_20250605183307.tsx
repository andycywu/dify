import React from 'react';

export default function Settings() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">設定</h2>
        <div className="grid gap-4">
          <div className="p-4 rounded border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-gray-700">主題色</span>
            <span className="rounded px-3 py-1 bg-blue-100 text-blue-700">#3B82F6</span>
          </div>
          <div className="p-4 rounded border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-gray-700">語言</span>
            <span className="rounded px-3 py-1 bg-gray-100 text-gray-700">繁體中文</span>
          </div>
          <div className="p-4 rounded border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-gray-700">API Key</span>
            <span className="rounded px-3 py-1 bg-gray-100 text-gray-700">（請串接設定）</span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">儲存設定</button>
        </div>
      </div>
    </div>
  );
}
