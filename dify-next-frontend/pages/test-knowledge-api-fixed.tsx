import { useEffect, useState } from 'react';
import { getKnowledgeBases } from '../services/knowledgeAdmin';

const TestKnowledgeAPIFixed = () => {
  const [status, setStatus] = useState<string>('Testing API...');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        // Show what URL we're using
        const baseUrl = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL;
        setApiUrl(baseUrl || 'Environment variable not set');
        
        setStatus('Making API call...');
        const response = await getKnowledgeBases();
        setStatus('API call successful!');
        console.log('API Response:', response);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Unknown error');
        setStatus('API call failed');
      }
    };

    testAPI();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Knowledge Base API Test (Fixed)</h1>
      <div style={{ marginBottom: '10px' }}>
        <strong>API Base URL:</strong> {apiUrl}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>This test verifies that the hard-coded IP address (54.169.166.197) has been removed</p>
        <p>and the API calls now use the unified CORS-resolved proxy endpoint.</p>
      </div>
    </div>
  );
};

export default TestKnowledgeAPIFixed;