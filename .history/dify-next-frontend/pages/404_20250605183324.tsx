import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';

const NotFoundPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Head>
        <title>Page Not Found - TPV OBM測試助理</title>
        <meta name="description" content="Page not found" />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-5xl font-bold text-red-500 mb-4">404</h1>
          <p className="text-xl text-gray-700 mb-6">找不到頁面</p>
          <a
            onClick={() => router.push(isAuthenticated ? '/test-agentic' : '/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          >
            {isAuthenticated ? '回到儀表板' : '回到首頁'}
          </a>
        </div>
      </div>
    </>
  );
};
export default NotFoundPage;
