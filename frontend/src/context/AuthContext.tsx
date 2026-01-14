import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface User {
    sub: string;
    role?: string;
    tenant_id?: number;
    exp?: number;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on load
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<User>(token);
                // Check expiration
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                }
            } catch (error) {
                console.error('Invalid token', error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        // Note: Backend expects form-data for OAuth2 usually, but here checking implementation plan
        // If backend uses standard OAuth2 PasswordBearer, it expects form-data.
        // If it uses a JSON endpoint, generic JSON is fine.
        // Based on previous context (test_auth.py), it uses standard OAuth2 (form-data).

        // Let's verify backend implementation via 'auth.py' or 'main.py' if needed.
        // Assuming JSON for 'custom' login or Form Data for OAuth2.
        // Standard FastAPI OAuth2PasswordRequestForm expects form-data.

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' // axios usually handles FormData automatically but let's be explicit if needed
            }
        });

        const { access_token } = response.data;
        localStorage.setItem('token', access_token);

        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
