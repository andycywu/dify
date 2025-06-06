import React from 'react';
import MainLayout from '../components/Layout/MainLayout';

export default function AdminUsers() {
  return (
    <MainLayout title="用戶管理">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">用戶管理</h2>
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 rounded p-4 shadow flex flex-col items-center">
              <span className="text-3xl mb-2">🧑‍💼</span>
              <div className="font-semibold mb-1">用戶列表</div>
              <div className="text-gray-700">（這裡顯示所有用戶，未來可編輯/刪除/新增）</div>
            </div>
            <div className="bg-red-50 rounded p-4 shadow flex flex-col items-center">
              <span className="text-3xl mb-2">➕</span>
              <div className="font-semibold mb-1">新增用戶</div>
              <div className="text-gray-700">（這裡可新增新用戶）</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
