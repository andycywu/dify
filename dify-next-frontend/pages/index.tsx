import React from 'react';
import Head from 'next/head';
import MainLayout from '../components/Layout/MainLayout';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
    const { t } = useTranslation('auth');
    
    return (
        <MainLayout title={t('home.title') as string}>
            <div className="text-center mb-6 md:mb-10">
                <h1 className="text-3xl font-bold mb-4">{t('home.welcome')}</h1>
                <p className="text-lg mb-2">{t('home.description')}</p>
                <p className="text-lg mb-4">{t('home.login_prompt')}</p>
            </div>
        </MainLayout>
    );
};

export default Home;
