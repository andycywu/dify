import React from 'react';

export default function Profile() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">個人資料</h2>
        <div className="grid gap-4">
          <div className="p-4 rounded border border-gray-200 shadow-sm">
            <p className="text-gray-700">姓名：<span className="font-semibold">（請串接用戶資料）</span></p>
          </div>
          <div className="p-4 rounded border border-gray-200 shadow-sm">
            <p className="text-gray-700">信箱：<span className="font-semibold">（請串接用戶資料）</span></p>
          </div>
          <div className="p-4 rounded border border-gray-200 shadow-sm">
            <p className="text-gray-700">角色：<span className="font-semibold">（請串接用戶資料）</span></p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">編輯個人資料</button>
        </div>
      </div>
    </div>
  );
}
