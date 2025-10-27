import React, { useState } from 'react';
import Link from 'next/link';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';

const TestKnowledgeAPI: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAPITest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-knowledge-api');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        error: true,
        message: 'Failed to test API',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Knowledge Base API Test">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Knowledge Base API Test
            </h1>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Current User
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                {user ? (
                  <div>
                    <p><span className="font-medium">Name:</span> {user.name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {user.email || 'N/A'}</p>
                    <p><span className="font-medium">Role:</span> {user.role || 'N/A'}</p>
                    <p><span className="font-medium">Admin Access:</span> {
                      ['admin', 'owner'].includes(user.role) ? '✅ Yes' : '❌ No'
                    }</p>
                  </div>
                ) : (
                  <p className="text-red-600">No user logged in</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Environment Configuration
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><span className="font-medium">API Key:</span> {
                  process.env.NEXT_PUBLIC_ADMIN_API_KEY ?
                  `${process.env.NEXT_PUBLIC_ADMIN_API_KEY.substring(0, 10)}...` :
                  '❌ Not configured'
                }</p>
                <p><span className="font-medium">Base URL:</span> {
                  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || '❌ Not configured'
                }</p>
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={runAPITest}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test API Connection'}
              </button>
            </div>

            {testResult && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Test Result
                </h2>
                <div className={`p-4 rounded-lg ${
                  testResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                }`}>
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Navigation Links
              </h2>
              <div className="space-y-2">
                {user && ['admin', 'owner'].includes(user.role) ? (
                  <Link
                    href="/knowledge-management"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Go to Knowledge Management
                  </Link>
                ) : (
                  <p className="text-gray-600">
                    Admin access required to access Knowledge Management
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TestKnowledgeAPI;
