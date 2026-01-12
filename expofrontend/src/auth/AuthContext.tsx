// src/auth/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";
import axios from "axios";

import { getApiBaseUrl } from "../api/client";

type User = { username: string; email: string; password: string } | null;

type AuthContextType = {
    token: string | null;
    user: User;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User>(null);

    const AUTH_URL = `${getApiBaseUrl()}/api/auth/login`;

    const signIn = async (username: string, password: string) => {
        const res = await axios.post(AUTH_URL, { username, password }, { timeout: 6000 });
        const data = res.data;
        if (!data || !data.token) throw new Error("Invalid server response");
        setToken(data.token);
        setUser(data.user);
    };

    const signOut = () => {
        setToken(null);
        setUser(null);
    };

    return <AuthContext.Provider value={{ token, user, signIn, signOut }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}