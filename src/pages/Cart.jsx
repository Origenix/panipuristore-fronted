import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { CartContext } from '../context/CartContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Ticket, ShieldCheck, Flame } from 'lucide-react';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, loading } = useContext(CartContext);
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [couponError, setCouponError] = useState('');
    const [showCoupons, setShowCoupons] = useState(false);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await axios.get('/coupons/public/active');
                setAvailableCoupons(res.data);
            } catch (error) {
                console.error("Error fetching coupons", error);
            }
        };
        fetchCoupons();
    }, []);

    const handleApplyCoupon = async (code = couponCode) => {
        if (!code) return;
        setCouponError('');
        try {
            const res = await axios.get(`/coupons/validate/${code}`);
            setAppliedCoupon(res.data);
            setCouponCode(code);
            setShowCoupons(false);
        } catch (error) {
            setCouponError(error.response?.data || "Invalid coupon");
            setAppliedCoupon(null);
        }
    };

    if (loading) return (
        <div className="pt-32 flex justify-center h-screen items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-primary border-t-transparent"></div>
        </div>
    );

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="pt-32 md:pt-40 pb-20 section-padding text-center min-h-screen bg-background">
                <div className="bg-muted w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-inner border border-dashed border-primary/30">
                    <Flame className="w-12 h-12 md:w-16 md:h-16 text-primary/50" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter">Your cart is empty</h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium mb-10 md:mb-12">Craving some spicy Pani Puri? Let's add some flavour!</p>
                <Link to="/restaurants" className="btn-primary inline-flex gap-2 items-center">
                    Browse Menu <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        );
    }

    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = 0; 
    
    let discount = 0;
    if (appliedCoupon) {
        if (subtotal < appliedCoupon.minOrderAmount) {
            setAppliedCoupon(null);
            setCouponError(`Min order for ${appliedCoupon.code} is ₹${appliedCoupon.minOrderAmount}`);
        } else {
            discount = (subtotal * appliedCoupon.discountPercentage) / 100;
            if (appliedCoupon.maxDiscountAmount && discount > appliedCoupon.maxDiscountAmount) {
                discount = appliedCoupon.maxDiscountAmount;
            }
        }
    }
    
    const total = subtotal + deliveryFee - discount;

    return (
        <div className="pt-28 pb-20 min-h-screen bg-background">
            <div className="section-padding">
                <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
                   <button onClick={() => navigate(-1)} className="p-2 md:p-3 rounded-full bg-muted hover:bg-border transition-all">
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                   <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase text-primary">Your Cart</h1>
                </div>

                <div className="flex flex-col xl:flex-row gap-8 md:gap-12">
                    {/* Items List */}
                    <div className="flex-grow space-y-4 md:space-y-6">
                        {cart.items.map((item) => (
                            <div key={item.id} className="card-premium p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start bg-card hover:border-primary/30">
                                <div className="w-full sm:w-24 sm:h-24 md:w-32 md:h-32 h-40 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                                    <img src={item.menuItemImage} className="w-full h-full object-cover" alt={item.menuItemName} />
                                </div>
                                <div className="flex-grow text-center sm:text-left w-full flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex justify-between items-start mb-1 md:mb-2">
                                            <h3 className="text-xl md:text-2xl font-black">{item.menuItemName}</h3>
                                            <div className="text-xl md:text-2xl font-black text-primary">₹{item.price}</div>
                                        </div>
                                        <p className="text-muted-foreground font-bold text-xs md:text-sm uppercase tracking-widest mb-4 md:mb-6">{item.menuItemCategory}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-muted p-1 md:p-1.5 rounded-xl border border-border">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-background flex items-center justify-center hover:text-primary transition-colors shadow-sm"
                                            >
                                                <Minus className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                            <span className="text-lg md:text-xl font-black w-6 md:w-8 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-background flex items-center justify-center hover:text-primary transition-colors shadow-sm"
                                            >
                                                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-3 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="w-full xl:w-[450px]">
                        <div className="card-premium p-6 md:p-10 sticky top-[100px] border-primary/20 shadow-2xl bg-muted/20">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 tracking-tight flex items-center gap-2">
                                Order Summary
                            </h2>
                            
                            <div className="space-y-6 mb-10 text-lg">
                                <div className="flex justify-between font-bold text-muted-foreground">
                                    <span>Item Total</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between font-bold text-muted-foreground">
                                    <span>Delivery Fee</span>
                                    <span className="text-success font-black tracking-widest uppercase">Free</span>
                                </div>
                                
                                {appliedCoupon && (
                                    <div className="flex justify-between font-black text-primary animate-in zoom-in-95 bg-primary/5 p-4 rounded-xl border border-primary/20">
                                        <div className="flex items-center gap-2">
                                            <span>Discount</span>
                                            <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">{appliedCoupon.code}</span>
                                        </div>
                                        <span>- ₹{discount.toFixed(0)}</span>
                                    </div>
                                )}

                                <div className="h-px bg-border my-6"></div>
                                <div className="flex justify-between text-4xl font-black">
                                    <span>To Pay</span>
                                    <span className="text-primary tracking-tighter">₹{total.toFixed(0)}</span>
                                </div>
                            </div>

                            <div className="mb-10">
                                <div 
                                    onClick={() => setShowCoupons(!showCoupons)}
                                    className="bg-background p-6 rounded-3xl border border-dashed border-primary/40 group cursor-pointer hover:bg-primary/5 transition-colors shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 font-black text-primary uppercase tracking-widest text-[11px]">
                                            <Ticket className="w-5 h-5" />
                                            {appliedCoupon ? 'Coupon Applied' : 'Apply Coupon'}
                                        </div>
                                        <ArrowRight className={`w-5 h-5 text-primary transition-transform ${showCoupons ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground">
                                        {appliedCoupon ? `You saved ₹${discount.toFixed(0)} with ${appliedCoupon.code}` : 'Check for available discount codes'}
                                    </p>
                                </div>

                                {showCoupons && (
                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter code..."
                                                className="input-premium h-14 !px-5 flex-grow font-bold uppercase"
                                            />
                                            <button 
                                                onClick={() => handleApplyCoupon()}
                                                className="btn-primary !px-8 h-14"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {couponError && <p className="text-xs font-black text-danger uppercase px-2">{couponError}</p>}
                                        
                                        <div className="pt-4">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-2">Available Offers</p>
                                            <div className="space-y-3">
                                                {availableCoupons.length === 0 ? (
                                                    <p className="text-sm font-bold text-muted-foreground italic px-2">No coupons available right now.</p>
                                                ) : (
                                                    availableCoupons.map(cp => (
                                                        <button 
                                                            key={cp.id}
                                                            onClick={() => handleApplyCoupon(cp.code)}
                                                            className="w-full flex justify-between items-center p-4 rounded-2xl bg-background border border-border hover:border-primary transition-all group shadow-sm hover:shadow-md"
                                                        >
                                                            <div className="text-left font-black">
                                                                <div className="text-base tracking-tight mb-1">{cp.code}</div>
                                                                <div className="text-[11px] font-bold text-success uppercase">Save {cp.discountPercentage}% (Up to ₹{cp.maxDiscountAmount})</div>
                                                                <div className="text-[10px] text-muted-foreground mt-1">Min order ₹{cp.minOrderAmount}</div>
                                                            </div>
                                                            <div className="text-xs font-black uppercase text-primary bg-primary/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Apply</div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => navigate('/checkout')}
                                className="btn-primary w-full h-16 text-xl tracking-tight shadow-xl shadow-primary/30"
                            >
                                Proceed to Checkout
                            </button>

                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground justify-center">
                                <ShieldCheck className="w-4 h-4 text-success" />
                                Secure Checkout by PanipuriStore Pay
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
