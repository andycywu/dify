import axios from 'axios';

// Use NEXT_PUBLIC_API_URL for client-side, API_URL for server-side as a fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000/api';

export const login = async (username: string, password: string) => {
    try {
        // Check for admin credentials from env vars first
        const defaultUsername = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME || 'admin';
        const defaultPassword = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD || 'dify12345';
        
        if (username === defaultUsername && password === defaultPassword) {
            // If it's the admin user, we don't need to call the API
            localStorage.setItem('token', 'admin-token');
            return { token: 'admin-token', user: { username: defaultUsername, role: 'admin' } };
        }
        
        // Otherwise, try the API
        const response = await axios.post(`${API_URL}/login`, { username, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            return response.data;
        }
        throw new Error('Login failed');
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            throw error.response?.data?.message || 'An error occurred during login';
        }
        throw 'An error occurred during login';
    }
};

export const logout = () => {
    localStorage.removeItem('token');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export const getToken = () => {
    return localStorage.getItem('token');
};