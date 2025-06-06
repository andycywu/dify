import React from 'react';
import MainLayout from '../components/Layout/MainLayout';

export default function Settings() {
  return (
    <MainLayout title="設定">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
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
    </MainLayout>
  );
}
