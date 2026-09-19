import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Plus, X, ShoppingBag, Clock, MapPin, Star, ChevronRight, Heart, Share2, Flame, Search, Tag, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const Menu = () => {
    const { id } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialCategory = queryParams.get('category') || 'All';

    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [error, setError] = useState(null);
    const { addToCart, error: cartError } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    const [addingItemId, setAddingItemId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [restaurantCoupons, setRestaurantCoupons] = useState([]);
    const [showAllOffers, setShowAllOffers] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [restRes, menuRes] = await Promise.all([
                    axios.get(`/restaurants/public/${id}`),
                    axios.get(`/menu/public/restaurant/${id}`)
                ]);
                setRestaurant(restRes.data);
                setMenuItems(menuRes.data);
                
                const reviewsRes = await axios.get(`/reviews/restaurant/${id}`);
                setReviews(reviewsRes.data);

                // Fetch active coupons for this restaurant
                try {
                    const couponRes = await axios.get(`/coupons/public/restaurant/${id}`);
                    setRestaurantCoupons(couponRes.data || []);
                } catch (e) { /* silently ignore if no coupons */ }
                
                if (user && user.role === 'ROLE_CUSTOMER') {
                    try {
                        const favRes = await axios.get(`/favorites/check/${id}`);
                        setIsFavorite(favRes.data);
                    } catch (favError) {
                        console.error("Error fetching favorite status", favError);
                    }
                }
            } catch (error) {
                console.error("Error fetching menu", error);
                if (error.code === 'ERR_NETWORK') {
                    toast.error('Network error: Server is unreachable.');
                    setError('Network error: Server is unreachable.');
                } else if (error.response?.status === 401) {
                    toast.error('Access denied: You might need to log in for some features.');
                    setError('Access denied: You might need to log in for some features.');
                } else {
                    toast.error('Failed to load menu details. Please try again.');
                    setError('Failed to load menu details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, user]);

    const handleAddToCart = async (item) => {
        if (!user || user.role !== 'ROLE_CUSTOMER') {
            toast.error('Please login as a customer to add items to cart.');
            return;
        }

        setAddingItemId(item.id);
        try {
            await addToCart(item.id, 1);
            toast.success(`Added ${item.name}`);
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to add to cart");
            }
            console.error(error);
        } finally {
            setAddingItemId(null);
        }
    };

    const handleToggleFavorite = async () => {
        if (!user || user.role !== 'ROLE_CUSTOMER') {
            toast.error('Please login to add favorites.');
            return;
        }
        try {
            const res = await axios.post(`/favorites/toggle/${id}`);
            setIsFavorite(!isFavorite);
            toast.success(res.data.message);
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error("Failed to update favorites");
            }
            console.error(error);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            await axios.post('/reviews/add', {
                restaurantId: id,
                rating: newReview.rating,
                comment: newReview.comment
            });
            setNewReview({ rating: 5, comment: '' });
            const [reviewsRes, restRes] = await Promise.all([
                axios.get(`/reviews/restaurant/${id}`),
                axios.get(`/restaurants/public/${id}`)
            ]);
            setReviews(reviewsRes.data);
            setRestaurant(restRes.data);
            toast.success("Review submitted!");
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error("Failed to submit review");
            }
            console.error(error);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return (
        <div className="pt-32 flex justify-center h-screen items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-primary border-t-transparent"></div>
        </div>
    );
    
    if (!restaurant) return <div className="pt-32 text-center text-red-500 font-bold">Menu not found</div>;

    const categoriesList = ['All', ...new Set(menuItems.map(item => item.categoryName).filter(Boolean))];
    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.categoryName === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="pt-24 pb-20 min-h-screen bg-background">

            {/* Banner & Info */}
            <div className="section-padding !py-8">
                <div className="relative h-[300px] md:h-[450px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-8 md:mb-12 shadow-2xl group">
                    <img 
                        src={restaurant.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1600&fit=crop'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                        alt={restaurant.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
                    
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-3">
                        <button 
                            onClick={handleToggleFavorite}
                            className={`glass p-3 rounded-full transition-all shadow-xl hover:scale-110 ${isFavorite ? 'text-primary bg-white' : 'hover:bg-white hover:text-primary text-white'}`}
                        >
                            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                        </button>
                    </div>

                    <div className="absolute bottom-6 left-5 right-5 md:bottom-10 md:left-10 md:right-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                        <div className="text-white">
                            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                                <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Top Rated</span>
                                <div className="flex items-center gap-1.5 bg-success text-white px-3 py-1 rounded-full font-black text-sm">
                                    <Star className="w-4 h-4 fill-white" />
                                    {restaurant.rating?.toFixed(1) || '4.5'}
                                </div>
                            </div>
                            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-3 md:mb-4 tracking-tighter drop-shadow-lg line-clamp-2">{restaurant.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-6 text-[11px] md:text-sm font-bold opacity-90">
                                <span className="flex items-center gap-2"><MapPin className="text-primary w-5 h-5" /> {restaurant.location}</span>
                                <span className="flex items-center gap-2"><Clock className="text-primary w-5 h-5" /> {restaurant.deliveryTime} mins avg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offers / Coupons Section */}
                {restaurantCoupons.length > 0 && (
                    <div className="mb-8 rounded-[2rem] border-2 border-primary/20 bg-primary/5 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 cursor-pointer"
                            onClick={() => setShowAllOffers(!showAllOffers)}>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/15 p-2 rounded-xl">
                                    <Tag className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-primary">{restaurantCoupons.length} Offer{restaurantCoupons.length > 1 ? 's' : ''} Available</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Tap to see all deals</p>
                                </div>
                            </div>
                            {showAllOffers ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-primary" />}
                        </div>
                        {showAllOffers && (
                            <div className="divide-y divide-primary/10">
                                {restaurantCoupons.map(coupon => (
                                    <div key={coupon.id} className="flex items-center gap-4 px-6 py-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                                            <Tag className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="font-black text-sm mb-0.5">
                                                {coupon.discountType === 'FLAT'
                                                    ? `₹${coupon.flatDiscountAmount} OFF`
                                                    : `${coupon.discountPercentage}% OFF${coupon.maxDiscountAmount ? ` up to ₹${coupon.maxDiscountAmount}` : ''}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                                                {coupon.description || 'Use this code at checkout'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                {coupon.minOrderAmount > 0 && (
                                                    <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">Min ₹{coupon.minOrderAmount}</span>
                                                )}
                                                {coupon.expiryDate && (
                                                    <span className="text-[10px] font-bold text-muted-foreground">Expires {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success(`Code "${coupon.code}" copied!`); }}
                                            className="flex-shrink-0 flex items-center gap-1.5 border-2 border-dashed border-primary/40 text-primary font-black text-xs px-3 py-2 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all"
                                        >
                                            <span className="font-mono tracking-wider">{coupon.code}</span>
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start w-full min-w-0 overflow-x-hidden">
                    <div className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden">
                        {/* Search Bar */}
                        <div className="relative mb-6 w-full max-w-full min-w-0">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input 
                                type="text"
                                placeholder="Search for pani puri, chaat, beverages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full max-w-full min-w-0 box-border bg-background border border-border rounded-full py-4 pl-12 sm:pl-14 pr-4 sm:pr-6 font-medium shadow-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        {/* Categories Sticky Nav */}
                        <div className="flex w-full max-w-full min-w-0 gap-2 sm:gap-3 overflow-x-auto overflow-y-hidden pb-4 no-scrollbar sticky top-[80px] z-30 bg-background/95 backdrop-blur-md py-4 border-b border-border mb-6 snap-x snap-mandatory">
                            {categoriesList.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap snap-center ${
                                        activeCategory === cat 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                        : 'bg-muted text-muted-foreground hover:bg-border'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Menu Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8 w-full min-w-0">
                            {filteredItems.map(item => (
                                <div key={item.id} className="card-premium w-full max-w-full overflow-hidden p-2 md:p-4 flex gap-2 md:gap-5 hover:border-primary/30 min-w-0">
                                    <div className="w-[76px] h-[76px] sm:w-24 sm:h-24 md:w-40 md:h-40 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 relative group">
                                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                                        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2">
                                            {item.vegOrNonVeg === 'Veg' ? (
                                                <div className="bg-white p-0.5 md:p-1 rounded-md border-2 border-green-600 shadow-sm">
                                                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-600"></div>
                                                </div>
                                            ) : (
                                                <div className="bg-white p-0.5 md:p-1 rounded-md border-2 border-red-600 shadow-sm">
                                                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-600"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start mb-0.5 md:mb-1">
                                                <h3 className="text-base md:text-xl font-bold pr-2 leading-tight line-clamp-2">{item.name}</h3>
                                            </div>
                                            <span className="text-primary font-black text-base md:text-xl mb-1 md:mb-2 block">₹{item.price}</span>
                                            <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 leading-snug">{item.description}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-start mt-2 md:mt-4 min-w-0">
                                            <button 
                                                onClick={() => handleAddToCart(item)}
                                                disabled={addingItemId === item.id}
                                                className="inline-flex !w-auto max-w-fit flex-shrink-0 items-center bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full font-bold transition-colors text-xs md:text-sm shadow-sm whitespace-nowrap"
                                            >
                                                {addingItemId === item.id ? 'Adding...' : 'Add to Cart +'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Responsive Quick Cart */}
                    <div className="w-full lg:w-96 lg:sticky lg:top-[100px] mt-2 lg:mt-0">
                        <div className="bg-muted/50 border border-border rounded-2xl lg:rounded-[2rem] p-3 sm:p-4 lg:p-8 shadow-inner">
                            <h3 className="text-base sm:text-lg lg:text-2xl font-black mb-3 lg:mb-6 flex items-center gap-2 lg:gap-3">
                                <ShoppingBag className="text-primary w-5 h-5 lg:w-6 lg:h-6" />
                                Your Order
                            </h3>
                            <div className="flex items-center gap-3 sm:gap-4 lg:block text-left lg:text-center py-3 sm:py-4 lg:py-12 px-3 lg:px-4 bg-background rounded-xl lg:rounded-3xl border border-border shadow-sm">
                                <div className="bg-muted w-11 h-11 sm:w-12 sm:h-12 lg:w-20 lg:h-20 rounded-full flex-shrink-0 flex items-center justify-center lg:mx-auto lg:mb-6">
                                    <ShoppingBag className="text-muted-foreground w-5 h-5 lg:w-8 lg:h-8 opacity-50" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-muted-foreground font-medium text-xs sm:text-sm mb-2 lg:mb-8">
                                        Craving something crispy and tangy? Add items to start your order.
                                    </p>
                                    <Link to="/cart" className="btn-primary inline-flex w-auto lg:w-full px-4 py-2.5 lg:py-3 text-xs sm:text-sm shadow-lg shadow-primary/20">
                                        Go to Cart
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="section-padding !py-20 bg-muted/30">
                <div className="flex flex-col lg:flex-row gap-16">
                    <div className="lg:w-1/3">
                        <h2 className="text-4xl font-black mb-8 tracking-tighter">Reviews</h2>
                        <div className="card-premium p-10 bg-primary border-transparent text-white text-center mb-10 shadow-xl shadow-primary/20">
                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-4">Overall Experience</p>
                            <div className="text-7xl font-black mb-4 flex items-center justify-center gap-2">
                                {restaurant.rating?.toFixed(1) || '4.5'}
                                <Star className="w-10 h-10 fill-white" />
                            </div>
                            <p className="font-bold opacity-90">{reviews.length} verified foodies</p>
                        </div>

                        {user && user.role === 'ROLE_CUSTOMER' && (
                            <div className="card-premium p-8 shadow-lg border-border">
                                <h3 className="text-xl font-bold mb-6">Leave a Review</h3>
                                <form onSubmit={handleReviewSubmit} className="space-y-6">
                                    <div>
                                        <div className="flex gap-2 justify-center mb-4">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button 
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                                    className={`p-2 transition-all hover:scale-110 ${newReview.rating >= star ? 'text-accent' : 'text-muted-foreground'}`}
                                                >
                                                    <Star className={`w-8 h-8 ${newReview.rating >= star ? 'fill-accent' : ''}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <textarea 
                                            required
                                            value={newReview.comment}
                                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                            className="input-premium min-h-[120px]"
                                            placeholder="Was the chaat spicy enough?"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={submittingReview}
                                        className="btn-primary w-full h-14"
                                    >
                                        {submittingReview ? 'Posting...' : 'Post Review'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="lg:w-2/3 space-y-6">
                        {reviews.length === 0 ? (
                            <div className="py-20 text-center rounded-[2rem] border-2 border-dashed border-border bg-background">
                                <Flame className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                                <h3 className="text-2xl font-black opacity-40">No reviews yet. Be the first!</h3>
                            </div>
                        ) : (
                            reviews.map(review => (
                                <div key={review.id} className="card-premium p-6 bg-background border-border shadow-sm flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg flex-shrink-0">
                                        {review.userName ? review.userName.charAt(0) : review.userEmail?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-base">{review.userName || review.userEmail}</h4>
                                                <p className="text-[11px] font-bold text-muted-foreground uppercase">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-accent text-secondary px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">
                                                {review.rating} <Star className="w-3.5 h-3.5 fill-secondary" />
                                            </div>
                                        </div>
                                        <p className="text-foreground/90 font-medium leading-relaxed mt-2">{review.comment}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Menu;
