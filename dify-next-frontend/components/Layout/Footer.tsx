import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-200 text-blue-900 py-6 mt-12 border-t border-blue-200 shadow-inner">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-4">
        <div className="text-sm opacity-80">&copy; {new Date().getFullYear()} TPV OBM測試助理. {t('all_rights_reserved', 'All rights reserved.')}</div>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <Link href="/" className="hover:text-cyan-700 transition-colors">Home</Link>
          <Link href="/usage" className="hover:text-cyan-700 transition-colors">{t('chat_to_agentic')}</Link>
          <Link href="/login" className="hover:text-cyan-700 transition-colors">{t('login')}</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
