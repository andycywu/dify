import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatSettings } from '../hooks/useChatSettings';
import Login from '../components/UI/Login';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useRouter } from 'next/router';

/**
 * A hook to handle authentication checks in page components
 * @param options Configuration options
 * @returns Authentication status and util functions
 */
export const useProtectedPage = (options?: {
  redirectTo?: string;
  allowUnauthenticated?: boolean;
}) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { settings, loaded } = useChatSettings();
  
  // Prepare redirect path for after login
  const handleLoginSuccess = () => {
    const redirectPath = 
      options?.redirectTo || 
      sessionStorage.getItem('redirectAfterLogin') || 
      '/test-agentic';
    
    router.push(redirectPath);
    sessionStorage.removeItem('redirectAfterLogin');
  };
  
  // Store intended path for redirect after login
  if (!isAuthenticated && !options?.allowUnauthenticated && typeof window !== 'undefined') {
    sessionStorage.setItem('redirectAfterLogin', router.asPath);
  }
  
  return {
    isAuthenticated,
    user,
    isLoading: !loaded,
    settings,
    // If not authenticated and this is a protected route, show login component
    renderLogin: () => {
      if (!isAuthenticated && !options?.allowUnauthenticated) {
        return (
          <Login
            primaryColor={settings?.primaryColor}
            customLogo={settings?.customLogo}
            onSuccess={handleLoginSuccess}
          />
        );
      }
      return null;
    },
    // Render a loading spinner
    renderLoading: (message?: string) => {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner 
            size="lg" 
            message={message || "Loading..."} 
          />
        </div>
      );
    }
  };
};

export default useProtectedPage;
