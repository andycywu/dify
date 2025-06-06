import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import '../lib/i18n';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedPage from '../components/Auth/ProtectedPage';
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password'];
function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        {/* 不要在這裡加 Header/Footer，交由各頁 MainLayout 控制 */}
        {isPublicRoute ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedPage>
            <Component {...pageProps} />
          </ProtectedPage>
        )}
      </AuthProvider>
    </SessionProvider>
  );
}
export default MyApp;
