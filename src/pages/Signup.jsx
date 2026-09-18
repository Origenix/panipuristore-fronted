import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Store, User, Mail, Lock, Phone, MapPin, ShieldCheck, ArrowRight, ShoppingBag, ChevronRight, Flame } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'CUSTOMER',
    });

    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, verifyOtp, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await register(formData);
            toast.success(res.data?.message || 'OTP sent to your email!');
            setStep(2);
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to register.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await verifyOtp(formData.email, otp);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Invalid OTP.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const data = await googleLogin(credentialResponse.credential);
            toast.success('Login successful!');
            switch(data.role) {
                case 'ROLE_ADMIN': navigate('/admin'); break;
                case 'ROLE_RESTAURANT_OWNER': navigate('/owner'); break;
                case 'ROLE_DELIVERY_AGENT': navigate('/delivery'); break;
                default: navigate('/');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Google Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isCustomer = formData.role === 'CUSTOMER';

    if (step === 2) {
        return (
            <div className="min-h-screen flex items-center justify-center px-8 pb-8 pt-32 bg-background">
                <div className="max-w-md w-full animate-in slide-in-from-right duration-700 bg-card p-10 rounded-3xl border border-border shadow-2xl">
                    <h2 className="text-4xl font-black mb-4 tracking-tighter text-foreground text-center">Verify Email</h2>
                    <p className="text-center text-muted-foreground mb-8">We've sent an OTP to <strong>{formData.email}</strong>. Please enter it below.</p>
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                required
                                className="input-premium pl-16 h-16 text-2xl font-black tracking-widest text-center shadow-sm group-focus-within:shadow-md"
                                placeholder="000000"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary h-16 text-xl tracking-tight shadow-xl shadow-primary/20 flex justify-center items-center gap-3"
                        >
                            {loading ? (
                                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Verifying...</>
                            ) : (
                                <>Verify OTP <ArrowRight className="w-6 h-6" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Side: Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center px-20 pb-20 pt-32">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?w=1200&fit=crop" 
                        className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#D32F2F]/90 via-black/40 to-[#E64A19]/30"></div>
                </div>
                
                <div className="relative z-10 text-white max-w-lg mt-10">
                    <h1 className="text-6xl lg:text-7xl font-black mb-8 tracking-tighter leading-none drop-shadow-xl">
                        Join the <br /><span className="text-white/90 italic border-b-8 border-primary inline-block">Panipuri Tribe.</span>
                    </h1>
                    <p className="text-2xl font-medium opacity-90 leading-relaxed mb-12 drop-shadow-md">Create an account to unlock exclusive street food offers, combos, and instant cravings delivery.</p>
                    
                    <div className="space-y-8 mt-12 border-t border-white/20 pt-12">
                        {[
                            { icon: Flame, title: 'Authentic Street Flavors', desc: 'Fresh ingredients, hygienic prep, real taste.' },
                            { icon: ShieldCheck, title: '100% Safe Payments', desc: 'Secure COD and Online payment options.' },
                            { icon: ShoppingBag, title: 'Lightning Fast Delivery', desc: 'Get your chaat while it is still crispy.' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-5 items-start group">
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl group-hover:bg-primary/40 transition-colors border border-white/10 shadow-lg">
                                    <item.icon className="text-white w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl drop-shadow-md mb-1">{item.title}</h3>
                                    <p className="text-sm opacity-70 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-grow flex items-center justify-center px-8 pb-8 pt-32 lg:px-20 lg:pb-20 lg:pt-32 bg-background">
                <div className="max-w-xl w-full animate-in slide-in-from-right duration-700">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black mb-3 tracking-tighter text-foreground">Get Started</h2>
                        <p className="text-lg text-muted-foreground font-medium">
                            Already a member? {' '}
                            <Link to="/login" className="text-primary font-bold hover:underline">Sign in instead</Link>
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="input-premium pl-16 h-16 text-lg font-medium shadow-sm group-focus-within:shadow-md"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="input-premium pl-16 h-16 text-lg font-medium shadow-sm group-focus-within:shadow-md"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="input-premium pl-16 h-16 text-lg font-medium shadow-sm group-focus-within:shadow-md"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                                <input
                                    name="phone"
                                    type="text"
                                    required
                                    className="input-premium pl-16 h-16 text-lg font-medium shadow-sm group-focus-within:shadow-md"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                            <select
                                name="role"
                                className="input-premium pl-16 h-16 text-lg font-bold appearance-none cursor-pointer shadow-sm group-focus-within:shadow-md bg-muted/50 text-foreground"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="CUSTOMER">I am a Foodie (Customer)</option>
                                <option value="RESTAURANT_OWNER">I am a Store Owner</option>
                                <option value="DELIVERY_AGENT">I am a Delivery Partner</option>
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 rotate-90 pointer-events-none" />
                        </div>

                        {isCustomer && (
                            <div className="relative group">
                                <MapPin className="absolute left-5 top-6 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                                <textarea
                                    name="address"
                                    rows="3"
                                    required
                                    placeholder="Your detailed delivery address..."
                                    className="input-premium pl-16 py-5 min-h-[140px] font-medium shadow-sm group-focus-within:shadow-md text-lg"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary h-16 text-xl tracking-tight mt-8 shadow-xl shadow-primary/20 flex justify-center items-center gap-3"
                        >
                            {loading ? (
                                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Setting up...</>
                            ) : (
                                <>Create My Account <ArrowRight className="w-6 h-6" /></>
                            )}
                        </button>

                        <div className="relative py-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border border-dashed"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-muted-foreground"><span className="bg-background px-4">Or Quick Sign Up</span></div>
                        </div>

                        <div className="flex justify-center">
                            <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-border hover:border-primary transition-all p-1">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => toast.error('Google Signup Failed')}
                                    theme="filled_black"
                                    shape="circle"
                                    text="signup_with"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;