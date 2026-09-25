import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    
    const { login, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(credentials.email, credentials.password);
            toast.success('Login successful!');
            switch(data.role) {
                case 'ROLE_ADMIN': navigate('/admin'); break;
                case 'ROLE_RESTAURANT_OWNER': navigate('/owner'); break;
                case 'ROLE_DELIVERY_AGENT': navigate('/delivery'); break;
                default: navigate('/');
            }
        } catch (err) {
            if (err.response?.status === 503) {
                toast.error('Server/database is temporarily unavailable. Please try again in a moment.');
            } else {
                toast.error(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials. Please try again.');
            }
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
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Google Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Side: Branding/Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center px-20 pb-20 pt-32">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/login_bg.jpg" 
                        className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D32F2F]/80 via-black/50 to-[#E64A19]/30"></div>
                </div>
                
                <div className="relative z-10 text-white max-w-lg">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 rounded-[2rem] w-fit mb-12 shadow-2xl">
                        <Flame className="text-white w-12 h-12" />
                    </div>
                    <h1 className="text-6xl lg:text-7xl font-black mb-8 tracking-tighter leading-none drop-shadow-xl">
                        Craving Street Food? <br /><span className="text-white/80 italic">We got you.</span>
                    </h1>
                    <p className="text-2xl font-medium opacity-90 leading-relaxed mb-12 drop-shadow-md">Sign in to access your favourite Panipuri combos and lightning-fast delivery.</p>
                    
                    <div className="flex items-center gap-10 border-t border-white/20 pt-10 mt-10">
                        <div>
                            <p className="text-5xl font-black mb-2 drop-shadow-lg">100%</p>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Authentic Taste</p>
                        </div>
                        <div className="w-px h-16 bg-white/20"></div>
                        <div>
                            <p className="text-5xl font-black mb-2 drop-shadow-lg">5-Star</p>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Hygiene Quality</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-grow flex items-center justify-center px-8 pb-8 pt-32 lg:px-20 lg:pb-20 lg:pt-32 bg-background">
                <div className="max-w-md w-full animate-in slide-in-from-right duration-700">
                    <div className="mb-12">
                        <h2 className="text-3xl font-black mb-3 tracking-tighter text-foreground">Welcome back!</h2>
                        <p className="text-lg text-muted-foreground font-medium">
                            Don't have an account? {' '}
                            <Link to="/signup" className="text-primary font-bold hover:underline">Create one for free</Link>
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="input-premium pl-16 h-16 text-lg font-medium shadow-sm group-focus-within:shadow-md"
                                    placeholder="Email address"
                                    value={credentials.email}
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
                                    value={credentials.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm font-bold">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" className="w-6 h-6 rounded-lg border-2 border-border appearance-none checked:bg-primary checked:border-primary transition-all cursor-pointer peer" />
                                    <ShieldCheck className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                </div>
                                <span className="group-hover:text-primary transition-colors">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-primary hover:underline hover:text-primary/80 transition-colors">Forgot password?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary h-16 text-xl tracking-tight shadow-xl shadow-primary/20 mt-4 flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Signing in...</>
                            ) : (
                                <>Sign In to Panipuri Store <ArrowRight className="w-6 h-6" /></>
                            )}
                        </button>

                        <div className="relative py-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border border-dashed"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-muted-foreground"><span className="bg-background px-4">Or Quick Login</span></div>
                        </div>

                        <div className="flex justify-center">
                            <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-border hover:border-primary transition-all p-1">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => toast.error('Google Login Failed')}
                                    theme="filled_black"
                                    shape="circle"
                                    text="signin_with"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
