import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Login from '../UI/Login';
import { useChatSettings } from '../../hooks/useChatSettings';

// Define list of public routes that don't need authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

// Higher-order component for authentication
const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string; // Custom redirect path if needed
    allowUnauthenticated?: boolean; // To allow certain pages to be seen without login
  }
) => {
  const AuthenticatedComponent: React.FC<P> = (props: P) => {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const { settings, loaded } = useChatSettings();
    
    // Check if current path is in public routes
    const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
    
    useEffect(() => {
      if (!loaded) return;
      
      // If not authenticated and not a public route, redirect to login
      if (!isAuthenticated && !isPublicRoute && !options?.allowUnauthenticated) {
        // Store the intended url in session storage for redirect after login
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', router.asPath);
        }
      }
    }, [isAuthenticated, router, loaded, isPublicRoute]);

    // While settings are loading, show a loading screen
    if (!loaded) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If not authenticated and this is a protected route, show login
    if (!isAuthenticated && !isPublicRoute && !options?.allowUnauthenticated) {
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

    // If authenticated and trying to access login page, redirect to dashboard
    if (isAuthenticated && isPublicRoute && !options?.allowUnauthenticated) {
      router.push('/test-agentic');
      return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
    }

    // Otherwise, render the protected component
    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
