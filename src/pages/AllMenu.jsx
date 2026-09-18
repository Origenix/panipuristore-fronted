import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Search, Flame, ShoppingBag, Store, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const AllMenu = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [addingItemId, setAddingItemId] = useState(null);

    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await axios.get('/menu/public/all');
                setMenuItems(res.data);
            } catch (error) {
                console.error('Failed to fetch all menu items', error);
                toast.error('Failed to load menu. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

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
        } finally {
            setAddingItemId(null);
        }
    };

    const categoriesList = ['All', ...new Set(menuItems.map(item => item.categoryName).filter(Boolean))];

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.categoryName === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="pt-24 pb-24 min-h-screen bg-background">
            <div className="section-padding">

                {/* Header */}
                <div className="mb-8">
                    <span className="badge-premium bg-primary/10 text-primary mb-4">Full Menu</span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                        All Dishes
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        Explore our complete menu across all outlets.
                    </p>
                </div>

                {/* Search */}
                <div className="relative max-w-xl mb-6">
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-premium pl-14 h-14 text-base rounded-full shadow-sm"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
                    {categoriesList.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                                activeCategory === cat
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-muted text-muted-foreground hover:bg-border hover:text-foreground'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse card-premium p-4">
                                <div className="bg-muted rounded-2xl h-44 mb-4" />
                                <div className="h-5 bg-muted rounded-full w-3/4 mb-2" />
                                <div className="h-4 bg-muted rounded-full w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-[2.5rem] border border-dashed border-border">
                        <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">No dishes found</h3>
                        <p className="text-muted-foreground font-medium mb-6">Try a different search or category.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            className="btn-primary"
                        >
                            Show All Dishes
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="card-premium flex flex-col group">
                                <div className="relative h-44 rounded-t-2xl overflow-hidden">
                                    <img
                                        src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&fit=crop&q=80'}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    {item.trending && (
                                        <div className="absolute top-3 left-3 bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                                            <Flame className="w-3 h-3" /> Trending
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 right-3">
                                        <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${item.vegOrNonVeg === 'VEG' ? 'border-green-500' : 'border-red-500'}`}>
                                            <span className={`w-2 h-2 rounded-full ${item.vegOrNonVeg === 'VEG' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-black text-base leading-tight flex-1">{item.name}</h3>
                                        <span className="text-primary font-black text-base whitespace-nowrap">₹{item.price}</span>
                                    </div>

                                    {item.categoryName && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                            <Tag className="w-3 h-3" /> {item.categoryName}
                                        </span>
                                    )}

                                    {item.description && (
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3 flex-grow">{item.description}</p>
                                    )}

                                    <div className="mt-auto flex flex-col gap-2">
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            disabled={addingItemId === item.id}
                                            className="bg-primary/10 hover:bg-primary text-primary hover:text-white py-2.5 rounded-full font-bold transition-colors text-sm w-full flex items-center justify-center gap-2"
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            {addingItemId === item.id ? 'Adding...' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllMenu;
