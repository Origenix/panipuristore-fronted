import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { CreditCard, MapPin, Truck, CheckCircle2, ArrowLeft, ShieldCheck, Home, Building, AlertTriangle, X, Wallet, Fingerprint, Flame, Plus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import AddressForm from '../components/AddressForm';

const Checkout = () => {
    const { user } = useContext(AuthContext);
    const { cart, fetchCart } = useContext(CartContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        paymentMethod: 'COD'
    });
    
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [fetchingAddresses, setFetchingAddresses] = useState(true);

    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, description }
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [minimumOrderAmount, setMinimumOrderAmount] = useState(0);

    // Payment Gateway States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });

    // Error Modal States
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorDetails, setErrorDetails] = useState({ message: '', devInfo: '' });

    useEffect(() => {
        const loadAddresses = async () => {
            try {
                const res = await axios.get('/addresses/my');
                setAddresses(res.data);
                if (res.data.length > 0) {
                    const defaultAddress = res.data.find(a => a.isDefault) || res.data[0];
                    setSelectedAddress(defaultAddress);
                } else {
                    setShowAddressForm(true);
                }
            } catch (err) {
                console.error("Error fetching addresses", err);
                toast.error("Failed to load saved addresses.");
            } finally {
                setFetchingAddresses(false);
            }
        };
        loadAddresses();
    }, []);

    useEffect(() => {
        const loadMinimumOrderAmount = async () => {
            const restaurantId = cart?.items?.[0]?.restaurantId;
            if (!restaurantId) {
                setMinimumOrderAmount(0);
                return;
            }
            try {
                const res = await axios.get(`/restaurants/public/${restaurantId}`);
                setMinimumOrderAmount(Number(res.data.minimumOrderAmount || 0));
            } catch (err) {
                console.error("Failed to load minimum order amount", err);
                setMinimumOrderAmount(0);
            }
        };
        loadMinimumOrderAmount();
    }, [cart?.items]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveAddress = async (newAddressData) => {
        setLoading(true);
        try {
            const res = await axios.post('/addresses', newAddressData);
            setAddresses([...addresses, res.data]);
            setSelectedAddress(res.data);
            setShowAddressForm(false);
            toast.success("Address added successfully");
        } catch (err) {
            console.error("Error saving address", err);
            toast.error(err.response?.data?.message || "Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        
        if (!selectedAddress) {
            toast.error("Please select a delivery address");
            return;
        }

        const currentSubtotal = cart?.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
        if (minimumOrderAmount > 0 && currentSubtotal < minimumOrderAmount) {
            const amountToAdd = minimumOrderAmount - currentSubtotal;
            toast.error(`Cart amount is too low. Add ₹${amountToAdd.toFixed(2)} more to place the order.`, { duration: 5000 });
            return;
        }

        if (formData.paymentMethod === 'ONLINE') {
            setShowPaymentModal(true);
            return;
        }

        executeOrder();
    };

    const executeOrder = async () => {
        setLoading(true);
        
        const formattedDeliveryAddress = `${selectedAddress.addressType} - ${selectedAddress.fullName}, ${selectedAddress.houseNo}, ${selectedAddress.area}${selectedAddress.landmark ? ', Landmark: ' + selectedAddress.landmark : ''}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pinCode}. Mob: ${selectedAddress.mobileNumber}.${selectedAddress.deliveryNote ? ' Note: ' + selectedAddress.deliveryNote : ''}`;

        const finalPayload = {
            deliveryAddress: formattedDeliveryAddress,
            paymentMethod: formData.paymentMethod,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
            couponCode: appliedCoupon ? appliedCoupon.code : null
        };
        
        try {
            await axios.post('/orders/place', finalPayload);
            setOrderSuccess(true);
            fetchCart(); 
            setTimeout(() => {
                navigate('/orders');
            }, 5000);
        } catch (err) {
            handleRuntimeError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRuntimeError = (err) => {
        console.error("Runtime Error Captured:", err);
        setErrorDetails({
            message: "Oops! We hit a snag while processing your request.",
            devInfo: `[Runtime Exception]\nName: ${err.name || 'Error'}\nMessage: ${err.message || 'Unknown error'}\nStatus: ${err.response?.status || 'N/A'}\nAPI Response: ${JSON.stringify(err.response?.data || {})}`
        });
        setShowErrorModal(true);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setPaymentProcessing(true);
        
        // Simulate payment gateway delay
        setTimeout(() => {
            setPaymentProcessing(false);
            
            if (cardDetails.cvv === '000') {
                setShowPaymentModal(false);
                handleRuntimeError(new Error("PAYMENT_GATEWAY_TIMEOUT: Downstream bank server did not respond in time. Failed to acquire token."));
                return;
            }

            setShowPaymentModal(false);
            executeOrder();
        }, 2000);
    };

    const getIconForType = (type) => {
        switch (type.toLowerCase()) {
            case 'home': return <Home className="w-5 h-5" />;
            case 'work': return <Building className="w-5 h-5" />;
            default: return <MapPin className="w-5 h-5" />;
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const restaurantId = cart.items[0]?.restaurantId;
            const categoryIds = [...new Set(cart.items.map(i => i.categoryId).filter(Boolean))];
            const res = await axios.post('/coupons/validate', {
                code: couponCode.trim().toUpperCase(),
                restaurantId,
                subtotal,
                categoryIds
            });
            setAppliedCoupon({
                code: res.data.coupon.code,
                discountAmount: parseFloat(res.data.discountAmount),
                description: res.data.coupon.description || `${res.data.coupon.code} applied`
            });
            toast.success(res.data.message || 'Coupon applied!');
        } catch (err) {
            const msg = err.response?.data?.error || 'Invalid coupon code';
            setCouponError(msg);
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="pt-40 pb-20 flex flex-col justify-center items-center px-4 text-center min-h-screen bg-background">
                <div className="w-40 h-40 bg-success/10 rounded-full flex items-center justify-center mb-8 animate-bounce transition-all border-[8px] border-success/20">
                    <CheckCircle2 size={80} className="text-success" />
                </div>
                <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter">Order Placed!</h1>
                <p className="text-2xl text-muted-foreground font-medium mb-6">Your spicy street food is being prepared with love.</p>
                <div className="bg-primary/10 border-2 border-primary/20 text-primary font-black text-xl px-8 py-4 rounded-3xl mb-12 flex items-center gap-3">
                    <Flame className="w-8 h-8" />
                    Estimated Delivery: 40 Minutes
                </div>
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-primary bg-primary/10 px-6 py-3 rounded-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    Redirecting to your orders...
                </div>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="pt-40 text-center min-h-screen bg-background">
                <h2 className="text-4xl font-bold mb-8">Cart is empty</h2>
                <Link to="/restaurants" className="btn-primary inline-flex">Explore Menu</Link>
            </div>
        );
    }

    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="pt-28 pb-20 min-h-screen relative bg-background">
            <div className="section-padding">
                <div className="flex items-center gap-4 mb-12">
                   <button onClick={() => navigate('/cart')} className="p-3 rounded-full bg-muted hover:bg-border transition-all">
                        <ArrowLeft className="w-6 h-6" />
                   </button>
                   <h1 className="text-4xl font-black tracking-tighter uppercase text-primary">Checkout</h1>
                </div>
                
                <div className="flex flex-col xl:flex-row gap-12">
                    {/* Delivery & Payment Form */}
                    <div className="flex-1 min-w-0 space-y-8">
                        
                        {/* Delivery Address Section */}
                        <div className="card-premium p-6 md:p-10 bg-card border-border shadow-xl">
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                <MapPin className="text-primary w-7 h-7 shrink-0" /> 
                                Delivery Address
                            </h2>
                            
                            {fetchingAddresses ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : showAddressForm ? (
                                <AddressForm 
                                    onSave={handleSaveAddress} 
                                    onCancel={addresses.length > 0 ? () => setShowAddressForm(false) : undefined} 
                                    loading={loading}
                                />
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {addresses.map(address => (
                                            <label 
                                                key={address.id} 
                                                className={`p-4 rounded-[1.5rem] border-2 transition-all cursor-pointer flex flex-col relative ${
                                                    selectedAddress?.id === address.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-muted/30 hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-2 py-1 rounded-full text-xs">
                                                        {getIconForType(address.addressType)}
                                                        {address.addressType}
                                                    </div>
                                                    <input 
                                                        type="radio" 
                                                        name="selectedAddress" 
                                                        checked={selectedAddress?.id === address.id}
                                                        onChange={() => setSelectedAddress(address)}
                                                        className="w-5 h-5 accent-primary mt-1"
                                                    />
                                                </div>
                                                <h3 className="font-bold text-lg mb-1">{address.fullName}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {address.houseNo}, {address.area}{address.landmark ? ', ' + address.landmark : ''}, {address.city}
                                                </p>
                                                <p className="text-xs text-foreground font-semibold mt-2">
                                                    {address.mobileNumber}
                                                </p>
                                            </label>
                                        ))}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddressForm(true)}
                                        className="w-full p-4 border-2 border-dashed border-primary/40 rounded-[1.5rem] text-primary font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 mt-4"
                                    >
                                        <Plus className="w-5 h-5" /> Add New Address
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Payment Method Section */}
                        <div className="card-premium p-6 md:p-10 bg-card border-border shadow-xl">
                            <form onSubmit={handlePlaceOrder} id="checkout-form">
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <CreditCard className="text-primary w-7 h-7 shrink-0" /> 
                                    Payment Method
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-3 ${
                                        formData.paymentMethod === 'COD' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-muted/30 hover:border-primary/50'
                                    }`}>
                                        <div className="flex justify-between items-center w-full">
                                            <input 
                                                type="radio" 
                                                name="paymentMethod" 
                                                value="COD" 
                                                checked={formData.paymentMethod === 'COD'} 
                                                onChange={handleChange} 
                                                className="w-5 h-5 accent-primary"
                                            />
                                            <div className={`p-3 rounded-xl ${formData.paymentMethod === 'COD' ? 'bg-primary/20 text-primary' : 'bg-background text-muted-foreground'}`}>
                                                <Truck className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <span className="font-black text-xl mt-2">Cash on Delivery</span>
                                        <span className="text-sm font-bold text-muted-foreground">Pay when food arrives.</span>
                                    </label>
                                    
                                    <div className={`p-6 rounded-[2rem] border-2 border-border bg-muted/30 flex flex-col gap-3 relative opacity-60 cursor-not-allowed`}>
                                        <div className="absolute top-4 right-4 bg-accent text-secondary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                            Coming Soon
                                        </div>
                                        <div className="flex justify-between items-center w-full">
                                            <input 
                                                type="radio" 
                                                name="paymentMethod" 
                                                value="ONLINE" 
                                                disabled
                                                className="w-5 h-5 accent-primary cursor-not-allowed"
                                            />
                                            <div className={`p-3 rounded-xl bg-background text-muted-foreground`}>
                                                <Wallet className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <span className="font-black text-xl mt-2">Pay Online</span>
                                        <span className="text-sm font-bold text-muted-foreground">Cards, UPI & Net Banking.</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="w-full xl:w-[450px]">
                        <div className="card-premium p-8 sticky top-[100px] bg-secondary text-white border-none shadow-2xl relative overflow-hidden">
                            <Flame className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5" />
                            
                            <h3 className="text-3xl font-black mb-8 tracking-tighter relative z-10">Your Feast</h3>
                            
                            <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-5 custom-scrollbar relative z-10">
                                {cart.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-lg">
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-primary bg-white/10 px-3 py-1.5 rounded-xl text-sm shadow-sm">{item.quantity}x</span>
                                            <span className="font-bold opacity-90 truncate max-w-[180px]">{item.menuItemName}</span>
                                        </div>
                                        <span className="font-black">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Apply Coupon Section */}
                            <div className="mb-6 relative z-10">
                                {!appliedCoupon ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                    placeholder="Enter coupon code"
                                                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder-white/40 font-mono font-bold text-sm focus:outline-none focus:border-white/50"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading || !couponCode.trim()}
                                                className="px-4 py-2.5 bg-white text-primary font-black text-sm rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                            >
                                                {couponLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && <p className="text-red-300 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{couponError}</p>}
                                    </div>
                                ) : (
                                    <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-3 flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-black text-sm text-green-300 font-mono">{appliedCoupon.code}</p>
                                            <p className="text-xs text-green-200/80 font-medium truncate">{appliedCoupon.description}</p>
                                        </div>
                                        <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-4 pt-6 border-t border-white/10 mb-8 relative z-10">
                                <div className="flex justify-between font-bold opacity-60">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between font-bold text-green-300">
                                        <span>Discount ({appliedCoupon.code})</span>
                                        <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-success">
                                    <span>Delivery Fee</span>
                                    <span className="tracking-widest uppercase">Free</span>
                                </div>
                                <div className="flex justify-between text-4xl font-black mt-8">
                                    <span>Total</span>
                                    <span className="text-primary tracking-tighter">₹{appliedCoupon ? Math.max(0, subtotal - appliedCoupon.discountAmount).toFixed(2) : subtotal}</span>
                                </div>
                            </div>

                            {minimumOrderAmount > 0 && subtotal < minimumOrderAmount && (
                                <div className="mb-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-400/30 text-orange-100 relative z-10">
                                    <p className="font-black text-sm">Add ₹{(minimumOrderAmount - subtotal).toFixed(2)} more to place your order.</p>
                                    <p className="text-xs opacity-80 mt-1">Minimum order value: ₹{minimumOrderAmount.toFixed(2)}</p>
                                </div>
                            )}

                            <button 
                                type="submit"
                                form="checkout-form"
                                disabled={loading || fetchingAddresses || (addresses.length === 0 && !selectedAddress) || (minimumOrderAmount > 0 && subtotal < minimumOrderAmount)}
                                className="btn-primary w-full h-16 text-xl tracking-tight !bg-white !text-primary hover:!bg-primary hover:!text-white shadow-2xl shadow-black/40 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : (formData.paymentMethod === 'ONLINE' ? 'Proceed to Pay' : 'Place Order')}
                            </button>
                            
                            <div className="mt-8 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest opacity-50 justify-center relative z-10">
                                <ShieldCheck className="w-4 h-4 text-success" />
                                100% Secure Checkout
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Gateway Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                    <div className="bg-card w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300">
                        <div className="bg-primary p-8 text-white text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 text-white/70 hover:text-white relative z-10 p-2 bg-black/20 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                            <ShieldCheck className="w-14 h-14 mx-auto mb-4 relative z-10" />
                            <h2 className="text-3xl font-black tracking-tight relative z-10">Secure Payment</h2>
                            <p className="opacity-90 font-bold text-sm tracking-widest uppercase mt-2 relative z-10">PanipuriStore Pay</p>
                        </div>
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10 pb-6 border-b border-border border-dashed">
                                <span className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Amount to pay</span>
                                <span className="text-4xl font-black text-primary tracking-tighter">₹{subtotal}</span>
                            </div>
                            <form onSubmit={handlePaymentSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">Card Number</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="0000 0000 0000 0000" 
                                        className="input-premium font-mono tracking-widest h-14 text-lg"
                                        value={cardDetails.number}
                                        onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">Expiry</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="MM/YY" 
                                            className="input-premium font-mono h-14 text-lg text-center"
                                            value={cardDetails.expiry}
                                            onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3">CVV</label>
                                        <input 
                                            type="password" 
                                            required
                                            placeholder="•••" 
                                            maxLength="3"
                                            className="input-premium font-mono h-14 text-lg text-center"
                                            value={cardDetails.cvv}
                                            onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium text-center mt-6 flex items-center justify-center gap-1.5 p-3 bg-muted rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-primary" /> Enter CVV <strong className="text-primary font-black">000</strong> to trigger dev error.
                                </p>
                                <button 
                                    type="submit" 
                                    disabled={paymentProcessing}
                                    className="btn-primary w-full h-16 text-xl mt-6 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                                >
                                    {paymentProcessing ? (
                                        <><div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div> Processing...</>
                                    ) : (
                                        <><Fingerprint className="w-6 h-6" /> Authenticate & Pay</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Developer-Friendly Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
                    <div className="bg-card w-full max-w-2xl rounded-[3rem] shadow-2xl border-2 border-danger/20 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 pb-4 text-center relative">
                            <button onClick={() => setShowErrorModal(false)} className="absolute top-8 right-8 p-3 rounded-full bg-muted hover:bg-border text-muted-foreground transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-8 text-danger shadow-inner border border-danger/20">
                                <AlertTriangle className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter mb-4">Transaction Failed</h2>
                            <p className="text-xl text-muted-foreground font-medium mb-10 max-w-lg mx-auto">
                                {errorDetails.message}
                            </p>
                        </div>
                        
                        <div className="bg-muted/50 p-10 border-t border-border">
                            <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                <ShieldCheck className="w-4 h-4" /> Developer Diagnostics
                            </div>
                            <pre className="bg-black text-green-400 p-6 rounded-2xl text-sm font-mono overflow-x-auto shadow-inner leading-relaxed">
                                <code>{errorDetails.devInfo}</code>
                            </pre>
                            <div className="mt-10 flex gap-6">
                                <button onClick={() => setShowErrorModal(false)} className="btn-primary flex-1 h-16 bg-danger hover:bg-red-600 border-none shadow-xl shadow-danger/20">
                                    Dismiss
                                </button>
                                <button onClick={() => {setShowErrorModal(false); setShowPaymentModal(true)}} className="btn-secondary flex-1 h-16 flex items-center justify-center bg-transparent border-2 border-danger/30 hover:border-danger hover:bg-danger/10 text-danger font-black">
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;