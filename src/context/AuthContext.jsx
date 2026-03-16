import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();
const STORAGE_KEY = 'bc-auth-session';

const formatNameFromEmail = (email) => {
    const fallbackName = 'Usuario Demo';
    if (!email) return fallbackName;

    const localPart = email.split('@')[0];
    if (!localPart) return fallbackName;

    return localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');
};

const getStoredSession = () => {
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (!storedSession) return null;

    try {
        return JSON.parse(storedSession);
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
};

const decodeJwtPayload = (token) => {
    if (!token) {
        throw new Error('No se recibió la credencial de Google.');
    }

    const base64Url = token.split('.')[1];
    if (!base64Url) {
        throw new Error('La credencial de Google no es válida.');
    }

    const normalizedBase64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = normalizedBase64.padEnd(normalizedBase64.length + ((4 - normalizedBase64.length % 4) % 4), '=');
    const jsonPayload = atob(paddedBase64);

    return JSON.parse(jsonPayload);
};

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(getStoredSession);

    const login = ({ email, password }) => {
        if (!email?.trim() || !password?.trim()) {
            throw new Error('Ingresa tu correo y tu contraseña.');
        }

        const nextSession = {
            name: formatNameFromEmail(email.trim()),
            email: email.trim().toLowerCase(),
            site: 'Sede Matriz',
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
    };

    const loginWithGoogleCredential = (credential) => {
        const payload = decodeJwtPayload(credential);

        const nextSession = {
            name: payload.name || formatNameFromEmail(payload.email),
            email: payload.email?.toLowerCase() || '',
            site: 'Google Workspace',
            provider: 'google',
            picture: payload.picture || '',
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ session, isAuthenticated: Boolean(session), login, loginWithGoogleCredential, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
