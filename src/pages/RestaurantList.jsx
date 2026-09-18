import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { Star, Clock, Search, SlidersHorizontal, ArrowUpDown, Store } from 'lucide-react';

const RestaurantList = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';
    const initialCategory = queryParams.get('category') || 'All';
    
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [sortBy, setSortBy] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Panipuri Store specific categories
    const categories = ['All', 'Street Food', 'Chaat', 'Beverages', 'Fast Food', 'North Indian'];

    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoading(true);
            try {
                const params = {};
                if (debouncedSearch) params.search = debouncedSearch;
                if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
                if (sortBy) params.sortBy = sortBy;
                const res = await axios.get('/restaurants/public', { params });
                setRestaurants(res.data);
            } catch (error) {
                console.error("Error fetching restaurants", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurants();
    }, [debouncedSearch, selectedCategory, sortBy]);

    return (
        <div className="pt-28 pb-20 min-h-screen bg-background">
            <div className="section-padding">
                {/* Header & Search */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
                    <div className="max-w-2xl">
                        <span className="badge-premium bg-accent/20 text-accent mb-4">Discover</span>
                        <h1 className="text-5xl font-black tracking-tighter mb-4">
                            {debouncedSearch ? `Search: "${debouncedSearch}"` : 'Our Restaurants'}
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg">Find the nearest Beohari Pani Puri Store and satisfy your street food cravings instantly.</p>
                    </div>
                    
                    <div className="relative group max-w-md w-full">
                        <input
                            type="text"
                            placeholder="Search restaurants..."
                            className="input-premium pl-14 h-16 text-lg shadow-sm group-focus-within:shadow-md group-focus-within:border-primary/30 transition-all rounded-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4 mb-12 sticky top-[80px] z-40 glass p-3 rounded-full border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-md shadow-primary/20">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                    </div>

                    <div className="h-6 w-px bg-border mx-1"></div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-grow">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                                    selectedCategory === cat 
                                    ? 'bg-foreground text-background shadow-md' 
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto hidden md:flex items-center">
                        <div className="relative">
                            <select 
                                className="appearance-none bg-transparent border-none pl-4 pr-10 py-2.5 text-sm font-bold outline-none cursor-pointer text-foreground hover:text-primary transition-colors"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="">Sort: Relevance</option>
                                <option value="rating">Sort: Top Rated</option>
                                <option value="deliveryTime">Sort: Fastest</option>
                            </select>
                            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="animate-pulse card-premium p-4">
                                <div className="bg-muted rounded-2xl h-52 mb-4"></div>
                                <div className="h-6 bg-muted rounded-full w-2/3 mb-3"></div>
                                <div className="h-4 bg-muted rounded-full w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center py-24 bg-muted/30 rounded-[3rem] border border-dashed border-border">
                        <div className="bg-background w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Search className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-black mb-3">No restaurants found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">We couldn't find any stores matching your criteria. Try resetting the filters.</p>
                        <button 
                            onClick={() => {setSearchTerm(''); setSelectedCategory('All'); setSortBy('');}} 
                            className="btn-primary"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {restaurants.map(restaurant => (
                            <Link to={`/restaurant/${restaurant.id}`} key={restaurant.id} className="card-premium group flex flex-col hover:border-primary/30">
                                <div className="relative h-60 p-3 pb-0">
                                    <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                        <img 
                                            src={restaurant.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80'} 
                                            alt={restaurant.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        
                                        <div className="absolute top-3 left-3">
                                            <div className="bg-white/90 backdrop-blur-sm text-foreground px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg shadow-sm">
                                                {restaurant.category}
                                            </div>
                                        </div>

                                        {!restaurant.active && (
                                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                                <span className="bg-foreground text-background font-black px-6 py-2 rounded-full shadow-lg text-sm">Currently Closed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-2xl font-bold group-hover:text-primary transition-colors truncate pr-2">{restaurant.name}</h3>
                                        <div className="bg-success text-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">
                                            {restaurant.rating?.toFixed(1) || '4.5'}
                                            <Star size={12} className="fill-white" />
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground text-sm line-clamp-1 mb-6 font-medium">{restaurant.description || "The original street food taste."}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm font-bold">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Clock className="w-4 h-4 text-primary" /> {restaurant.deliveryTime} mins
                                        </span>
                                        <span className="text-foreground bg-muted px-3 py-1.5 rounded-lg">₹{restaurant.costForTwo} for two</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantList;
