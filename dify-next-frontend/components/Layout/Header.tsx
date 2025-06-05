import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="w-full bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-200 shadow-md py-4 px-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-extrabold text-blue-900 tracking-wide drop-shadow">
            TPV <span className="text-blue-900">OBM測試助理</span>
          </Link>
        </div>
        {/* Always show menu, not hidden */}
        <nav className="flex gap-6">
          <Link href="/dashboard" className="text-blue-900 font-medium hover:text-cyan-700 transition-colors duration-200">
            {t('dashboard')}
          </Link>
          <Link href="/test-agentic" className="text-blue-900 font-medium hover:text-cyan-700 transition-colors duration-200">
            {t('chat_to_agentic')}
          </Link>


          {session?.user ? (
            <div className="relative inline-block" ref={dropdownRef}>
              <button
                className="text-blue-900 font-medium hover:text-cyan-700 transition-colors duration-200 flex items-center gap-1"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                {session.user.name || session.user.email || 'User'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 z-10 w-48 mt-2 bg-white rounded shadow-lg animate-fade-in">
                  {(session.user.role === 'admin' || session.user.role === 'super admin') && (
                    <Link href="/admin" className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">
                      {t('user_admin') || '管理頁面'}
                    </Link>
                  )}
                  <Link href="/usage" className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">
                    {t('usage')}
                  </Link>

                  <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-blue-900 font-medium hover:text-cyan-700 transition-colors duration-200">
              {t('login')}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => i18n.changeLanguage('en')} className="px-2 py-1 rounded bg-white text-blue-900 border border-blue-300 hover:bg-blue-100 transition font-semibold">EN</button>
          <button onClick={() => i18n.changeLanguage('zh')} className="px-2 py-1 rounded bg-white text-blue-900 border border-blue-300 hover:bg-blue-100 transition font-semibold">中文</button>
        </div>
      </div>
    </header>
  );
};

export default Header;