import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * This component helps to debug authentication issues by displaying
 * environment variables and session state.
 */
const AuthDebug: React.FC = () => {
  const { data: session, status } = useSession();
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState<any>(null);
  
  useEffect(() => {
    // Get values from environment variables
    setAdminUsername(process.env.NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME || 'Not set');
    setAdminPassword(process.env.NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD ? '(Set but hidden)' : 'Not set');
    
    // Check local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setLocalUser(JSON.parse(storedUser));
      } catch (e) {
        setLocalUser({ error: 'Invalid JSON' });
      }
    }
  }, []);
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50 max-w-lg mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Authentication Debug Info</h2>
      
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Environment Variables:</h3>
        <div className="bg-white p-3 rounded border">
          <p><strong>NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME:</strong> {adminUsername}</p>
          <p><strong>NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD:</strong> {adminPassword}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">NextAuth Session:</h3>
        <div className="bg-white p-3 rounded border">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>User:</strong> {session?.user?.name || 'Not logged in'}</p>
          <p><strong>Email:</strong> {session?.user?.email || 'N/A'}</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">LocalStorage User:</h3>
        <div className="bg-white p-3 rounded border">
          <p><strong>Status:</strong> {localUser ? 'Found' : 'Not found'}</p>
          {localUser && (
            <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(localUser, null, 2)}
            </pre>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-500 mt-4">
        <p>
          This component displays information that can help debug authentication issues.
          If environment variables aren't showing correctly, make sure they're properly
          defined in your .env file with the NEXT_PUBLIC_ prefix.
        </p>
      </div>
    </div>
  );
};

export default AuthDebug;
