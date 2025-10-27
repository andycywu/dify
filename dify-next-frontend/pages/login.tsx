import React from 'react';
import Login from '../components/UI/Login';
import MainLayout from '../components/Layout/MainLayout';

export default function LoginPage() {
  return (
    <MainLayout title="登入">
      <Login />
    </MainLayout>
  );
}
