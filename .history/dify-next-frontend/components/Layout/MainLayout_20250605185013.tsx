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
      <main className="flex-1 flex flex-col justify-center items-center min-h-[60vh] w-full">
        {children}
      </main>
      <footer className="w-full text-center py-4 text-gray-500 text-sm bg-white border-t">TPV OBM測試助理 © 2025</footer>
    </div>
  </>
);

export default MainLayout;
