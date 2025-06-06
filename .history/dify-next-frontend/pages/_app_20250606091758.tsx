// ...existing code from src/pages/_app.tsx...
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import '../lib/i18n';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedPage from '../components/Auth/ProtectedPage';
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password'];
function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 bg-gray-100">
            {isPublicRoute ? (
              <Component {...pageProps} />
            ) : (
              <ProtectedPage>
                <Component {...pageProps} />
              </ProtectedPage>
            )}
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </SessionProvider>
  );
}
export default MyApp;
