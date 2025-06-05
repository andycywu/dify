import React, { useState } from 'react';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUserManagement();
  const { user } = useAuth();
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user' });
  const [editId, setEditId] = useState<string | null>(null);

  if (!user || (user.role !== 'admin' && user.role !== 'super admin')) {
    return <div className="p-4 text-red-500">No permission.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">User Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form
        className="mb-4 flex flex-col gap-2"
        onSubmit={async e => {
          e.preventDefault();
          if (editId) {
            await updateUser(editId, form);
            setEditId(null);
          } else {
            await createUser(form);
          }
          setForm({ email: '', name: '', password: '', role: 'user' });
        }}
      >
        <input
          className="border p-2 rounded"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />
        <input
          className="border p-2 rounded"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="border p-2 rounded"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required={!editId}
        />
        <select
          className="border p-2 rounded"
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="super admin">super admin</option>
        </select>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
          type="submit"
          disabled={loading}
        >
          {editId ? 'Update User' : 'Create User'}
        </button>
        {editId && (
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded mt-2"
            type="button"
            onClick={() => {
              setEditId(null);
              setForm({ email: '', name: '', password: '', role: 'user' });
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">{u.name}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border flex gap-2">
                <button
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                  onClick={() => {
                    setEditId(u.id);
                    setForm({ email: u.email, name: u.name || '', password: '', role: u.role });
                  }}
                >
                  Edit
                </button>
                <button
                  className="bg-red-600 text-white px-2 py-1 rounded"
                  onClick={() => deleteUser(u.id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
