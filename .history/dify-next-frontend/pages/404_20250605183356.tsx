// ...existing code from src/pages/404.tsx...
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-2xl text-gray-600 mb-6">Page not found</p>
          <p className="mb-8 text-gray-500">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <button
            onClick={() => router.push(isAuthenticated ? '/test-agentic' : '/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to {isAuthenticated ? 'Dashboard' : 'Home'}
          </button>
        </div>
      </div>
    </>
  );
};
export default NotFoundPage;
