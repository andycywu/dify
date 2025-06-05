// This file exports TypeScript interfaces and types used throughout the application.

export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}

export interface UsageCost {
    service: string;
    cost: number;
    date: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}