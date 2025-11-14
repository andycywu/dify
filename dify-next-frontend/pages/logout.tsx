import React, { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Logout() {
  const router = useRouter();
  const { status } = useSession();
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Logout page: session status:', status);
        
        if (status === 'loading') {
          // 等待 session 載入完成
          return;
        }
        
        const wikiUrl = process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3002';
        
        if (status === 'unauthenticated') {
          // 已經登出，重定向到 Wiki.js
          console.log('Already unauthenticated, redirecting to Wiki.js');
          window.location.href = wikiUrl;
          return;
        }
        
        if (status === 'authenticated') {
          // 需要登出
          console.log('Performing signOut');
          await signOut({ 
            redirect: false // 不讓 NextAuth 處理重導向
          });
          
          // 手動重導向到 Wiki.js
          console.log('SignOut completed, redirecting to Wiki.js');
          window.location.href = wikiUrl;
        }
      } catch (error) {
        console.error('Logout error:', error);
        // 出錯時也跳轉到 Wiki.js
        const wikiUrl = process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3002';
        window.location.href = wikiUrl;
      }
    };
    
    performLogout();
  }, [status, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">登出中，即將返回 Wiki.js...</p>
      </div>
    </div>
  );
}
