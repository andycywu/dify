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
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl grid gap-6 md:grid-cols-2">
                        <div className="p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                            <h2 className="text-xl font-bold mb-2">個人資料</h2>
                            <p className="text-gray-600 mb-4">查看與編輯您的個人資訊</p>
                            <a href="/profile" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">前往</a>
                        </div>
                        <div className="p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                            <h2 className="text-xl font-bold mb-2">設定</h2>
                            <p className="text-gray-600 mb-4">調整系統或個人偏好</p>
                            <a href="/settings" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">前往</a>
                        </div>
                        <div className="p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                            <h2 className="text-xl font-bold mb-2">對話機器人</h2>
                            <p className="text-gray-600 mb-4">啟動 AI 助理對話</p>
                            <a href="/test-agentic" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">前往</a>
                        </div>
                        <div className="p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                            <h2 className="text-xl font-bold mb-2">用量/報表</h2>
                            <p className="text-gray-600 mb-4">查看 API 用量與統計</p>
                            <a href="/usage" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">前往</a>
                        </div>
                    </div>
                </div>    
            </main>
            <footer />
        </>
    );
};

export default Home;
