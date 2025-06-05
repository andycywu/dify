# Authentication System Documentation

## Overview

This document describes the authentication system implemented for the Dify Next.js frontend application. The system ensures that all pages require login before access, providing a secure user experience.

## Authentication Architecture

The authentication system is implemented with multiple layers of protection:

1. **Client-side Protection**: Uses React context and hooks to check authentication status and redirect unauthenticated users.
2. **Server-side Protection**: Uses Next.js `getServerSideProps` to check authentication before rendering protected pages.
3. **Middleware Protection**: Uses Next.js middleware to intercept requests and redirect unauthenticated users.

## Key Components

### AuthContext

Located at `/src/contexts/AuthContext.tsx`, this React context provides:
- Authentication state management
- User information storage
- Login and logout functionality
- Persistent authentication via localStorage

```tsx
const { user, isAuthenticated, login, logout } = useAuth();
```

### Protected Routes

There are multiple methods to protect routes:

1. **ProtectedPage Component**: A wrapper component that checks authentication and renders either the protected content or a login form.

```tsx
<ProtectedPage>
  <YourSecureComponent />
</ProtectedPage>
```

2. **withAuth HOC**: A higher-order component that can be used to protect individual page components.

```tsx
export default withAuth(YourSecureComponent);
```

3. **withAuthServerSideProps**: A utility function that protects routes at the server-side.

```tsx
export const getServerSideProps = withAuthServerSideProps();
```

4. **Middleware**: A Next.js middleware that protects all routes at the request level.

## Protected vs Public Routes

Public routes that don't require authentication:
- `/` (homepage, shows login option)
- `/login`
- `/signup`
- `/forgot-password`

All other routes require authentication.

## Authentication Flow

1. User attempts to access a protected route
2. If not authenticated, they're redirected to the login page
3. After successful login, they're redirected to their originally requested page
4. Authentication state is persisted in localStorage

## Default Login Credentials

The system uses the following default admin credentials, which are stored in environment variables:
- Username: `admin`
- Password: `dify12345`

These can be changed by updating the .env file.

## Customization

The login form and protected routes support customization via the `useChatSettings` hook:
- Custom primary colors
- Custom logo
- Custom avatar
- Various feature toggles

## Troubleshooting

If authentication isn't working as expected, check:
1. Browser localStorage for persistent user data
2. Browser cookies for session tokens
3. Environment variables for correct admin credentials
4. Network requests for any API errors
