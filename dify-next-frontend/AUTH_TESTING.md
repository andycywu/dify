# Testing the Authentication System

This document provides step-by-step instructions for testing the authentication system in the Dify Next.js frontend.

## Prerequisites

1. Ensure the application is running locally or deployed
2. Have the default credentials ready (`admin` / `dify12345`)
3. Clear your browser cache and cookies before testing

## Test Cases

### 1. Basic Authentication Flow

**Steps:**
1. Open your browser in a fresh session (incognito/private mode recommended)
2. Navigate to any protected page (e.g., `/test-agentic` or `/dashboard`)
3. Verify you are redirected to the login page
4. Enter invalid credentials and verify error message
5. Enter valid credentials (`admin` / `dify12345`)
6. Verify you are redirected back to the originally requested page

**Expected Results:**
- Unauthenticated access attempts should redirect to login
- Invalid login attempts should show error message
- Successful login should redirect to original destination

### 2. Session Persistence

**Steps:**
1. Log in with valid credentials
2. Navigate through several pages
3. Refresh the browser
4. Close the browser and reopen to the same URL

**Expected Results:**
- After refresh, you should remain logged in
- After reopening the browser, you should remain logged in (if localStorage is preserved)

### 3. Protected Routes

**Steps:**
1. While logged out, try accessing:
   - `/dashboard`
   - `/test-agentic`
   - `/usage`
2. Log in and verify access

**Expected Results:**
- All attempts should redirect to login while logged out
- All pages should be accessible after login

### 4. Navigation and UI

**Steps:**
1. Log in and examine the header navigation
2. Click on each navigation item
3. Test the user dropdown menu
4. Verify all links work correctly

**Expected Results:**
- Header should show authenticated navigation options
- User dropdown should contain logout option
- All links should navigate to correct pages

### 5. Logout Flow

**Steps:**
1. Log in and navigate to any page
2. Click the logout option in the user dropdown menu
3. Verify redirect to logout page with animation
4. Verify automatic redirect to login page after logout
5. Try to access a protected page after logout

**Expected Results:**
- Logout page should show briefly with animation
- After logout, you should be redirected to login
- Protected routes should again require authentication

### 6. Dashboard Features

**Steps:**
1. Log in and navigate to the dashboard
2. Test all dashboard links
3. Verify each section works as expected

**Expected Results:**
- Dashboard should show user information
- All links should navigate to correct locations
- All features should be accessible

### 7. Edge Cases

**Steps:**
1. Test URLs with query parameters (e.g., `/test-agentic?settings=true`)
2. Test direct access to the logout page while not authenticated
3. Try to access the login page while already authenticated

**Expected Results:**
- Query parameters should be preserved after authentication
- Unauthenticated access to logout should redirect appropriately
- Authenticated access to login should redirect to dashboard

### Troubleshooting

If authentication issues are encountered:

1. Check browser console for errors
2. Verify localStorage contents
3. Ensure cookies are not being blocked
4. Check that environment variables are properly set
5. Use the `/debug-auth` page for detailed authentication diagnostics

## Reporting Issues

When reporting authentication issues, please include:

1. Browser and version
2. Steps to reproduce the issue
3. Expected vs. actual behavior
4. Screenshots or console logs
5. Any error messages displayed
