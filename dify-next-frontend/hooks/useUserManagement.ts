import { useEffect, useState } from 'react';
import { useAuth } from 'contexts/AuthContext';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export function useUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/user');
      setUsers(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: Partial<User> & { password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/user', data);
      await fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
    setLoading(true);
    setError(null);
    try {
      await axios.put(`/api/user/${id}`, data);
      await fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/user/${id}`);
      await fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super admin')) {
      fetchUsers();
    }
  }, [user]);

  return { users, loading, error, fetchUsers, createUser, updateUser, deleteUser };
}
