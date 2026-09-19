import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun,
  Heart,
  Store,
  MapPin
} from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userLocation, setUserLocation] = useState('Fetching location...');

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        
        const fetchLocation = async () => {
            const savedLocation = localStorage.getItem('userLocation');
            if (savedLocation) {
                setUserLocation(savedLocation);
                return;
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        
                        const address = data.address;
                        const shortAddress = address.suburb || address.city_district || address.city || address.town || address.village || 'Unknown Location';
                        const displayAddress = `${shortAddress}${address.city && address.city !== shortAddress ? `, ${address.city}` : ''}`;
                        
                        setUserLocation(displayAddress);
                        localStorage.setItem('userLocation', displayAddress);
                    } catch (error) {
                        console.error("Error fetching address:", error);
                        setUserLocation('Location unavailable');
                    }
                }, (error) => {
                    console.error("Geolocation error:", error);
                    setUserLocation('Location access denied');
                });
            } else {
                setUserLocation('Geolocation not supported');
            }
        };

        fetchLocation();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const cartItemsCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'glass py-3 md:py-4 shadow-sm' : 'bg-transparent py-4 md:py-6'
        }`}>
            <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between">
                
                <div className="flex items-center gap-8 min-w-0">
                    <Link to="/" className="flex items-center gap-2 md:gap-3 group min-w-0">
                        <div className="bg-primary p-2 md:p-2.5 rounded-xl md:rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20 shrink-0">
                            <Store className="text-white w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl md:text-2xl font-black tracking-tight leading-none whitespace-nowrap">
                                PANIPURI<span className="text-primary">STORE</span>
                            </span>
                            <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-0.5">
                                Premium Street Food
                            </span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex flex-col cursor-pointer group">
                        <span className="text-[10px] font-black tracking-widest text-primary uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Delivering to
                        </span>
                        <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 max-w-[200px]">
                            {userLocation}
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    {(!user || user.role === 'ROLE_CUSTOMER') && (
                        <>
                            <Link to="/menu" className="font-bold text-foreground/80 hover:text-primary transition-colors">Our Menu</Link>
                            <Link to="/restaurants" className="font-bold text-foreground/80 hover:text-primary transition-colors">Restaurants</Link>
                            {!user && <Link to="/subscription-plans" className="font-bold text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">Subscription</Link>}
                        </>
                    )}
                    
                    <div className="w-px h-6 bg-border mx-2"></div>

                    <button 
                        onClick={toggleDarkMode}
                        className="p-2.5 rounded-full bg-muted hover:bg-border text-foreground transition-all"
                        aria-label="Toggle Dark Mode"
                    >
                        {darkMode ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-secondary" />}
                    </button>

                    {user ? (
                        <div className="flex items-center gap-4">
                            {user.role === 'ROLE_CUSTOMER' && (
                                <>
                                    <Link to="/favorites" className="p-2.5 rounded-full bg-muted hover:bg-border transition-all">
                                        <Heart className="w-5 h-5 text-primary" />
                                    </Link>

                                    <Link to="/cart" className="relative p-2.5 rounded-full bg-primary hover:bg-primary-hover text-white transition-all shadow-md shadow-primary/20 group hover:-translate-y-0.5" aria-label="Cart">
                                        <ShoppingBag className="w-5 h-5" />
                                        {cartItemsCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-accent text-secondary text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-background shadow-sm animate-in zoom-in duration-300">
                                                {cartItemsCount}
                                            </span>
                                        )}
                                    </Link>
                                </>
                            )}

                            <div className="flex items-center gap-3 pl-4 border-l border-border">
                                <Link to={user.role === 'ROLE_ADMIN' ? '/admin' : user.role === 'ROLE_RESTAURANT_OWNER' ? '/owner' : user.role === 'ROLE_DELIVERY_AGENT' ? '/delivery' : '/orders'}>
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border hover:border-primary/50 transition-colors">
                                        <UserIcon className="w-5 h-5 text-secondary dark:text-foreground" />
                                    </div>
                                </Link>
                                <button onClick={logout} className="p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-all">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 pl-2">
                            <Link to="/login" className="font-bold hover:text-primary transition-colors px-3 py-2">Log in</Link>
                            <Link to="/signup" className="btn-primary text-sm px-6 py-2.5">Sign up</Link>
                        </div>
                    )}
                </div>

                <div className="md:hidden flex items-center gap-2">
                    {user?.role === 'ROLE_CUSTOMER' && (
                        <Link
                            to="/cart"
                            aria-label="Cart"
                            className="relative p-2.5 rounded-full bg-primary text-white shadow-md shadow-primary/20 shrink-0"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {cartItemsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-accent text-secondary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                                    {cartItemsCount}
                                </span>
                            )}
                        </Link>
                    )}
                    <button 
                        className="p-2 rounded-full bg-muted text-foreground shrink-0"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Open menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-2xl animate-in slide-in-from-top-2 duration-300">
                    <div className="p-6 space-y-2">
                        <div className="px-4 py-3 mb-2 bg-primary/5 rounded-2xl border border-primary/10">
                            <span className="text-[10px] font-black tracking-widest text-primary uppercase flex items-center gap-1 mb-1">
                                <MapPin className="w-3 h-3" /> Delivering to
                            </span>
                            <span className="text-sm font-bold text-foreground line-clamp-1">
                                {userLocation}
                            </span>
                        </div>
                        
                        <div className="px-4 py-2 flex items-center justify-between">
                            <span className="font-bold">Dark Mode</span>
                            <button onClick={toggleDarkMode} className="p-2 rounded-full bg-muted">
                                {darkMode ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-secondary" />}
                            </button>
                        </div>

                        <div className="h-px bg-border my-4 mx-4"></div>

                        {user ? (
                            <>
                                {user.role !== 'ROLE_CUSTOMER' && (
                                    <Link onClick={() => setIsMobileMenuOpen(false)} to={user.role === 'ROLE_ADMIN' ? '/admin' : user.role === 'ROLE_RESTAURANT_OWNER' ? '/owner' : '/delivery'} className="block px-4 py-3 text-lg font-bold rounded-2xl hover:bg-muted transition-colors">
                                        My Dashboard
                                    </Link>
                                )}
                                {user.role === 'ROLE_CUSTOMER' && (
                                    <>
                                        <Link onClick={() => setIsMobileMenuOpen(false)} to="/favorites" className="block px-4 py-3 text-lg font-bold rounded-2xl hover:bg-muted transition-colors">
                                            My Favorites
                                        </Link>
                                        <Link onClick={() => setIsMobileMenuOpen(false)} to="/profile/addresses" className="block px-4 py-3 text-lg font-bold rounded-2xl hover:bg-muted transition-colors">
                                            My Addresses
                                        </Link>
                                        <Link onClick={() => setIsMobileMenuOpen(false)} to="/cart" className="block px-4 py-3 text-lg font-bold rounded-2xl hover:bg-muted transition-colors">
                                            My Cart
                                        </Link>
                                    </>
                                )}
                                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-lg font-bold text-red-500 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3 pt-2">
                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="btn-secondary w-full text-center py-3.5">Log in</Link>
                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/subscription-plans" className="block px-4 py-3 text-lg font-bold rounded-2xl hover:bg-muted transition-colors">Subscription</Link>
                                <Link onClick={() => setIsMobileMenuOpen(false)} to="/signup" className="btn-primary w-full text-center py-3.5">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
