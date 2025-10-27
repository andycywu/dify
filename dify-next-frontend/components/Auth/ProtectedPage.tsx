import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSettings } from '../../hooks/useChatSettings';

interface ProtectedPageProps {
  children: React.ReactNode;
  loginRedirect?: string;
  allowUnauthenticated?: boolean;
}

const ProtectedPage: React.FC<ProtectedPageProps> = ({
  children,
  loginRedirect = '/login',
  allowUnauthenticated = false
}) => {
  const { isAuthenticated } = useAuth();
  const { settings, loaded } = useChatSettings();
  const router = useRouter();

  // Show loading state while settings are being loaded
  if (!loaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Check if authentication is required and user is not authenticated
  if (!allowUnauthenticated && !isAuthenticated) {
    // Save the current path for redirect after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', router.asPath);
      // Redirect to login page instead of showing inline login form
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
    }

    // Show loading state while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">重定向到登入頁面...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
