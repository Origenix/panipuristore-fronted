import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import { Package, Clock, MapPin, CheckCircle, Receipt, ArrowRight, ChevronRight, Truck, Utensils, Zap, Flame, Star } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();
    const [ratingState, setRatingState] = useState({});

    useEffect(() => {
        let isMounted = true;
        const fetchOrders = async () => {
            try {
                const res = await axios.get('/orders/customer');
                if (isMounted) setOrders(res.data);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchOrders();
        
        const intervalId = setInterval(fetchOrders, 5000);
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const getStatusColor = (status) => {
        switch(status) {
            case 'PENDING_CONFIRMATION': return 'text-orange-500 bg-orange-500/10';
            case 'ACCEPTED_BY_OWNER': return 'text-indigo-500 bg-indigo-500/10';
            case 'PREPARING': return 'text-accent bg-accent/10';
            case 'READY_FOR_PICKUP': return 'text-blue-500 bg-blue-500/10';
            case 'ASSIGNED_TO_AGENT':
            case 'PICKED_UP':
            case 'OUT_FOR_DELIVERY': return 'text-primary bg-primary/10';
            case 'DELIVERED': return 'text-success bg-success/10';
            case 'REJECTED_BY_OWNER':
            case 'CANCELLED': return 'text-danger bg-danger/10';
            default: return 'text-muted-foreground bg-muted';
        }
    };

    const getStatusStep = (status) => {
        const mapping = {
            'PENDING_CONFIRMATION': 0,
            'ACCEPTED_BY_OWNER': 1,
            'PREPARING': 2,
            'READY_FOR_PICKUP': 3,
            'ASSIGNED_TO_AGENT': 3,
            'PICKED_UP': 4,
            'OUT_FOR_DELIVERY': 4,
            'DELIVERED': 5
        };
        return mapping[status] ?? -1;
    };

    const handleReorder = async (order) => {
        try {
            for (const item of order.items) {
                await addToCart(item.menuItemId, item.quantity);
            }
            navigate('/cart');
        } catch (error) {
            console.error("Failed to reorder", error);
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to add items to cart.");
            }
        }
    };

    const handleRate = async (orderId, rating, feedback = "") => {
        try {
            await axios.put(`/orders/${orderId}/rate?rating=${rating}&feedback=${encodeURIComponent(feedback)}`);
            setOrders(orders.map(o => o.id === orderId ? { ...o, rating, ratingFeedback: feedback } : o));
            setRatingState(prev => ({ ...prev, [orderId]: { ...prev[orderId], submitted: true } }));
        } catch (error) {
            console.error("Failed to submit rating", error);
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to submit rating.");
            }
        }
    };

    if (loading) return (
        <div className="pt-32 flex justify-center h-screen items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-primary border-t-transparent"></div>
        </div>
    );

    if (orders.length === 0) {
        return (
            <div className="pt-40 pb-20 text-center min-h-screen bg-background">
                <div className="bg-muted w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-10 border border-dashed border-primary/30 shadow-inner">
                    <Receipt className="w-16 h-16 text-muted-foreground opacity-50" />
                </div>
                <h1 className="text-5xl font-black mb-4 tracking-tighter">No orders yet</h1>
                <p className="text-xl text-muted-foreground mb-12 font-medium">You haven't ordered any delicious street food yet.</p>
                <button className="btn-primary" onClick={() => window.location.href = '/restaurants'}>
                    Browse Menu
                </button>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-20 min-h-screen bg-background">
            <div className="section-padding max-w-5xl">
                <div className="flex items-center justify-between mb-12">
                    <h1 className="text-5xl font-black tracking-tighter">My Orders</h1>
                    <div className="bg-primary/10 text-primary px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-sm">
                        {orders.length} orders total
                    </div>
                </div>
                
                <div className="space-y-12">
                    {orders.map(order => (
                        <div key={order.id} className="card-premium overflow-hidden border-border shadow-xl hover:border-primary/20 transition-all bg-card">
                            {/* Header */}
                            <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8 border-b border-border bg-muted/20">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-3xl font-black uppercase tracking-tighter text-foreground">#{order.orderNumber}</span>
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm ${getStatusColor(order.orderStatus)}`}>
                                            {order.orderStatus.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-muted-foreground">
                                        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {order.restaurantName}</span>
                                        {order.restaurantOwnerPhone && !['PENDING_CONFIRMATION', 'REJECTED_BY_OWNER', 'CANCELLED'].includes(order.orderStatus) && (
                                            <a href={`tel:${order.restaurantOwnerPhone}`} className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                <span>Owner: {order.restaurantOwnerPhone}</span>
                                            </a>
                                        )}
                                        {order.estimatedDeliveryTime && !['DELIVERED', 'CANCELLED', 'REJECTED_BY_OWNER'].includes(order.orderStatus) && (
                                            <span className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1 rounded-full"><Clock className="w-4 h-4" /> ETA: {new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="md:text-right">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Total Amount</p>
                                    <p className="text-5xl font-black text-primary tracking-tighter">₹{order.totalAmount}</p>
                                    {order.items.some(item => item.unavailable) && (
                                        <p className="text-xs font-bold text-red-600 mt-2">Total updated after unavailable item(s)</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Tracking */}
                            {!['CANCELLED', 'REJECTED_BY_OWNER'].includes(order.orderStatus) && (
                                <div className="px-6 md:px-10 py-12 bg-background border-b border-border overflow-x-auto custom-scrollbar">
                                    <div className="flex justify-between relative min-w-[600px] px-6">
                                        {/* Progress Line */}
                                        <div className="absolute top-6 left-12 right-12 h-1 bg-muted -z-0">
                                            <div 
                                                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(230,74,25,0.5)]" 
                                                style={{ width: `${Math.max(0, (getStatusStep(order.orderStatus) / 5) * 100)}%` }}
                                            ></div>
                                        </div>
                                        
                                        {[
                                            { icon: Package, label: 'Placed' },
                                            { icon: CheckCircle, label: 'Confirmed' },
                                            { icon: Flame, label: 'Preparing' },
                                            { icon: Zap, label: 'Ready' },
                                            { icon: Truck, label: 'On Way' },
                                            { icon: CheckCircle, label: 'Delivered' }
                                        ].map((s, index) => (
                                            <div key={index} className="relative z-10 flex flex-col items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-background ${
                                                    getStatusStep(order.orderStatus) >= index 
                                                    ? 'bg-primary text-white shadow-xl shadow-primary/40 scale-110' 
                                                    : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    <s.icon className="w-5 h-5" />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    getStatusStep(order.orderStatus) >= index ? 'text-primary' : 'text-muted-foreground opacity-50'
                                                }`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {order.orderStatus === 'REJECTED_BY_OWNER' && (
                                <div className="px-10 py-8 bg-danger/10 border-b border-danger/20">
                                    <p className="text-danger font-bold text-sm flex items-center gap-3">
                                        <div className="bg-danger text-white p-1 rounded-full"><ArrowRight className="w-3 h-3 rotate-180" /></div>
                                        Order Rejected: {order.cancellationReason || 'Store is currently unavailable'}
                                    </p>
                                </div>
                            )}
                            
                            {/* Actions */}
                            <div className="px-8 py-6 flex items-center justify-between border-b border-border bg-muted/10">
                                <div className="flex gap-4">
                                    {order.orderStatus === 'PENDING_CONFIRMATION' && (
                                        <button 
                                            onClick={async () => {
                                                if(window.confirm("Cancel this order?")) {
                                                    try {
                                                        await axios.put(`/orders/${order.id}/user/cancel?reason=Changed mind`);
                                                        window.location.reload();
                                                    } catch(error) { 
                                                        if (!error.response || error.response.status >= 500) {
                                                            toast.error("We're experiencing some server issues right now. Please try again later.");
                                                        } else {
                                                            toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to cancel");
                                                        }
                                                    }
                                                }
                                            }}
                                            className="text-sm font-black uppercase tracking-widest text-danger hover:text-danger/80 transition-colors"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleReorder(order)}
                                        className="text-sm font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                                    >
                                        <Utensils className="w-4 h-4" /> Reorder Items
                                    </button>
                                </div>
                                <button className="px-6 py-2.5 rounded-full bg-muted font-black text-xs uppercase tracking-widest hover:bg-border transition-colors text-foreground">
                                    Download Bill
                                </button>
                            </div>
                            
                            {/* Rating Section for Delivered Orders */}
                            {order.orderStatus === 'DELIVERED' && !order.rating && !ratingState[order.id]?.submitted && (
                                <div className="p-8 border-b border-border bg-gradient-to-r from-accent/10 to-transparent">
                                    <p className="font-bold mb-4">How was your food? Rate your experience!</p>
                                    <div className="flex items-center gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button 
                                                key={star}
                                                onMouseEnter={() => setRatingState(prev => ({ ...prev, [order.id]: { ...prev[order.id], hover: star } }))}
                                                onMouseLeave={() => setRatingState(prev => ({ ...prev, [order.id]: { ...prev[order.id], hover: 0 } }))}
                                                onClick={() => setRatingState(prev => ({ ...prev, [order.id]: { ...prev[order.id], selected: star } }))}
                                            >
                                                <Star className={`w-8 h-8 transition-colors ${((ratingState[order.id]?.hover || ratingState[order.id]?.selected || 0) >= star) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                                            </button>
                                        ))}
                                    </div>
                                    {ratingState[order.id]?.selected && (
                                        <div className="flex gap-4">
                                            <input 
                                                type="text" 
                                                placeholder="Tell us more (optional)..."
                                                className="input-premium flex-grow h-12"
                                                value={ratingState[order.id]?.feedback || ''}
                                                onChange={(e) => setRatingState(prev => ({ ...prev, [order.id]: { ...prev[order.id], feedback: e.target.value } }))}
                                            />
                                            <button 
                                                onClick={() => handleRate(order.id, ratingState[order.id].selected, ratingState[order.id].feedback)}
                                                className="btn-primary h-12 px-8"
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {order.rating && (
                                <div className="p-8 border-b border-border bg-success/5">
                                    <p className="text-xs font-black uppercase tracking-widest text-success mb-2">You rated this order</p>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-5 h-5 ${order.rating >= star ? 'fill-success text-success' : 'text-muted-foreground'}`} />
                                        ))}
                                    </div>
                                    {order.ratingFeedback && <p className="font-medium opacity-80">"{order.ratingFeedback}"</p>}
                                </div>
                            )}
                            
                            {/* Details */}
                            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-background">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-primary" /> Order Content
                                    </h4>
                                    <div className="space-y-5">
                                        {order.items.map(item => (
                                            <div key={item.id} className={`flex justify-between items-center gap-4 group ${item.unavailable ? 'opacity-60' : ''}`}>
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm ${item.unavailable ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                                        {item.quantity}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className={`font-bold group-hover:opacity-100 transition-opacity text-lg ${item.unavailable ? 'line-through' : ''}`}>{item.menuItemName}</span>
                                                        {item.unavailable && (
                                                            <p className="text-xs font-black uppercase text-red-600 mt-1">Out of stock — amount removed</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`font-black text-lg flex-shrink-0 ${item.unavailable ? 'line-through text-muted-foreground' : ''}`}>
                                                    ₹{item.price * item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                        {order.items.some(item => item.unavailable) && (
                                            <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                                                <p className="font-black text-sm">Some items are unavailable.</p>
                                                <p className="text-xs font-medium mt-1">The unavailable item amount has been removed from your order total.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    <div className="p-8 bg-muted/40 rounded-[2rem] border border-border">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery To</h4>
                                        <p className="text-base font-medium leading-relaxed opacity-90">{order.deliveryAddress}</p>
                                    </div>
                                    
                                    {order.deliveryAgentName && (
                                        <div className="flex items-center gap-6 p-8 bg-gradient-to-r from-primary/10 to-transparent rounded-[2.5rem] border border-primary/20 relative overflow-hidden">
                                            <Truck className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/5 -rotate-12" />
                                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30 relative z-10">
                                                <Truck className="text-white w-8 h-8" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Assigned Delivery Partner</p>
                                                <p className="text-xl font-black">{order.deliveryAgentName}</p>
                                                <p className="text-sm font-bold opacity-70 mt-1">{order.deliveryAgentPhone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Orders;
