import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 只用 NextAuth session
  const { data: session, status } = useSession();
  const user = session?.user
    ? {
        id: (session.user as any).id || 'no-id', // 用 id（UUID），若無則 fallback
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user as any).role || 'user',
      }
    : null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login: async () => { throw new Error('Use NextAuth only'); }, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};
