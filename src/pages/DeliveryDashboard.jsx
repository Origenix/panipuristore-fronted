import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Truck, MapPin, PhoneCall, CheckCircle, Navigation, Package, Star, Clock, Zap, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const DeliveryDashboard = () => {
    const [myOrders, setMyOrders] = useState([]);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [myRes, availRes] = await Promise.all([
                axios.get('/orders/delivery'),
                axios.get('/orders/available')
            ]);
            setMyOrders(myRes.data);
            setAvailableOrders(availRes.data);
        } catch (error) {
            console.error("Failed to fetch delivery orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const acceptOrder = async (orderId) => {
        try {
            await axios.put(`/orders/${orderId}/agent/accept`);
            fetchData();
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to accept order");
            }
        }
    };

    const performAction = async (orderId, action) => {
        try {
            await axios.put(`/orders/${orderId}/agent/${action}`);
            fetchData();
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Action failed");
            }
        }
    };

    if (loading) return (
        <div className="pt-32 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    const activeOrders = myOrders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED');

    return (
        <div className="pt-28 pb-20 min-h-screen">
            <div className="section-padding max-w-6xl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-2">
                                <Truck className="w-3 h-3" /> Delivery Pro
                            </span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter mb-2">Fleet Hub</h1>
                        <p className="text-xl text-muted-foreground font-medium">Earn more, deliver faster.</p>
                    </div>

                    <div className="flex gap-2 p-2 bg-muted rounded-[2rem]">
                        <button 
                            onClick={() => setActiveTab('available')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'available' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <Navigation className="w-4 h-4" /> Near Me ({availableOrders.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('mine')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'mine' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <Package className="w-4 h-4" /> My Active ({activeOrders.length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'available' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {availableOrders.map(order => (
                            <div key={order.id} className="card-premium p-10 bg-card border-none shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[4rem] flex items-center justify-center -translate-y-4 translate-x-4">
                                    <Zap className="text-primary w-8 h-8 opacity-20" />
                                </div>
                                
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 block">Immediate Pickup</span>
                                <h3 className="text-3xl font-black mb-2 tracking-tighter">{order.restaurantName}</h3>
                                <p className="text-sm font-bold opacity-60 mb-8 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" /> {order.deliveryAddress}
                                </p>
                                
                                <div className="flex items-center justify-between pt-8 border-t border-border">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Est. Pay</p>
                                        <p className="text-3xl font-black text-green-500">₹{order.deliveryCharge || 40}</p>
                                    </div>
                                    <button 
                                        onClick={() => acceptOrder(order.id)}
                                        className="btn-primary !px-10"
                                    >
                                        Accept Task
                                    </button>
                                </div>
                            </div>
                        ))}
                        {availableOrders.length === 0 && (
                            <div className="col-span-full py-32 text-center card-premium border-dashed bg-muted/20">
                                <Navigation className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-10" />
                                <h3 className="text-2xl font-black opacity-30">Searching for tasks...</h3>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'mine' && (
                    <div className="space-y-12">
                        {activeOrders.map(order => (
                            <div key={order.id} className="card-premium p-10 bg-secondary text-white border-none shadow-3xl overflow-hidden relative">
                                <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="text-5xl font-black tracking-tighter text-primary">#{order.orderNumber}</span>
                                            <div className="bg-white/10 px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                {order.orderStatus.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                        
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                                        <Utensils className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Restaurant</p>
                                                        <p className="font-bold text-lg">{order.restaurantName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                                        <MapPin className="w-5 h-5 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Destination</p>
                                                        <p className="font-bold text-lg">{order.deliveryAddress}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col justify-center items-center text-center">
                                                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Collect Payment</p>
                                                <p className="text-5xl font-black text-primary mb-2">₹{order.totalAmount}</p>
                                                <p className="text-xs font-bold bg-white text-secondary px-3 py-1 rounded-lg">{order.paymentMethod}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:w-80 flex flex-col gap-4 justify-center">
                                        <a href={`tel:${order.customerPhone}`} className="w-full h-16 rounded-[2rem] bg-white text-secondary font-black flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-transform">
                                            <PhoneCall className="w-6 h-6 text-primary" /> Call Client
                                        </a>
                                            <div className="flex gap-4">
                                                {order.orderStatus === 'ASSIGNED_TO_AGENT' && (
                                                    <button 
                                                        onClick={() => performAction(order.id, 'pickup')}
                                                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                                                    >
                                                        Mark as Picked Up
                                                    </button>
                                                )}
                                                {order.orderStatus === 'PICKED_UP' && (
                                                    <button 
                                                        onClick={() => performAction(order.id, 'out-for-delivery')}
                                                        className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all"
                                                    >
                                                        Start Delivery
                                                    </button>
                                                )}
                                                {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                                                    <button 
                                                        onClick={() => performAction(order.id, 'delivered')}
                                                        className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-all"
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                )}
                                            </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activeOrders.length === 0 && (
                            <div className="py-32 text-center card-premium border-dashed bg-muted/20">
                                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-10" />
                                <h3 className="text-2xl font-black opacity-30">Quiet shift... accept a task to start.</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryDashboard;
