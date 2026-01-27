// src/auth/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiBaseUrl } from "../api/client";

type User = { username: string; email?: string; password?: string } | null;

type AuthContextType = {
    token: string | null;
    user: User;
    loading: boolean;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    const AUTH_URL = `${getApiBaseUrl()}/api/auth/login`;

    // Load authentication state on startup
    useEffect(() => {
        const loadAuthState = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('auth_token');
                const storedUser = await AsyncStorage.getItem('auth_user');
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Error loading auth state:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAuthState();
    }, []);

    const signIn = async (username: string, password: string) => {
        try {
            const res = await axios.post(AUTH_URL, { username, password });
            const data = res.data;
            const userData = {
                username: data.user,
                email: data.email
            };

            setUser(userData);
            setToken(data.token || data.accessToken);

            await AsyncStorage.setItem('auth_token', data.token || data.accessToken);
            await AsyncStorage.setItem('auth_user', JSON.stringify(userData));


        } catch (error: any) {
            console.error("login fail:", error.response?.data || error.message);
            throw error;
        }
    };

    const signOut = async () => {
        try {

            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('auth_user');

            setToken(null);
            setUser(null);
            console.log("Logout successful");
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return <AuthContext.Provider value={{ token, user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}