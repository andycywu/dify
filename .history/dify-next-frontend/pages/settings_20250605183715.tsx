import React from 'react';

export default function Settings() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">設定</h2>
        <div className="flex flex-col gap-4">
          <div className="bg-green-50 rounded p-4 shadow">
            <div className="font-semibold mb-1">主題色</div>
            <div className="text-gray-700">（這裡可切換主題色）</div>
          </div>
          <div className="bg-green-50 rounded p-4 shadow">
            <div className="font-semibold mb-1">語言</div>
            <div className="text-gray-700">（這裡可切換語言）</div>
          </div>
          <div className="bg-green-50 rounded p-4 shadow">
            <div className="font-semibold mb-1">API Key</div>
            <div className="text-gray-700">（這裡可設定 API Key）</div>
          </div>
        </div>
      </div>
    </div>
  );
}
