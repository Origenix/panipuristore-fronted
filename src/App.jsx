import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { AuthContext } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Store, Instagram, Twitter, Facebook } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RestaurantList from './pages/RestaurantList';
import Menu from './pages/Menu';
import AllMenu from './pages/AllMenu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import MyAddresses from './pages/MyAddresses';
import SubscriptionPlans from './pages/SubscriptionPlans';
import SupportCenter from './pages/SupportCenter';
import ForgotPassword from './pages/ForgotPassword';

const ProtectedRoute = ({ children, allowedRoles, roles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;
    
    const targetRoles = allowedRoles || roles;
    if (targetRoles) {
        const hasRole = targetRoles.some(r => user.role === r || user.role === `ROLE_${r}`);
        if (!hasRole) return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    return (
        <NotificationProvider>
        <Router>
            <div className="flex flex-col min-h-screen">
                <Toaster />
                <Navbar />
                <BottomNav />
                <main className="flex-grow pb-16 md:pb-0">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ForgotPassword />} />
                        <Route path="/subscription-plans" element={<SubscriptionPlans />} />
                        <Route path="/menu" element={<AllMenu />} />
                        <Route path="/restaurants" element={<RestaurantList />} />
                        <Route path="/restaurant/:id" element={<Menu />} />

                        <Route path="/cart" element={<ProtectedRoute allowedRoles={['ROLE_CUSTOMER']}><Cart /></ProtectedRoute>} />
                        <Route path="/checkout" element={<ProtectedRoute allowedRoles={['ROLE_CUSTOMER']}><Checkout /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute roles={['CUSTOMER']}><Orders /></ProtectedRoute>} />
                        <Route path="/favorites" element={<ProtectedRoute allowedRoles={['ROLE_CUSTOMER']}><Favorites /></ProtectedRoute>} />
                        <Route path="/profile/addresses" element={<ProtectedRoute roles={['CUSTOMER']}><MyAddresses /></ProtectedRoute>} />
                        <Route path="/support" element={<ProtectedRoute allowedRoles={['ROLE_CUSTOMER','ROLE_RESTAURANT_OWNER']}><SupportCenter /></ProtectedRoute>} />

                        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/owner" element={<ProtectedRoute roles={['RESTAURANT_OWNER']}><OwnerDashboard /></ProtectedRoute>} />
                        <Route path="/owner/*" element={<ProtectedRoute allowedRoles={['ROLE_RESTAURANT_OWNER']}><OwnerDashboard /></ProtectedRoute>} />
                        <Route path="/delivery/*" element={<ProtectedRoute allowedRoles={['ROLE_DELIVERY_AGENT']}><DeliveryDashboard /></ProtectedRoute>} />
                    </Routes>
                </main>
                
                {/* Modern Branded Footer */}
                <footer className="bg-[#1A1A1A] text-white pt-16 pb-8 border-t-[8px] border-primary">
                    <div className="max-w-7xl mx-auto px-6 md:px-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                            <div className="md:col-span-1">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="bg-primary p-2 rounded-xl">
                                        <Store className="text-white w-5 h-5" />
                                    </div>
                                    <span className="text-xl font-black tracking-tight">PANIPURI STORE</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    Bringing the authentic taste of Indian street food directly to your doorstep. Fresh, hygienic, and incredibly delicious.
                                </p>
                                <div className="flex gap-4">
                                    <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-lg font-bold mb-6 border-b border-white/10 pb-2 inline-block">Explore</h4>
                                <ul className="space-y-4 text-gray-400 text-sm">
                                    <li><a href="/menu" className="hover:text-primary transition-colors">Our Menu</a></li>
                                    <li><a href="#" className="hover:text-primary transition-colors">Combo Offers</a></li>
                                    <li><a href="#" className="hover:text-primary transition-colors">Catering</a></li>
                                    <li><a href="#" className="hover:text-primary transition-colors">Nutrition Info</a></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="text-lg font-bold mb-6 border-b border-white/10 pb-2 inline-block">Support</h4>
                                <ul className="space-y-4 text-gray-400 text-sm">
                                    <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                                    <li><a href="#" className="hover:text-primary transition-colors">Track Order</a></li>
                                    <li><a href="#" className="hover:text-primary transition-colors">Refund Policy</a></li>
                                    <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="text-lg font-bold mb-6 border-b border-white/10 pb-2 inline-block">Working Hours</h4>
                                <ul className="space-y-4 text-gray-400 text-sm">
                                    <li className="flex justify-between"><span>Mon - Fri:</span> <span>11:00 AM - 10:00 PM</span></li>
                                    <li className="flex justify-between"><span>Sat - Sun:</span> <span>11:00 AM - 11:30 PM</span></li>
                                    <li className="mt-4 pt-4 border-t border-white/10">
                                        <span className="block text-accent font-bold mb-1">100% Veg</span>
                                        We maintain strict hygiene standards.
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
                            <p>&copy; {new Date().getFullYear()} Panipuri Store. All rights reserved.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </Router>
        </NotificationProvider>
    );
}

export default App;
