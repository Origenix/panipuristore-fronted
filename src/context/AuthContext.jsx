import React, { createContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                // Check if token expired
                if (decodedToken.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    const userData = JSON.parse(localStorage.getItem('user'));
                    setUser(userData);
                }
            } catch (error) {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await axios.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            const userData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        }
        return response.data;
    };

    const register = async (userData) => {
        return await axios.post('/auth/signup', userData);
    };

    const verifyOtp = async (email, otp) => {
        return await axios.post('/auth/verify-otp', { email, otp });
    };

    const googleLogin = async (token) => {
        const response = await axios.post('/auth/google', { token });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            const userData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        }
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, googleLogin, register, verifyOtp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
