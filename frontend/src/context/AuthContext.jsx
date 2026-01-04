import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            checkUser();
        } else {
            setLoading(false);
        }
    }, []);

    const checkUser = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/me`);
            setUser(res.data);
        } catch (err) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const res = await axios.post(`${API_URL}/auth/login`, { username, password });
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try {
            if (axios.defaults.headers.common['Authorization']) {
                await axios.post(`${API_URL}/auth/logout`);
            }
        } catch (err) {
            console.error("Logout failed", err);
        } finally {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, API_URL }}>
            {children}
        </AuthContext.Provider>
    );
};
