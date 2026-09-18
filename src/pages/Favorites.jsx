import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { Star, Clock, Heart, ArrowLeft, Store } from 'lucide-react';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/favorites/my');
            setFavorites(res.data);
        } catch (error) {
            console.error("Error fetching favorites", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const toggleFavorite = async (restaurantId) => {
        try {
            await axios.post(`/favorites/toggle/${restaurantId}`);
            fetchFavorites(); // Refresh list
        } catch (error) {
            console.error("Error toggling favorite", error);
        }
    };

    return (
        <div className="pt-28 pb-20 min-h-screen bg-background">
            <div className="section-padding">
                <div className="flex items-center gap-4 mb-12">
                   <Link to="/restaurants" className="p-3 rounded-full bg-muted hover:bg-border transition-all">
                        <ArrowLeft className="w-6 h-6" />
                   </Link>
                   <h1 className="text-4xl font-black tracking-tighter uppercase text-primary">Your Favorites</h1>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="animate-pulse card-premium p-4">
                                <div className="bg-muted rounded-2xl h-56 mb-4"></div>
                                <div className="h-6 bg-muted rounded-full w-3/4 mb-3"></div>
                                <div className="h-4 bg-muted rounded-full w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-[3rem] border border-dashed border-border max-w-3xl mx-auto">
                        <div className="bg-background w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <Heart className="w-12 h-12 text-muted-foreground opacity-30" />
                        </div>
                        <h1 className="text-4xl font-black mb-4 tracking-tighter">No favorites yet</h1>
                        <p className="text-lg text-muted-foreground font-medium mb-10 max-w-sm mx-auto">Save your favorite Panipuri Stores to find them quickly and order in a tap.</p>
                        <Link to="/restaurants" className="btn-primary inline-flex gap-2 items-center">
                            <Store className="w-5 h-5" /> Explore Locations
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {favorites.map(fav => {
                            return (
                                <div key={fav.id} className="card-premium group relative flex flex-col hover:border-primary/30">
                                    <button 
                                        onClick={(e) => { e.preventDefault(); toggleFavorite(fav.restaurantId); }}
                                        className="absolute top-6 right-6 z-10 p-3 rounded-full bg-white/90 backdrop-blur-sm text-primary shadow-lg hover:scale-110 transition-all border border-white/20"
                                    >
                                        <Heart className="w-5 h-5 fill-primary" />
                                    </button>
                                    
                                    <Link to={`/restaurant/${fav.restaurantId}`} className="flex flex-col flex-grow">
                                        <div className="relative h-60 p-3 pb-0">
                                            <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                                <img 
                                                    src={fav.restaurantImage || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80'} 
                                                    alt={fav.restaurantName} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                
                                                <div className="absolute top-3 left-3">
                                                    <div className="bg-white/90 backdrop-blur-sm text-foreground px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg shadow-sm">
                                                        {fav.restaurantCategory || 'Street Food'}
                                                    </div>
                                                </div>
                                                
                                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 text-foreground shadow-sm">
                                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                                        {fav.deliveryTime || '30'}m
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 flex-grow flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate pr-2">{fav.restaurantName}</h3>
                                                <div className="bg-success text-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">
                                                    {fav.restaurantRating?.toFixed(1) || '4.0'}
                                                    <Star size={12} className="fill-white" />
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground text-sm line-clamp-1 mb-6 font-medium">{fav.restaurantDescription || "Your favorite street food spot."}</p>
                                            
                                            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm font-bold">
                                                <span className="text-muted-foreground">Budget</span>
                                                <span className="text-foreground bg-muted px-3 py-1.5 rounded-lg">₹{fav.costForTwo || '200'} for two</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
