import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Home, Utensils, User, Store } from 'lucide-react';

const BottomNav = () => {
    const { user } = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const location = useLocation();

    // Do not show BottomNav if the user is not a customer or on admin/owner dashboards
    if (user && user.role !== 'ROLE_CUSTOMER') {
        return null;
    }

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/menu', label: 'Menu', icon: Utensils },
        { path: '/restaurants', label: 'Restaurants', icon: Store },
        { 
            path: user ? (user.role === 'ROLE_CUSTOMER' ? '/orders' : '/login') : '/login', 
            label: user ? 'Profile' : 'Login', 
            icon: User 
        }
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass bg-background/90 border-t border-border z-50 px-6 py-2 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path === '/orders' && location.pathname.startsWith('/profile'));
                    const Icon = item.icon;

                    return (
                        <Link 
                            key={item.label}
                            to={item.path}
                            className={`relative flex flex-col items-center p-2 transition-all duration-300 ${
                                isActive ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-primary/20' : ''}`} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-accent text-secondary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
