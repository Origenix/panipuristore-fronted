import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import { Store, ShoppingBag, Utensils, Edit2, Trash2, Plus, X, Clock, MapPin, IndianRupee, LayoutTemplate, Truck, BarChart3, Settings, Save, CheckCircle, Tag, ToggleLeft, ToggleRight, Copy, Calendar, AlertCircle, LayoutDashboard, Activity, Receipt } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import toast from 'react-hot-toast';

const OwnerDashboard = () => {
    const { user } = useContext(AuthContext);
    const { latestNotification } = useContext(NotificationContext);
    const [restaurants, setRestaurants] = useState([]);
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [ownerReport, setOwnerReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [previousPendingCount, setPreviousPendingCount] = useState(0);
    const [imageFile, setImageFile] = useState(null);

    // New State for Product & Category Management
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    
    const [categoryForm, setCategoryForm] = useState({
        name: '', description: '', displayOrder: 0, active: true, image: '', cloudinaryPublicId: ''
    });

    const [productForm, setProductForm] = useState({
        name: '', description: '', price: '', categoryId: '', vegOrNonVeg: 'Veg', available: true, trending: false, preparationTime: 15, image: '', cloudinaryPublicId: ''
    });

    const fetchCategoriesAndMenu = async (restaurantId) => {
        try {
            const [catRes, menuRes] = await Promise.all([
                axios.get('/categories/all'),
                axios.get(`/menu/restaurant/${restaurantId}/all`)
            ]);
            setCategories(catRes.data);
            setMenuItems(menuRes.data);
        } catch(error) {
            console.error("Failed to fetch products/categories", error);
        }
    };

    // Coupon state
    const [coupons, setCoupons] = useState([]);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [couponForm, setCouponForm] = useState({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountPercentage: '',
        flatDiscountAmount: '',
        maxDiscountAmount: '',
        minOrderAmount: '',
        applicableCategories: [],
        maxUsageCount: '',
        maxUsagePerCustomer: 1,
        startDate: '',
        expiryDate: '',
        active: true
    });
    const [couponLoading, setCouponLoading] = useState(false);
    // Old menu form removed

    const fetchOrdersForRestaurant = async (restId) => {
        try {
            const orderRes = await axios.get(`/orders/restaurant/${restId}`);
            setOrders(orderRes.data);
            const pending = orderRes.data.filter(o => o.orderStatus === 'PENDING_CONFIRMATION').length;
            setPreviousPendingCount(pending);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchDashboardData = async () => {
            try {
                const restRes = await axios.get('/restaurants/owner');
                if (!isMounted) return;
                setRestaurants(restRes.data);
                
                if (restRes.data.length > 0) {
                    const restId = restRes.data[0].id;
                    await fetchOrdersForRestaurant(restId);
                    
                    const [menuRes, catRes, reportRes] = await Promise.all([
                        axios.get(`/menu/restaurant/${restId}/all`),
                        axios.get('/categories/all'),
                        axios.get(`/reports/owner-dashboard/${restId}`)
                    ]);
                    if (isMounted) {
                        setMenuItems(menuRes.data);
                        setCategories(catRes.data);
                        setOwnerReport(reportRes.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch owner data", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDashboardData();
        return () => {
            isMounted = false;
        };
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await axios.get('/coupons/owner/my');
            setCoupons(res.data);
        } catch (e) {
            console.error('Failed to fetch coupons', e);
        }
    };

    useEffect(() => {
        if (activeTab === 'coupons') fetchCoupons();
    }, [activeTab]);

    const [incomingOrderAlert, setIncomingOrderAlert] = useState(null);

    // Listen to real-time STOMP notifications
    useEffect(() => {
        if (latestNotification && restaurants.length > 0) {
            fetchOrdersForRestaurant(restaurants[0].id);
            if (latestNotification.orderId) {
                axios.get(`/orders/${latestNotification.orderId}`)
                    .then(res => setIncomingOrderAlert(res.data))
                    .catch(e => console.error("Failed to fetch incoming order details", e));
            }
        }
    }, [latestNotification, restaurants]);

    const handleMenuChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMenuForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    // Category Handlers
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = categoryForm.image;
            let publicId = categoryForm.cloudinaryPublicId;
            if (imageFile) {
                const formData = new FormData(); formData.append('file', imageFile);
                const uploadRes = await axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
                imageUrl = uploadRes.data.url;
                publicId = uploadRes.data.publicId || '';
            }
            const payload = { ...categoryForm, image: imageUrl, cloudinaryPublicId: publicId };
            if (editingCategory) {
                await axios.put(`/categories/${editingCategory.id}`, payload);
            } else {
                await axios.post('/categories', payload);
            }
            toast.success(`Category ${editingCategory ? 'updated' : 'added'}!`);
            setShowCategoryForm(false); setEditingCategory(null); setImageFile(null);
            setCategoryForm({ name: '', description: '', displayOrder: 0, active: true, image: '', cloudinaryPublicId: '' });
            if (restaurants.length > 0) await fetchCategoriesAndMenu(restaurants[0].id);
        } catch (err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(err.response?.data?.error || err.response?.data?.message || "Invalid request. Please try again.");
            }
        }
    };

    const deleteCategory = async (id) => {
        if(!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`/categories/${id}`);
            if (restaurants.length > 0) await fetchCategoriesAndMenu(restaurants[0].id);
        } catch(err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(err.response?.data || "Failed to delete category");
            }
        }
    };

    const toggleCategoryActive = async (cat) => {
        try {
            const payload = { ...cat, active: !cat.active };
            await axios.put(`/categories/${cat.id}`, payload);
            setCategories(categories.map(c => c.id === cat.id ? payload : c));
        } catch(err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error("Failed to toggle category");
            }
        }
    };

    // Product Handlers
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = productForm.image;
            let publicId = productForm.cloudinaryPublicId;
            if (imageFile) {
                const formData = new FormData(); formData.append('file', imageFile);
                const uploadRes = await axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
                imageUrl = uploadRes.data.url;
                publicId = uploadRes.data.publicId || '';
            }
            const payload = { ...productForm, image: imageUrl, cloudinaryPublicId: publicId, restaurantId: restaurants[0].id };
            if (editingProduct) {
                await axios.put(`/menu/${editingProduct.id}`, payload);
            } else {
                await axios.post('/menu', payload);
            }
            toast.success(`Product ${editingProduct ? 'updated' : 'added'}!`);
            setShowProductForm(false); setEditingProduct(null); setImageFile(null);
            setProductForm({ name: '', description: '', price: '', categoryId: '', vegOrNonVeg: 'Veg', available: true, trending: false, preparationTime: 15, image: '', cloudinaryPublicId: '' });
            if (restaurants.length > 0) await fetchCategoriesAndMenu(restaurants[0].id);
        } catch (err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(err.response?.data?.error || err.response?.data?.message || "Invalid request. Please try again.");
            }
        }
    };

    const deleteProduct = async (id) => {
        if(!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`/menu/${id}`);
            if (restaurants.length > 0) await fetchCategoriesAndMenu(restaurants[0].id);
        } catch(err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error("Failed to delete product");
            }
        }
    };

    const toggleProductActive = async (item) => {
        try {
            const payload = { ...item, available: !item.available };
            await axios.put(`/menu/${item.id}`, payload);
            setMenuItems(menuItems.map(m => m.id === item.id ? payload : m));
        } catch(err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error("Failed to toggle product");
            }
        }
    };

    const toggleProductTrending = async (item) => {
        try {
            const payload = { ...item, trending: !item.trending };
            await axios.put(`/menu/${item.id}`, payload);
            setMenuItems(menuItems.map(m => m.id === item.id ? payload : m));
        } catch(err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error("Failed to toggle trending status");
            }
        }
    };

    const updateOrderItemStock = async (orderId, itemId, unavailable) => {
        try {
            const endpoint = unavailable
                ? `/orders/${orderId}/owner/item/${itemId}/out-of-stock`
                : `/orders/${orderId}/owner/item/${itemId}/restore-stock`;

            await axios.put(endpoint);
            if (restaurants.length > 0) {
                await fetchOrdersForRestaurant(restaurants[0].id);
            }
            toast.success(unavailable ? 'Item marked out of stock. Customer total updated.' : 'Item restored. Customer total updated.');
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to update item stock");
            }
        }
    };
    const updateOrderStatus = async (orderId, action, reason = '', role = 'owner') => {
        try {
            const url = `/orders/${orderId}/${role}/${action}${reason ? `?reason=${reason}` : ''}`;
            await axios.put(url);
            
            // Refetch orders immediately
            if (restaurants.length > 0) {
                await fetchOrdersForRestaurant(restaurants[0].id);
                // Also refetch report stats
                axios.get(`/reports/owner-dashboard/${restaurants[0].id}`).then(res => setOwnerReport(res.data)).catch(e => console.error(e));
                
                // If accepting or rejecting, mark the real-time notification as read
                if (action === 'accept' || action === 'reject') {
                    await axios.put('/notifications/read-all');
                }
            }
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to update status");
            }
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.active = restaurants[0].active;
            data.deliveryAvailable = data.deliveryAvailable === 'true';

            let imageUrl = restaurants[0].image;
            if (imageFile) {
                const imgData = new FormData();
                imgData.append('file', imageFile);
                const uploadRes = await axios.post('/api/upload', imgData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.url;
            }
            data.image = imageUrl;

            const res = await axios.put(`/restaurants/owner/${restaurants[0].id}/profile`, data);
            setRestaurants([res.data]);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING_CONFIRMATION');
    const activeOrders = orders.filter(o => ['ACCEPTED_BY_OWNER', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED_TO_AGENT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus));
    const completedOrders = orders.filter(o => ['DELIVERED', 'CANCELLED', 'REJECTED_BY_OWNER'].includes(o.orderStatus));

    if (loading) return (
        <div className="pt-32 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    if (restaurants.length === 0) return (
        <div className="pt-40 text-center">
            <Store className="w-20 h-20 text-muted-foreground mx-auto mb-8 opacity-20" />
            <h2 className="text-4xl font-black mb-4">No Business Found</h2>
            <p className="text-xl text-muted-foreground font-medium">Please contact admin to onboard your restaurant.</p>
        </div>
    );

    const activeRestaurant = restaurants[0];

    return (
        <div className="pt-28 pb-20 min-h-screen">
            <div className="section-padding">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                            <img src={activeRestaurant.image} className="w-full h-full object-cover" alt={activeRestaurant.name} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter mb-2">{activeRestaurant.name}</h1>
                            <p className="text-xl text-primary font-black uppercase tracking-widest text-xs">Partner Portal</p>
                        </div>
                    </div>

                    <div className="flex gap-2 p-2 bg-muted rounded-[2rem] overflow-x-auto no-scrollbar whitespace-nowrap">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'overview' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" /> Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('orders')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'orders' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <ShoppingBag className="w-4 h-4" /> Live Orders ({pendingOrders.length + activeOrders.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'history' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <Receipt className="w-4 h-4" /> History Logs
                        </button>
                        <button 
                            onClick={() => setActiveTab('categories')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'categories' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <LayoutDashboard className="w-4 h-4" /> Categories
                        </button>
                        <button 
                            onClick={() => setActiveTab('menu')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'menu' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <Utensils className="w-4 h-4" /> Menu Manager
                        </button>
                        <button 
                            onClick={() => setActiveTab('coupons')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'coupons' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <Tag className="w-4 h-4" /> Coupons
                        </button>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all ${
                                activeTab === 'profile' ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                            }`}
                        >
                            <Settings className="w-4 h-4" /> Profile
                        </button>
                    </div>
                </div>

                {/* Dashboard Overview */}
                {activeTab === 'overview' && (
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="card-premium p-8 bg-card border-none shadow-2xl">
                                <div className="flex items-center gap-4 mb-4 text-primary">
                                    <IndianRupee className="w-8 h-8" />
                                    <h3 className="text-xl font-black">Today's Sales</h3>
                                </div>
                                <p className="text-4xl font-black tracking-tighter">₹{ownerReport?.todayRevenue || 0}</p>
                                <p className="text-sm font-bold text-muted-foreground mt-2">All time: ₹{ownerReport?.totalRevenue || 0}</p>
                            </div>
                            <div className="card-premium p-8 bg-card border-none shadow-2xl">
                                <div className="flex items-center gap-4 mb-4 text-blue-500">
                                    <ShoppingBag className="w-8 h-8" />
                                    <h3 className="text-xl font-black">Today's Orders</h3>
                                </div>
                                <p className="text-4xl font-black tracking-tighter">{ownerReport?.todayOrders || 0}</p>
                                <p className="text-sm font-bold text-muted-foreground mt-2">Total orders: {ownerReport?.totalOrders || 0}</p>
                            </div>
                            <div className="card-premium p-8 bg-card border-none shadow-2xl">
                                <div className="flex items-center gap-4 mb-4 text-green-500">
                                    <CheckCircle className="w-8 h-8" />
                                    <h3 className="text-xl font-black">Active Menu</h3>
                                </div>
                                <p className="text-4xl font-black tracking-tighter">{ownerReport?.activeMenuItems || 0}</p>
                                <p className="text-sm font-bold text-red-500 mt-2">{ownerReport?.lowOrUnavailableItems || 0} items unavailable</p>
                            </div>
                            <div className="card-premium p-8 bg-card border-none shadow-2xl">
                                <div className="flex items-center gap-4 mb-4 text-orange-500">
                                    <Clock className="w-8 h-8" />
                                    <h3 className="text-xl font-black">Live Pending</h3>
                                </div>
                                <p className="text-4xl font-black tracking-tighter">{pendingOrders.length}</p>
                                <p className="text-sm font-bold text-muted-foreground mt-2">Requires confirmation</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="card-premium p-8 bg-card border-none shadow-2xl">
                                <h3 className="text-2xl font-black mb-6">Recent Statuses</h3>
                                <div className="space-y-4">
                                    {ownerReport?.ordersByStatus && Object.entries(ownerReport.ordersByStatus).map(([status, count]) => (
                                        <div key={status} className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl">
                                            <span className="font-bold text-sm tracking-widest">{status.replace(/_/g, ' ')}</span>
                                            <span className="text-xl font-black text-primary">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Content */}
                {activeTab === 'orders' && (
                    <div className="space-y-12">
                        {/* Pending Orders Section */}
                        {pendingOrders.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                                    <Clock className="w-6 h-6 text-orange-500" /> New Orders ({pendingOrders.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {pendingOrders.map(order => (
                                        <div key={order.id} className="card-premium p-8 bg-card border-2 border-orange-500/20 shadow-2xl">
                                            <div className="flex justify-between items-start mb-6">
                                                <span className="text-2xl font-black tracking-tighter">#{order.orderNumber}</span>
                                                <div className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    New Order
                                                </div>
                                            </div>
                                            <div className="space-y-4 mb-8">
                                                <div className="font-bold text-sm opacity-70">
                                                    Customer: {order.customerName} <br/>
                                                    Phone: {order.customerPhone || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-bold opacity-70">
                                                    <ShoppingBag className="w-4 h-4 text-primary" />
                                                    {order.items.map(i => `${i.quantity}x ${i.menuItemName}`).join(', ')}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-bold opacity-70">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    {order.deliveryAddress}
                                                </div>
                                                {order.latitude && order.longitude && (
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">
                                                        View on Map
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center pt-6 border-t border-border">
                                                <p className="text-3xl font-black">₹{order.totalAmount}</p>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'reject', 'Not available')}
                                                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-black text-[10px] uppercase hover:bg-red-200 transition-colors"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'accept')}
                                                        className="px-6 py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                                    >
                                                        Accept
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Active Orders Section */}
                        <section>
                            <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                                <Utensils className="w-6 h-6 text-primary" /> In Progress ({activeOrders.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {activeOrders.map(order => (
                                    <div key={order.id} className="card-premium p-8 bg-card border-none shadow-2xl group">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-2xl font-black tracking-tighter">#{order.orderNumber}</span>
                                            <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {order.orderStatus.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                        <div className="space-y-4 mb-8">
                                            <div className="font-bold text-sm opacity-70">
                                                Customer: {order.customerName} <br/>
                                                Phone: {order.customerPhone || 'N/A'}
                                            </div>
                                            <div className="space-y-2">
                                                {order.items.map(i => (
                                                    <div key={i.id} className="flex items-center justify-between gap-3 text-sm font-bold">
                                                        <div className={`flex items-center gap-2 min-w-0 ${i.unavailable ? 'line-through opacity-50' : 'opacity-70'}`}>
                                                            <ShoppingBag className="w-4 h-4 text-primary flex-shrink-0" />
                                                            <span>{i.quantity}x {i.menuItemName}</span>
                                                        </div>
                                                        {i.unavailable ? (
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-2 py-1 rounded-lg">Out of stock</span>
                                                                {order.orderStatus !== 'DELIVERED' && (
                                                                    <button onClick={() => updateOrderItemStock(order.id, i.id, false)} className="px-2.5 py-1.5 bg-green-100 text-green-600 rounded-lg font-black text-[9px] uppercase hover:bg-green-200">Restore</button>
                                                                )}
                                                            </div>
                                                        ) : order.orderStatus !== 'DELIVERED' ? (
                                                            <button onClick={() => updateOrderItemStock(order.id, i.id, true)} className="px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg font-black text-[9px] uppercase hover:bg-red-200 flex-shrink-0">Out of Stock</button>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold opacity-70">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {order.deliveryAddress}
                                            </div>
                                            {order.latitude && order.longitude && (
                                                <a href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">
                                                    View on Map
                                                </a>
                                            )}
                                            {order.deliveryAgentName && (
                                                <div className="flex items-center gap-3 text-sm font-bold text-green-600">
                                                    <Truck className="w-4 h-4" /> Agent: {order.deliveryAgentName}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-border">
                                            <p className="text-3xl font-black">₹{order.totalAmount}</p>
                                            
                                            {order.orderStatus === 'ACCEPTED_BY_OWNER' && (
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'prepare')}
                                                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase hover:bg-primary/20 transition-all"
                                                >
                                                    Start Preparing
                                                </button>
                                            )}
                                            {order.orderStatus === 'PREPARING' && (
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'ready')}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-500/20 hover:scale-105 transition-all"
                                                >
                                                    Mark as Ready
                                                </button>
                                            )}
                                            {order.orderStatus === 'READY_FOR_PICKUP' && (
                                                <div className="flex gap-2">
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase self-center hidden lg:block">Waiting...</div>
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'out-for-delivery', '', 'agent')}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                                                    >
                                                        Dispatch / Out for Delivery
                                                    </button>
                                                </div>
                                            )}
                                            {['ASSIGNED_TO_AGENT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.orderStatus) && (
                                                <div className="flex gap-2">
                                                    <div className="text-[10px] font-black text-green-600 uppercase self-center hidden lg:block">On the Way</div>
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'delivered', '', 'agent')}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-500/20 hover:scale-105 transition-all"
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        {activeOrders.length === 0 && pendingOrders.length === 0 && (
                            <div className="text-center py-20 opacity-30">
                                <ShoppingBag className="w-20 h-20 mx-auto mb-4" />
                                <p className="text-2xl font-black">No active orders</p>
                            </div>
                        )}
                    </div>
                )}

                {/* History Logs Content */}
                {activeTab === 'history' && (
                    <div className="card-premium overflow-hidden border-none shadow-2xl">
                        <div className="p-8 bg-muted/30 border-b border-border flex justify-between items-center">
                            <h2 className="text-2xl font-black">All Orders Log</h2>
                            <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">{orders.length} events</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <th className="py-6 px-10">ID</th>
                                        <th className="py-6 px-10">Client</th>
                                        <th className="py-6 px-10">Volume</th>
                                        <th className="py-6 px-10">State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-primary/5 transition-colors">
                                            <td className="py-6 px-10 font-black text-xs">#{order.orderNumber}</td>
                                            <td className="py-6 px-10">
                                                <p className="font-bold text-sm">{order.customerName}</p>
                                                <p className="text-[10px] opacity-50 font-medium">{new Date(order.createdAt).toDateString()}</p>
                                            </td>
                                            <td className="py-6 px-10 font-black text-primary">₹{order.totalAmount}</td>
                                            <td className="py-6 px-10">
                                                <select 
                                                    value={order.orderStatus} 
                                                    onChange={(e) => {
                                                        const s = e.target.value;
                                                        if (s === 'ACCEPTED_BY_OWNER') updateOrderStatus(order.id, 'accept');
                                                        else if (s === 'PREPARING') updateOrderStatus(order.id, 'prepare');
                                                        else if (s === 'READY_FOR_PICKUP') updateOrderStatus(order.id, 'ready');
                                                        else if (s === 'OUT_FOR_DELIVERY') updateOrderStatus(order.id, 'out-for-delivery', '', 'agent');
                                                        else if (s === 'DELIVERED') updateOrderStatus(order.id, 'delivered', '', 'agent');
                                                        else if (s === 'CANCELLED' || s === 'REJECTED_BY_OWNER') updateOrderStatus(order.id, 'reject', 'Rejected from history log');
                                                    }}
                                                    className="bg-muted border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                                >
                                                    <option value="PENDING_CONFIRMATION">Placed</option>
                                                    <option value="ACCEPTED_BY_OWNER">Accepted</option>
                                                    <option value="PREPARING">Preparing</option>
                                                    <option value="READY_FOR_PICKUP">Ready</option>
                                                    <option value="OUT_FOR_DELIVERY">Delivering</option>
                                                    <option value="DELIVERED">Delivered</option>
                                                    <option value="CANCELLED">Void/Cancelled</option>
                                                    <option value="REJECTED_BY_OWNER">Rejected</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div className="space-y-12">
                        <div className="flex justify-between items-center bg-primary/5 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                            <div>
                                <h3 className="text-3xl font-black mb-2">Category Management</h3>
                                <p className="text-muted-foreground font-medium">Organize your menu into sections.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setEditingCategory(null);
                                    setCategoryForm({ name: '', description: '', displayOrder: 0, active: true, image: '', cloudinaryPublicId: '' });
                                    setImageFile(null);
                                    setShowCategoryForm(!showCategoryForm);
                                }}
                                className="btn-primary flex items-center gap-2"
                            >
                                {showCategoryForm ? <><X className="w-5 h-5" /> Cancel</> : <><Plus className="w-5 h-5" /> Add Category</>}
                            </button>
                        </div>

                        {showCategoryForm && (
                            <div className="card-premium p-10 bg-card border-none shadow-3xl animate-in fade-in slide-in-from-top-4">
                                <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <input type="text" name="name" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="input-premium" placeholder="Category Name" />
                                    <input type="number" name="displayOrder" required value={categoryForm.displayOrder} onChange={e => setCategoryForm({...categoryForm, displayOrder: parseInt(e.target.value) || 0})} className="input-premium" placeholder="Display Order (e.g. 1)" />
                                    
                                    <div className="md:col-span-2">
                                        <textarea name="description" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} className="input-premium min-h-[100px]" placeholder="Category Description..." />
                                    </div>
                                    
                                    <div className="md:col-span-2 flex flex-col gap-2">
                                        <label className="text-sm font-bold text-muted-foreground">Upload Image</label>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="input-premium p-2" />
                                    </div>

                                    <button type="submit" className="btn-primary h-14 md:col-span-2">{editingCategory ? 'Update Category' : 'Create Category'}</button>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {categories.map(cat => (
                                <div key={cat.id} className="card-premium overflow-hidden border-none shadow-2xl flex flex-col group">
                                    <img src={cat.image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&fit=crop'} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" alt={cat.name} />
                                    <div className="p-6 flex-grow flex flex-col">
                                        <h4 className="font-black text-lg mb-2">{cat.name}</h4>
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-2 mb-4 flex-grow">{cat.description}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <button 
                                                onClick={() => toggleCategoryActive(cat)}
                                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${cat.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {cat.active ? 'Active' : 'Disabled'}
                                            </button>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingCategory(cat); setCategoryForm(cat); setShowCategoryForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={() => deleteCategory(cat.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu Content */}
                {activeTab === 'menu' && (
                    <div className="space-y-12">
                        <div className="flex justify-between items-center bg-primary/5 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                            <div>
                                <h3 className="text-3xl font-black mb-2">Product Management</h3>
                                <p className="text-muted-foreground font-medium">Add, edit, or remove dishes from the menu.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setEditingProduct(null);
                                    setProductForm({ name: '', description: '', price: '', categoryId: '', vegOrNonVeg: 'Veg', available: true, trending: false, preparationTime: 15, image: '', cloudinaryPublicId: '' });
                                    setImageFile(null);
                                    setShowProductForm(!showProductForm);
                                }}
                                className="btn-primary flex items-center gap-2"
                            >
                                {showProductForm ? <><X className="w-5 h-5" /> Cancel</> : <><Plus className="w-5 h-5" /> Add Product</>}
                            </button>
                        </div>

                        {showProductForm && (
                            <div className="card-premium p-10 bg-card border-none shadow-3xl animate-in fade-in slide-in-from-top-4">
                                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <input type="text" name="name" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="input-premium" placeholder="Item Name" />
                                    <input type="number" name="price" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="input-premium" placeholder="Price (₹)" />
                                    
                                    <select name="categoryId" required value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})} className="input-premium">
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    
                                    <div className="flex gap-4">
                                        <select name="vegOrNonVeg" value={productForm.vegOrNonVeg} onChange={e => setProductForm({...productForm, vegOrNonVeg: e.target.value})} className="input-premium flex-1">
                                            <option value="Veg">Veg</option>
                                            <option value="Non-Veg">Non-Veg</option>
                                        </select>
                                        <label className="flex items-center gap-2 px-4 bg-muted rounded-xl cursor-pointer">
                                            <input type="checkbox" checked={productForm.trending} onChange={e => setProductForm({...productForm, trending: e.target.checked})} className="w-5 h-5 accent-primary" />
                                            <span className="font-bold text-sm">Trending</span>
                                        </label>
                                    </div>

                                    <div className="md:col-span-2">
                                        <textarea name="description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="input-premium min-h-[100px]" placeholder="Description..." />
                                    </div>
                                    
                                    <div className="md:col-span-2 flex flex-col gap-2">
                                        <label className="text-sm font-bold text-muted-foreground">Upload Image</label>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="input-premium p-2" />
                                    </div>

                                    <button type="submit" className="btn-primary h-14 md:col-span-2">{editingProduct ? 'Update Product' : 'Post to Menu'}</button>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {menuItems.map(item => (
                                <div key={item.id} className="card-premium overflow-hidden border-none shadow-2xl flex flex-col group min-w-0">
                                    <img src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&fit=crop'} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                                    <div className="p-5 flex-grow flex flex-col min-w-0">
                                        <div className="flex justify-between items-start gap-3 mb-2">
                                            <h4 className="font-black text-lg break-words min-w-0">{item.name}</h4>
                                            <span className="text-primary font-black whitespace-nowrap">₹{item.price}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-bold mb-1 opacity-70">Category: {item.categoryName}</p>
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-2 mb-4 flex-grow">{item.description}</p>
                                        <div className="flex flex-col gap-3 mt-auto">
                                            <div className="flex flex-wrap gap-2">
                                                <button 
                                                    onClick={() => toggleProductActive(item)}
                                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                                >
                                                    {item.available ? 'Available' : 'Sold Out'}
                                                </button>
                                                <button 
                                                    onClick={() => toggleProductTrending(item)}
                                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-1 ${item.trending ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-muted text-muted-foreground'}`}
                                                >
                                                    <Activity className="w-3 h-3"/> {item.trending ? 'Trending' : 'Normal'}
                                                </button>
                                            </div>
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => { setEditingProduct(item); setProductForm({...item, categoryId: item.categoryId || ''}); setShowProductForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    className="flex-1 min-w-0 h-10 flex items-center justify-center gap-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 className="w-4 h-4"/>
                                                    <span className="text-xs font-bold">Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(item.id)}
                                                    className="flex-1 min-w-0 h-10 flex items-center justify-center gap-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                    <span className="text-xs font-bold">Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Coupons Tab */}
                {activeTab === 'coupons' && (
                    <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter">Coupon Manager</h2>
                                <p className="text-muted-foreground font-medium mt-1">Issue discount codes for your restaurant only.</p>
                            </div>
                            <button
                                onClick={() => setShowCouponForm(!showCouponForm)}
                                className="btn-primary flex items-center gap-2"
                            >
                                {showCouponForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {showCouponForm ? 'Cancel' : 'Create Coupon'}
                            </button>
                        </div>

                        {/* Create Coupon Form */}
                        {showCouponForm && (
                            <div className="card-premium p-8 bg-card border-2 border-primary/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                                    <Tag className="w-6 h-6 text-primary" /> New Coupon
                                </h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setCouponLoading(true);
                                    try {
                                        const payload = {
                                            ...couponForm,
                                            code: couponForm.code.toUpperCase(),
                                            discountPercentage: couponForm.discountPercentage ? parseInt(couponForm.discountPercentage) : null,
                                            flatDiscountAmount: couponForm.flatDiscountAmount ? parseFloat(couponForm.flatDiscountAmount) : null,
                                            maxDiscountAmount: couponForm.maxDiscountAmount ? parseInt(couponForm.maxDiscountAmount) : null,
                                            minOrderAmount: couponForm.minOrderAmount ? parseInt(couponForm.minOrderAmount) : null,
                                            maxUsageCount: couponForm.maxUsageCount ? parseInt(couponForm.maxUsageCount) : null,
                                            maxUsagePerCustomer: couponForm.maxUsagePerCustomer ? parseInt(couponForm.maxUsagePerCustomer) : 1,
                                            startDate: couponForm.startDate ? new Date(couponForm.startDate).toISOString() : null,
                                            expiryDate: couponForm.expiryDate ? new Date(couponForm.expiryDate).toISOString() : null,
                                        };
                                        await axios.post('/coupons/owner', payload);
                                        toast.success('Coupon created!');
                                        setShowCouponForm(false);
                                        setCouponForm({ code: '', description: '', discountType: 'PERCENTAGE', discountPercentage: '', flatDiscountAmount: '', maxDiscountAmount: '', minOrderAmount: '', applicableCategories: [], maxUsageCount: '', maxUsagePerCustomer: 1, startDate: '', expiryDate: '', active: true });
                                        fetchCoupons();
                                    } catch (err) {
                                        toast.error(err.response?.data?.error || 'Failed to create coupon');
                                    } finally {
                                        setCouponLoading(false);
                                    }
                                }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Coupon Code *</label>
                                        <input type="text" required placeholder="e.g. PANI20" value={couponForm.code}
                                            onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                                            className="input-premium font-mono font-black tracking-widest uppercase" />
                                    </div>

                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</label>
                                        <input type="text" placeholder="e.g. Get 20% off on your first order!" value={couponForm.description}
                                            onChange={e => setCouponForm({...couponForm, description: e.target.value})}
                                            className="input-premium" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Discount Type *</label>
                                        <select value={couponForm.discountType}
                                            onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}
                                            className="input-premium">
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FLAT">Flat Amount (₹)</option>
                                        </select>
                                    </div>

                                    {couponForm.discountType === 'PERCENTAGE' ? (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Discount % *</label>
                                                <input type="number" required min="1" max="100" placeholder="20" value={couponForm.discountPercentage}
                                                    onChange={e => setCouponForm({...couponForm, discountPercentage: e.target.value})}
                                                    className="input-premium" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Max Discount Cap (₹)</label>
                                                <input type="number" min="0" placeholder="e.g. 100" value={couponForm.maxDiscountAmount}
                                                    onChange={e => setCouponForm({...couponForm, maxDiscountAmount: e.target.value})}
                                                    className="input-premium" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-2 lg:col-span-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Flat Discount Amount (₹) *</label>
                                            <input type="number" required min="1" placeholder="50" value={couponForm.flatDiscountAmount}
                                                onChange={e => setCouponForm({...couponForm, flatDiscountAmount: e.target.value})}
                                                className="input-premium" />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Min Order Amount (₹)</label>
                                        <input type="number" min="0" placeholder="e.g. 199" value={couponForm.minOrderAmount}
                                            onChange={e => setCouponForm({...couponForm, minOrderAmount: e.target.value})}
                                            className="input-premium" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Max Total Uses</label>
                                        <input type="number" min="1" placeholder="Unlimited" value={couponForm.maxUsageCount}
                                            onChange={e => setCouponForm({...couponForm, maxUsageCount: e.target.value})}
                                            className="input-premium" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Max Uses Per Customer</label>
                                        <input type="number" min="1" placeholder="1" value={couponForm.maxUsagePerCustomer}
                                            onChange={e => setCouponForm({...couponForm, maxUsagePerCustomer: e.target.value})}
                                            className="input-premium" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Applicable Categories</label>
                                        <div className="flex flex-wrap gap-2 p-3 border border-border rounded-2xl bg-background min-h-[48px]">
                                            {categories.length === 0 && <span className="text-xs text-muted-foreground">No categories loaded</span>}
                                            {categories.map(cat => (
                                                <label key={cat.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${couponForm.applicableCategories.includes(cat.id) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
                                                    <input type="checkbox" className="hidden"
                                                        checked={couponForm.applicableCategories.includes(cat.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) setCouponForm(p => ({...p, applicableCategories: [...p.applicableCategories, cat.id]}));
                                                            else setCouponForm(p => ({...p, applicableCategories: p.applicableCategories.filter(id => id !== cat.id)}));
                                                        }} />
                                                    {cat.name}
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Leave empty to apply to all categories</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Valid From</label>
                                        <input type="datetime-local" value={couponForm.startDate}
                                            onChange={e => setCouponForm({...couponForm, startDate: e.target.value})}
                                            className="input-premium" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Expiry Date *</label>
                                        <input type="datetime-local" required value={couponForm.expiryDate}
                                            onChange={e => setCouponForm({...couponForm, expiryDate: e.target.value})}
                                            className="input-premium" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active</label>
                                        <select value={couponForm.active}
                                            onChange={e => setCouponForm({...couponForm, active: e.target.value === 'true'})}
                                            className="input-premium">
                                            <option value="true">Yes — Publish Now</option>
                                            <option value="false">No — Save as Draft</option>
                                        </select>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <button type="submit" disabled={couponLoading} className="btn-primary w-full h-14 flex items-center justify-center gap-2">
                                            {couponLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Creating...</> : <><Tag className="w-5 h-5" /> Create Coupon</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Coupon Cards */}
                        {coupons.length === 0 ? (
                            <div className="text-center py-20">
                                <Tag className="w-20 h-20 text-muted-foreground mx-auto mb-6 opacity-20" />
                                <h3 className="text-2xl font-black mb-2">No Coupons Yet</h3>
                                <p className="text-muted-foreground">Create your first coupon to attract more customers!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {coupons.map(coupon => {
                                    const isExpired = coupon.expired;
                                    const isActive = coupon.active && !isExpired;
                                    return (
                                        <div key={coupon.id} className={`card-premium p-6 border-2 shadow-xl relative overflow-hidden transition-all ${isActive ? 'border-primary/20' : 'border-border opacity-70'}`}>
                                            {/* Status Badge */}
                                            <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpired ? 'bg-red-100 text-red-600' : isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {isExpired ? 'Expired' : isActive ? 'Active' : 'Inactive'}
                                            </div>

                                            {/* Code */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="font-mono font-black text-xl text-primary tracking-wider">{coupon.code}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Code copied!'); }}
                                                    className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm text-muted-foreground font-medium mb-4 line-clamp-2">{coupon.description || '—'}</p>

                                            {/* Discount Info */}
                                            <div className="bg-primary/5 rounded-2xl p-3 mb-4 space-y-1.5">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-bold text-muted-foreground">Discount</span>
                                                    <span className="font-black text-primary">
                                                        {coupon.discountType === 'FLAT'
                                                            ? `₹${coupon.flatDiscountAmount} off`
                                                            : `${coupon.discountPercentage}% off${coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}`}
                                                    </span>
                                                </div>
                                                {coupon.minOrderAmount > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-bold text-muted-foreground">Min Order</span>
                                                        <span className="font-black">₹{coupon.minOrderAmount}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-bold text-muted-foreground">Usage</span>
                                                    <span className="font-black">{coupon.usedCount || 0}{coupon.maxUsageCount ? `/${coupon.maxUsageCount}` : ' uses'}</span>
                                                </div>
                                                {coupon.applicableCategories?.length > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-bold text-muted-foreground">Categories</span>
                                                        <span className="font-black text-xs">{coupon.applicableCategories.length} restricted</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expiry */}
                                            {coupon.expiryDate && (
                                                <div className={`flex items-center gap-1.5 text-xs font-bold mb-4 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Expires: {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.put(`/coupons/owner/${coupon.id}/toggle`);
                                                            toast.success(`Coupon ${coupon.active ? 'deactivated' : 'activated'}`);
                                                            fetchCoupons();
                                                        } catch (e) { toast.error('Failed to toggle coupon'); }
                                                    }}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${coupon.active ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                                >
                                                    {coupon.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                                    {coupon.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
                                                        try {
                                                            await axios.delete(`/coupons/owner/${coupon.id}`);
                                                            toast.success('Coupon deleted');
                                                            fetchCoupons();
                                                        } catch (e) { toast.error('Failed to delete coupon'); }
                                                    }}
                                                    className="px-4 py-2.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Restaurant Profile Content */}
                {activeTab === 'profile' && (

                    <div className="max-w-4xl mx-auto">
                        <div className="card-premium p-10 bg-card border-none shadow-2xl">
                            <div className="flex items-center gap-4 mb-8">
                                <Settings className="w-10 h-10 text-primary" />
                                <div>
                                    <h3 className="text-3xl font-black">Restaurant Profile</h3>
                                    <p className="text-muted-foreground font-medium">Update your public information.</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Restaurant Name</label>
                                    <input type="text" name="name" defaultValue={activeRestaurant.name} required className="input-premium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Phone Number</label>
                                    <input type="text" name="phone" defaultValue={activeRestaurant.phone} className="input-premium" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-muted-foreground">Description</label>
                                    <textarea name="description" defaultValue={activeRestaurant.description} className="input-premium min-h-[100px]" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-muted-foreground">Location / Address</label>
                                    <input type="text" name="location" defaultValue={activeRestaurant.location} required className="input-premium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Opening Time</label>
                                    <input type="time" name="openingTime" defaultValue={activeRestaurant.openingTime} className="input-premium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Closing Time</label>
                                    <input type="time" name="closingTime" defaultValue={activeRestaurant.closingTime} className="input-premium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Category</label>
                                    <input type="text" name="category" defaultValue={activeRestaurant.category} className="input-premium" placeholder="e.g. Fast Food" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Minimum Order Amount (₹)</label>
                                    <input type="number" name="minimumOrderAmount" min="0" step="0.01" defaultValue={activeRestaurant.minimumOrderAmount ?? 0} className="input-premium" placeholder="e.g. 100" />
                                    <p className="text-xs text-muted-foreground">Customers must have at least this cart subtotal to place an order.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Delivery Charge (₹)</label>
                                    <input type="number" name="deliveryCharge" min="0" step="0.01" defaultValue={activeRestaurant.deliveryCharge ?? 0} className="input-premium" placeholder="e.g. 30" />
                                    <p className="text-xs text-muted-foreground">This delivery charge is added to the customer's order total before placing the order.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">Delivery Available</label>
                                    <select name="deliveryAvailable" defaultValue={activeRestaurant.deliveryAvailable} className="input-premium">
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-muted-foreground">Update Cover Image</label>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="input-premium p-2" />
                                </div>

                                <div className="md:col-span-2 pt-6">
                                    <button type="submit" className="btn-primary w-full h-14 flex items-center justify-center gap-2">
                                        <Save className="w-5 h-5" /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Incoming Order Modal */}
            {incomingOrderAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-primary">New Order Received!</h2>
                            <button onClick={() => setIncomingOrderAlert(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4 mb-8 text-sm">
                            <p><strong>Order #:</strong> {incomingOrderAlert.orderNumber}</p>
                            <p><strong>Customer:</strong> {incomingOrderAlert.customerName}</p>
                            <p><strong>Amount:</strong> ₹{incomingOrderAlert.totalAmount}</p>
                            <div>
                                <strong>Items:</strong>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {incomingOrderAlert.items?.map(item => (
                                        <li key={item.id}>{item.quantity}x {item.menuItemName} (₹{item.price})</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => {
                                    updateOrderStatus(incomingOrderAlert.id, 'accept');
                                    setIncomingOrderAlert(null);
                                }}
                                className="flex-1 bg-primary text-white py-3 rounded-2xl font-black hover:scale-[1.02] transition-transform"
                            >
                                Accept Order
                            </button>
                            <button 
                                onClick={() => {
                                    updateOrderStatus(incomingOrderAlert.id, 'reject', 'Not available');
                                    setIncomingOrderAlert(null);
                                }}
                                className="flex-1 bg-muted text-muted-foreground py-3 rounded-2xl font-black hover:bg-muted/80 transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;