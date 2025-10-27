import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../components/Layout/MainLayout';

export default function AdminUsers() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到新的統一管理介面
    router.replace('/admin');
  }, [router]);

  return (
    <MainLayout title="重定向中...">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">重定向中...</h2>
            <p className="text-gray-600">
              用戶管理功能已整合到統一管理介面，正在為您跳轉...
            </p>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm">
                <strong>注意：</strong> 現在統一使用 Wiki.js 進行用戶管理。
                所有用戶管理功能都已移至系統管理中心。
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
