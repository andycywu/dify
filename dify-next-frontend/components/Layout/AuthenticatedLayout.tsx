import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

/**
 * This layout is used for pages that should only be accessible to authenticated users.
 * It applies common styling and behavior for authenticated pages.
 */
const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <div className="authenticated-layout bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Main content */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
