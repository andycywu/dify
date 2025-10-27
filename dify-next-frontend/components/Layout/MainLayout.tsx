import React from 'react';
import Head from 'next/head';

const MainLayout: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <>
    <Head>
      <title>{title || 'TPV OBM測試助理'}</title>
      <meta name="description" content="TPV OBM測試助理" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className="container mx-auto px-4 py-8 flex justify-center">
      {children}
    </div>
  </>
);

export default MainLayout;
