import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    const clearError = () => setError(null);

    const handleError = (error, customMsg) => {
        console.error(customMsg, error);
        if (error.code === 'ERR_NETWORK') {
            setError('Network error: Backend server is unreachable.');
        } else if (error.response?.status === 401) {
            setError('Unauthorized: Please login again.');
        } else {
            const data = error.response?.data;
            const errorMsg = data?.error || data?.message || (typeof data === 'object' ? Object.values(data).join(', ') : customMsg);
            setError(errorMsg);
        }
        setTimeout(clearError, 5000);
    };

    const fetchCart = async () => {
        if (!user || user.role !== 'ROLE_CUSTOMER') return;
        try {
            setLoading(true);
            const res = await axios.get('/cart');
            setCart(res.data);
            setError(null);
        } catch (error) {
            handleError(error, 'Failed to fetch cart');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    const addToCart = async (menuItemId, quantity) => {
        try {
            const res = await axios.post('/cart/add', { menuItemId, quantity });
            setCart(res.data);
            setError(null);
            return true;
        } catch (error) {
            handleError(error, 'Failed to add to cart');
            throw error;
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            const res = await axios.put(`/cart/update/${itemId}?quantity=${quantity}`);
            setCart(res.data);
            setError(null);
        } catch (error) {
            handleError(error, 'Failed to update quantity');
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            const res = await axios.delete(`/cart/remove/${itemId}`);
            setCart(res.data);
            setError(null);
        } catch (error) {
            handleError(error, 'Failed to remove from cart');
        }
    };

    const clearCart = async () => {
        try {
            await axios.delete('/cart/clear');
            setCart(null);
            setError(null);
            fetchCart();
        } catch (error) {
            handleError(error, 'Failed to clear cart');
        }
    };

    return (
        <CartContext.Provider value={{ cart, loading, error, clearError, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
