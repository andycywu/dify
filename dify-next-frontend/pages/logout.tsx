import React, { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push('/login');
    });
  }, [router]);
  return <div className="flex items-center justify-center min-h-screen">登出中...</div>;
}
