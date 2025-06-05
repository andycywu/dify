import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

const LoginForm: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [adminUsername, setAdminUsername] = useState('admin');
    const [adminPassword, setAdminPassword] = useState('dify12345');
    const router = useRouter();
    
    // Get admin credentials from environment variables
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // These must be exposed to the client through NEXT_PUBLIC_ prefix
            const envUsername = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME;
            const envPassword = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD;
            
            if (envUsername) setAdminUsername(envUsername);
            if (envPassword) setAdminPassword(envPassword);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });
        if (res?.error) {
            setError('Invalid email or password');
        } else {
            router.push('/');
        }
    };

    return (
        <div className="login-form w-full">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('login')}</h2>
            
            {/* Admin credentials hint */}
            <div className="bg-blue-50 text-blue-700 p-2 rounded mb-4 text-center text-sm">
                <p>
                    {t('default_credentials', { defaultValue: 'Default credentials' })}:<br />
                    {t('username', { defaultValue: 'Username' })}: <strong>{adminUsername}</strong><br />
                    {t('password', { defaultValue: 'Password' })}: <strong>{adminPassword}</strong>
                </p>
            </div>
            
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {t('login_error', { defaultValue: error }) || error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('username', { defaultValue: 'Username' })}
                    </label>
                    <input
                        type="text"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={adminUsername}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('password', { defaultValue: 'Password' })}
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {t('login')}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;