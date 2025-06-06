import React from 'react';
import Head from 'next/head';
import MainLayout from '../components/Layout/MainLayout';

const Home: React.FC = () => {
    return (
        <MainLayout title="TPV OBM測試助理">
            <div className="text-center mb-6 md:mb-10">
                <h1 className="text-3xl font-bold mb-4">Welcome to TPV OBM測試助理</h1>
                <p className="text-lg mb-2">Your one-stop solution for managing test agentic and user authentication.</p>
                <p className="text-lg mb-4">Please log in to access the system.</p>
            </div>
        </MainLayout>
    );
};

export default Home;
