import React from 'react';
import Head from 'next/head';
import Header from './Header';

const MainLayout: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <>
    <Head>
      <title>{title || 'TPV OBM測試助理'}</title>
      <meta name="description" content="TPV OBM測試助理" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  </>
);

export default MainLayout;
