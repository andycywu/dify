import { useEffect, useState } from 'react';
import { useAuth } from 'contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @deprecated 用戶管理功能已整合至 Wiki.js 系統
 * 請使用 Wiki.js 管理介面進行用戶管理
 */
export function useUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('用戶管理功能已整合至 Wiki.js 系統，請前往 Wiki.js 進行用戶管理');

  const fetchUsers = async () => {
    setLoading(true);
    setError('用戶管理功能已整合至 Wiki.js 系統，請前往 Wiki.js 進行用戶管理');
    setLoading(false);
  };

  const createUser = async (data: Partial<User> & { password: string }) => {
    setLoading(true);
    setError('用戶創建功能已整合至 Wiki.js 系統，請前往 Wiki.js 進行用戶管理');
    setLoading(false);
    throw new Error('用戶創建功能已整合至 Wiki.js 系統');
  };

  const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
    setLoading(true);
    setError('用戶更新功能已整合至 Wiki.js 系統，請前往 Wiki.js 進行用戶管理');
    setLoading(false);
    throw new Error('用戶更新功能已整合至 Wiki.js 系統');
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    setError('用戶刪除功能已整合至 Wiki.js 系統，請前往 Wiki.js 進行用戶管理');
    setLoading(false);
    throw new Error('用戶刪除功能已整合至 Wiki.js 系統');
  };

  const openWikiAdmin = () => {
    const wikiUrl = process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3000';
    window.open(`${wikiUrl}/admin`, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super admin')) {
      // 不再自動載入用戶數據
      setError('用戶管理功能已整合至 Wiki.js 系統，請前往 Wiki.js 進行用戶管理');
    }
  }, [user]);

  return { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    openWikiAdmin,
    deprecated: true 
  };
}
