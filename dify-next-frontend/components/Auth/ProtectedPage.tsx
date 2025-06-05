import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Login from '../UI/Login';
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
    }
    
    return (
      <Login
        primaryColor={settings.primaryColor}
        customLogo={settings.customLogo}
        onSuccess={() => {
          const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
          router.push(redirectPath);
          sessionStorage.removeItem('redirectAfterLogin');
        }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
