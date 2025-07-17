import React from 'react';
import ChatComponent from '../components/UI/ChatComponent';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/Layout/MainLayout';

export default function TestAgentic() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY;
  const apiBaseUrl = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL;

  if (authLoading) {
    return (
      <MainLayout title="對話機器人">
        <div className="flex items-center justify-center h-full">載入中...</div>
      </MainLayout>
    );
  }
  if (!isAuthenticated) {
    return (
      <MainLayout title="對話機器人">
        <div className="flex items-center justify-center h-full">請先登入以使用智能機器人對話匡</div>
      </MainLayout>
    );
  }

  // Check if required environment variables are available
  if (!apiKey || !apiBaseUrl) {
    return (
      <MainLayout title="對話機器人">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 mb-2">設定錯誤</p>
            <p className="text-gray-600">請檢查環境變數設定</p>
            {!apiKey && <p className="text-sm text-gray-500">缺少 NEXT_PUBLIC_DIFY_API_KEY</p>}
            {!apiBaseUrl && <p className="text-sm text-gray-500">缺少 NEXT_PUBLIC_DIFY_API_BASE_URL</p>}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="對話機器人">
      <div className="flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-2xl">
          <ChatComponent
            apiKey={apiKey as string}
            apiBaseUrl={apiBaseUrl as string}
            avatarSrc="/images/assistant-avatar.png"
            welcomeMessage="您好！這裡是智能機器人，請問有什麼可以幫您？"
            enableVoice={true}
            enableHistory={true}
            primaryColor="#3B82F6"
          />
        </div>
      </div>
    </MainLayout>
  );
}
