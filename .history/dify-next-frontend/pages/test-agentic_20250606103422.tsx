import React from 'react';
import ChatComponent from '../components/UI/ChatComponent';
import { useAuth } from '../contexts/AuthContext';

export default function TestAgentic() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  // 這裡可根據實際情況調整 API Key 與 Base URL 來源
  const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY || '';
  const apiBaseUrl = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://localhost/v1';

  // 若未登入可顯示登入提示
  if (authLoading) {
    return <div className="flex items-center justify-center h-full">載入中...</div>;
  }
  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-full">請先登入以使用智能機器人對話匡</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl">
        <ChatComponent
          apiKey={apiKey}
          apiBaseUrl={apiBaseUrl}
          avatarSrc="/images/assistant-avatar.png"
          welcomeMessage="您好！這裡是智能機器人，請問有什麼可以幫您？"
          enableVoice={true}
          enableHistory={true}
          primaryColor="#3B82F6"
        />
      </div>
    </div>
  );
}
