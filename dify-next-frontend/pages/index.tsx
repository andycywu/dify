import React from 'react';
import Head from 'next/head';
import MainLayout from '../components/Layout/MainLayout';
import { useTranslation } from '../lib/mockTranslation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Home: React.FC = () => {
    const { t } = useTranslation('auth');
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <MainLayout title={t('home.title') as string}>
                <div className="text-center">載入中...</div>
            </MainLayout>
        );
    }

    // 如果是管理員且來自 ?admin=true 參數，顯示管理中心導航
    const showAdminPanel = user && user.role === 'admin' && router.query.admin === 'true';

    if (showAdminPanel) {
        return (
            <MainLayout title="TPV OBM 測試助手 - 管理中心">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold mb-4">🎛️ 管理中心</h1>
                        <p className="text-lg text-gray-600 mb-2">歡迎回來，管理員 {user.name || user.email}</p>
                        <p className="text-sm text-gray-500">管理系統配置與監控使用統計</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 使用統計 */}
                        <Link href="/usage" className="block">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 cursor-pointer">
                                <div className="text-4xl mb-4">📊</div>
                                <h2 className="text-xl font-bold mb-2 text-blue-900">使用統計與報表</h2>
                                <p className="text-gray-700">查看 Token 使用量、費用統計和用戶活躍度</p>
                            </div>
                        </Link>

                        {/* REST to SOAP 管理 */}
                        <Link href="/Administrator" className="block">
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 cursor-pointer">
                                <div className="text-4xl mb-4">🔄</div>
                                <h2 className="text-xl font-bold mb-2 text-purple-900">REST to SOAP 管理</h2>
                                <p className="text-gray-700">管理 API 轉換服務與端點配置</p>
                            </div>
                        </Link>

                        {/* 用戶管理 */}
                        <Link href="/Administrator-users" className="block">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-400 cursor-pointer">
                                <div className="text-4xl mb-4">👥</div>
                                <h2 className="text-xl font-bold mb-2 text-green-900">用戶管理</h2>
                                <p className="text-gray-700">管理用戶帳號、權限和組別</p>
                            </div>
                        </Link>

                        {/* 知識庫管理 */}
                        <Link href="/knowledge-management" className="block">
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-amber-200 hover:border-amber-400 cursor-pointer">
                                <div className="text-4xl mb-4">📚</div>
                                <h2 className="text-xl font-bold mb-2 text-amber-900">知識庫管理</h2>
                                <p className="text-gray-700">Wiki-Dify Auto Sync 與知識庫同步</p>
                            </div>
                        </Link>

                        {/* 系統設定 */}
                        <Link href="/settings" className="block">
                            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-rose-200 hover:border-rose-400 cursor-pointer">
                                <div className="text-4xl mb-4">⚙️</div>
                                <h2 className="text-xl font-bold mb-2 text-rose-900">系統設定</h2>
                                <p className="text-gray-700">配置系統參數與整合設定</p>
                            </div>
                        </Link>

                        {/* Wiki.js 入口 */}
                        <a
                            href={process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3002'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-indigo-200 hover:border-indigo-400 cursor-pointer">
                                <div className="text-4xl mb-4">📖</div>
                                <h2 className="text-xl font-bold mb-2 text-indigo-900">Wiki.js 知識庫</h2>
                                <p className="text-gray-700">前往 Wiki.js 查看和編輯知識庫內容</p>
                                <div className="mt-2 text-xs text-indigo-600">↗ 在新視窗開啟</div>
                            </div>
                        </a>

                        {/* Wiki-Dify Auto Sync */}
                        <Link href="http://localhost:5050" className="block">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-400 cursor-pointer">
                                <div className="text-4xl mb-4">📂</div>
                                <h2 className="text-xl font-bold mb-2 text-green-900">Wiki-Dify Auto Sync</h2>
                                <p className="text-sm text-gray-600">批量導入文檔到 Wiki.js</p>
                            </div>
                        </Link>
                    </div>

                    <div className="mt-10 bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">💡 快速提示</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li>• 一般用戶訪問此系統時會自動重定向到 Wiki.js</li>
                            <li>• Wiki.js 是員工的主要工作入口，提供知識查詢和聊天機器人</li>
                            <li>• 此管理面板僅供管理員使用</li>
                        </ul>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // 如果不是管理員（理論上不會執行到這裡，因為 middleware 會重定向）
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
