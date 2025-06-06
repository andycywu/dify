import React from 'react';
import Head from 'next/head';

const MainLayout: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <>
    <Head>
      <title>{title || 'TPV OBM測試助理'}</title>
      <meta name="description" content="TPV OBM測試助理" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className="flex flex-col bg-gray-100">
      <main className="flex-1 flex flex-col justify-center items-center w-full p-6">
        {children}
      </main>
    </div>
  </>
);

export default MainLayout;
