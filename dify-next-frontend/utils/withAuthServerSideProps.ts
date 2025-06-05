import { GetServerSideProps, GetServerSidePropsContext } from 'next';

/**
 * A utility function to protect routes at the server-side rendering level.
 * This ensures pages don't momentarily show protected content before redirecting.
 */
export const withAuthServerSideProps = (
  getServerSidePropsFunc?: GetServerSideProps
) => {
  return async (context: GetServerSidePropsContext) => {
    // Get auth cookies
    const { req } = context;
    const token = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'];
    const user = req.cookies['user'];
    
    const isAuthenticated = !!token || !!user;
    
    // If not authenticated and not on a public page, redirect to login
    if (!isAuthenticated) {
      // Define public paths that don't require authentication
      const publicPaths = ['/login', '/signup', '/forgot-password'];
      const isPublicPath = publicPaths.includes(context.resolvedUrl);
      
      if (!isPublicPath) {
        return {
          redirect: {
            destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
            permanent: false,
          },
        };
      }
    }
    
    // Call the original getServerSideProps if it exists
    if (getServerSidePropsFunc) {
      return await getServerSidePropsFunc(context);
    }
    
    // Return default props
    return {
      props: {},
    };
  };
};
