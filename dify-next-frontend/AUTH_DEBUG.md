# Authentication Debug Guide for TPV OBM Test Assistant

This guide contains information to help debug authentication issues in the TPV OBM Test Assistant.

## Common Authentication Issues

### 401 Unauthorized Errors

If you're seeing a 401 Unauthorized error when trying to log in, it could be due to:

1. **Incorrect Credentials**: Make sure you're using the correct admin username and password.
   - Default username: `admin`  
   - Default password: `dify12345`

2. **NextAuth Configuration**: The application uses NextAuth.js for authentication, which requires a proper setup.

3. **Environment Variable Issues**: Make sure the environment variables are correctly set and accessible.

## Fixing the Authentication

We've implemented a multi-layer authentication approach:

1. First, try logging in with NextAuth.js
2. If that fails, try our custom authentication context
3. As a final fallback, try direct API login

## Implementation Details

- **NextAuth Configuration**: Located at `/src/pages/api/auth/[...nextauth].ts`
- **Custom Auth Context**: Located at `/src/contexts/AuthContext.tsx`
- **API Authentication**: Located at `/src/utils/auth.ts`

## Test Login Process

1. Go to the login page (`/login` or `/test-agentic`)
2. Enter the username `admin` and password `dify12345`
3. Click the "Login" button

## Troubleshooting Steps

1. Check browser console for errors
2. Verify environment variables are correctly set
3. Try clearing localStorage and browser cookies
4. Restart the development server

## Authentication Flow Diagram

```
Login Form
    │
    ▼
┌─────────────────┐
│  Try NextAuth   │
└─────────────────┘
    │     │
 Success  Fail
    │     │
    │     ▼
    │  ┌─────────────────┐
    │  │ Try AuthContext │
    │  └─────────────────┘
    │     │     │
    │  Success  Fail
    │     │     │
    │     │     ▼
    │     │  ┌─────────────────┐
    │     │  │   Try API Auth  │
    │     │  └─────────────────┘
    │     │     │     │
    │     │  Success  Fail
    │     │     │     │
    ▼     ▼     ▼     ▼
┌─────────────┐   ┌─────────────┐
│    Login    │   │    Show     │
│  Successful │   │    Error    │
└─────────────┘   └─────────────┘
```

## Testing Steps

If you need to debug the authentication flow, try adding console.log statements at key points in the login process:

```tsx
// In your Login component:
console.log('Starting login with credentials:', { username: email });
const result = await signIn('credentials', {
  email: email,
  password: password,
  redirect: false,
});
console.log('NextAuth result:', result);
```
