// ...existing code from src/pages/index.tsx...
import React from 'react';
import Head from 'next/head';
const Home: React.FC = () => {
    return (
        <>
            <Head>
                <title>TPV OBM測試助理</title>
                <meta name="description" content="Welcome to the TPV OBM測試助理 application." />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <header />
            <main className="flex-1 flex flex-col justify-center items-center min-h-[60vh]">
                <div className="text-center mb-6 md:mb-10">
                    <h1 className="text-3xl font-bold mb-4">Welcome to TPV OBM測試助理</h1>
                    <p className="text-lg mb-2">Your one-stop solution for managing test agentic and user authentication.</p>
                    <p className="text-lg mb-4">Please log in to access the system.</p>
                </div>    
            </main>
            <footer />
        </>
    );
};
export default Home;
