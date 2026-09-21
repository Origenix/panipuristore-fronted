import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Users, Store, Receipt, IndianRupee, LayoutDashboard, UtensilsCrossed, PackageSearch, Activity, TrendingUp, ShieldCheck, ChevronRight, Edit2, Trash2, Plus, X, Headphones } from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';
import AdminSupportPanel from '../components/AdminSupportPanel';

const AdminDashboard = () => {
    const { latestNotification } = useContext(NotificationContext);
    const [incomingOrderAlert, setIncomingOrderAlert] = useState(null);
    const [report, setReport] = useState(null);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentProofUrl, setPaymentProofUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('analytics');

    // New State for Product & Category Management
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [showAdminForm, setShowAdminForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({ name: '', phone: '', address: '', role: 'CUSTOMER' });
    const [adminForm, setAdminForm] = useState({
        name: '', email: '', password: '', phone: '', address: ''
    });

    const [showBusinessForm, setShowBusinessForm] = useState(false);
    const [businessForm, setBusinessForm] = useState({
        name: '', description: '', phone: '', location: '', category: '', image: '', cloudinaryPublicId: '', openingTime: '09:00', closingTime: '22:00', deliveryAvailable: true, ownerName: '', ownerEmail: '', ownerMobile: '', password: ''
    });

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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [reportRes, orderRes, usersRes, restRes] = await Promise.all([
                    axios.get('/reports/admin-dashboard'),
                    axios.get('/orders/admin/all'),
                    axios.get('/users/admin/all'),
                    axios.get('/restaurants/admin/all')
                ]);
                setReport(reportRes.data);
                setOrders(orderRes.data);
                setUsers(usersRes.data);
                setRestaurants(restRes.data);

                if (restRes.data.length > 0) {
                    await fetchCategoriesAndMenu(restRes.data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (latestNotification && latestNotification.orderId) {
            axios.get(`/orders/${latestNotification.orderId}`)
                .then(res => {
                    setIncomingOrderAlert(res.data);
                    setOrders(prev => [res.data, ...prev.filter(o => o.id !== res.data.id)]);
                })
                .catch(e => console.error("Failed to fetch incoming order", e));
        }
    }, [latestNotification]);

    // Form Handlers
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
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
                publicId = uploadRes.data.publicId;
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
                publicId = uploadRes.data.publicId;
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

    // Business Handlers
    const handleBusinessSubmit = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = businessForm.image;
            if (imageFile) {
                const formData = new FormData(); formData.append('file', imageFile);
                const uploadRes = await axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
                imageUrl = uploadRes.data.url;
            }
            const payload = { 
                ...businessForm, 
                image: imageUrl, 
                openingTime: businessForm.openingTime.length === 5 ? businessForm.openingTime + ":00" : businessForm.openingTime, 
                closingTime: businessForm.closingTime.length === 5 ? businessForm.closingTime + ":00" : businessForm.closingTime 
            };
            await axios.post('/restaurants/admin/onboard', payload);
            toast.success('Business and Owner added successfully!');
            setShowBusinessForm(false); setImageFile(null);
            setBusinessForm({ name: '', description: '', phone: '', location: '', category: '', image: '', cloudinaryPublicId: '', openingTime: '09:00', closingTime: '22:00', deliveryAvailable: true, ownerName: '', ownerEmail: '', ownerMobile: '', password: '' });
            const restRes = await axios.get('/restaurants/admin/all');
            setRestaurants(restRes.data);
        } catch (err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error(err.response?.data?.error || err.response?.data?.message || typeof err.response?.data === 'string' ? err.response?.data : "Invalid request. Please try again.");
            }
        }
    };

    const toggleRestaurantStatus = async (rest) => {
        try {
            await axios.put(`/restaurants/admin/${rest.id}/toggle-status?active=${!rest.active}`);
            setRestaurants(restaurants.map(r => r.id === rest.id ? { ...r, active: !rest.active } : r));
            toast.success(rest.active ? 'Restaurant Deactivated' : 'Restaurant Activated');
        } catch(err) {
            toast.error("Failed to toggle status");
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`/orders/${orderId}/status?status=${newStatus}`);
            setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
            toast.success("Order status updated");
        } catch (err) {
            if (!err.response || err.response.status >= 500) {
                toast.error("We're experiencing some server issues right now. Please try again later.");
            } else {
                toast.error("Failed to update status");
            }
        }
    };

    const updatePaymentStatus = async (orderId, status) => {
        try {
            const res = await axios.put('/orders/' + orderId + '/payment-status?status=' + encodeURIComponent(status));
            setOrders(orders.map(o => o.id === orderId ? res.data : o));
            toast.success(status === 'VERIFIED' ? 'Payment verified and customer notified.' : 'Payment status updated');
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update payment status');
        }
    };

    const viewPaymentProof = async (orderId) => {
        try {
            const res = await axios.get('/orders/' + orderId + '/payment-screenshot', { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            setPaymentProofUrl(url);
        } catch (err) {
            toast.error('Payment screenshot is not available.');
        }
    };

    // User Handlers
    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/users/admin', adminForm);
            toast.success("Admin created successfully!");
            setUsers([...users, res.data]);
            setShowAdminForm(false);
            setAdminForm({ name: '', email: '', password: '', phone: '', address: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to create admin");
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', role: user.role || 'CUSTOMER' });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`/users/admin/${editingUser.id}`, { ...userForm });
            setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
            setEditingUser(null);
            toast.success("User updated successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update user");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user/admin?")) return;
        try {
            await axios.delete(`/users/admin/${id}`);
            toast.success("User deleted successfully!");
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const handleToggleUserStatus = async (user) => {
        try {
            const res = await axios.put(`/users/admin/${user.id}/toggle-status?active=${!user.active}`);
            setUsers(users.map(u => u.id === user.id ? res.data : u));
            toast.success(user.active ? 'User Blocked' : 'User Unblocked');
        } catch (err) {
            toast.error("Failed to toggle status");
        }
    };

    if (loading) return (
        <div className="pt-32 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    return (
        <div className="pt-28 pb-20 min-h-screen">
            <div className="section-padding">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-secondary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-primary" /> System Admin
                            </span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4">Gaon Dashboard</h1>
                        <p className="text-xl text-muted-foreground font-medium">Monitoring the village's food ecosystem.</p>
                    </div>

                    <div className="flex gap-2 p-2 bg-muted rounded-[2rem] overflow-x-auto no-scrollbar whitespace-nowrap">
                        {[
                            { id: 'analytics', label: 'Stats', icon: Activity },
                            { id: 'orders', label: 'Orders', icon: PackageSearch },
                            { id: 'categories', label: 'Categories', icon: LayoutDashboard },
                            { id: 'products', label: 'Products', icon: UtensilsCrossed },
                            { id: 'restaurants', label: 'Business', icon: Store },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'support', label: 'Support', icon: Headphones }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-black transition-all whitespace-nowrap flex-shrink-0 ${
                                    activeTab === tab.id ? 'bg-primary text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-border'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'support' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-3xl font-black">Customer Support Center</h2>
                            <p className="text-muted-foreground font-medium">View AI analyses, customer conversations, escalations and reply from the admin team.</p>
                        </div>
                        <AdminSupportPanel />
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Revenue', value: `₹${report?.totalRevenue?.toLocaleString()}`, icon: IndianRupee, color: 'text-green-500' },
                            { label: 'Total Orders', value: report?.totalOrders, icon: Receipt, color: 'text-primary' },
                            { label: 'Active Users', value: report?.totalUsers, icon: Users, color: 'text-blue-500' },
                            { label: 'Restaurants', value: report?.totalRestaurants, icon: Store, color: 'text-orange-500' }
                        ].map((stat, i) => (
                            <div key={i} className="card-premium p-8 bg-card border-none shadow-2xl group hover:scale-[1.02] transition-transform">
                                <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors`}>
                                    <stat.icon className={`w-7 h-7 ${stat.color}`} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{stat.label}</p>
                                <p className="text-4xl font-black tracking-tighter">{stat.value || 0}</p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-500">
                                    <TrendingUp className="w-3 h-3" /> +12% from last week
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="card-premium overflow-hidden border-none shadow-2xl">
                        <div className="p-8 bg-muted/30 border-b border-border flex justify-between items-center">
                            <h2 className="text-2xl font-black">Global Logs</h2>
                            <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">{orders.length} events</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <th className="py-6 px-10">ID</th>
                                        <th className="py-6 px-10">Client</th>
                                        <th className="py-6 px-10">Hub</th>
                                        <th className="py-6 px-10">Volume</th>
                                        <th className="py-6 px-10">Payment</th>
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
                                            <td className="py-6 px-10 font-bold text-sm text-muted-foreground">{order.restaurantName}</td>
                                            <td className="py-6 px-10 font-black text-primary">₹{order.totalAmount}</td>
                                            <td className="py-6 px-10 min-w-[260px]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <select value={order.paymentStatus || 'PENDING'} onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                                                        className="bg-muted border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                                                        <option value="PENDING">Pending</option>
                                                        <option value="PROOF_UPLOADED">Proof Uploaded</option>
                                                        <option value="VERIFIED">Payment Verified</option>
                                                        <option value="REJECTED">Rejected</option>
                                                    </select>
                                                    {order.paymentScreenshotUploaded && <button type="button" onClick={() => viewPaymentProof(order.id)} className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase">View Proof</button>}
                                                </div>
                                            </td>
                                            <td className="py-6 px-10">
                                                <select 
                                                    value={order.orderStatus} 
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                    className="bg-muted border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                                >
                                                    <option value="PENDING_CONFIRMATION">Placed</option>
                                                    <option value="ACCEPTED_BY_OWNER">Accepted</option>
                                                    <option value="PREPARING">Preparing</option>
                                                    <option value="OUT_FOR_DELIVERY">Delivering</option>
                                                    <option value="DELIVERED">Delivered</option>
                                                    <option value="CANCELLED">Void</option>
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

                {/* Products Tab */}
                {activeTab === 'products' && (
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {menuItems.map(item => (
                                <div key={item.id} className="card-premium overflow-hidden border-none shadow-2xl flex group">
                                    <img src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&fit=crop'} className="w-32 h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                                    <div className="p-6 flex-grow flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-lg">{item.name}</h4>
                                            <span className="text-primary font-black">₹{item.price}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-bold mb-1 opacity-70">Category: {item.categoryName}</p>
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-2 mb-4 flex-grow">{item.description}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex gap-2">
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
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingProduct(item); setProductForm({...item, categoryId: item.categoryId || ''}); setShowProductForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={() => deleteProduct(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Restaurants/Business Tab */}
                {activeTab === 'restaurants' && (
                    <div className="space-y-12">
                        <div className="flex justify-between items-center bg-primary/5 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                            <div>
                                <h3 className="text-3xl font-black mb-2">Business Management</h3>
                                <p className="text-muted-foreground font-medium">Manage restaurants and onboarding.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setBusinessForm({ name: '', description: '', phone: '', location: '', category: '', image: '', cloudinaryPublicId: '', openingTime: '09:00', closingTime: '22:00', deliveryAvailable: true, ownerName: '', ownerEmail: '', ownerMobile: '', password: '' });
                                    setImageFile(null);
                                    setShowBusinessForm(!showBusinessForm);
                                }}
                                className="btn-primary flex items-center gap-2"
                            >
                                {showBusinessForm ? <><X className="w-5 h-5" /> Cancel</> : <><Plus className="w-5 h-5" /> Add Business</>}
                            </button>
                        </div>

                        {showBusinessForm && (
                            <div className="card-premium p-10 bg-card border-none shadow-3xl animate-in fade-in slide-in-from-top-4">
                                <form onSubmit={handleBusinessSubmit} className="space-y-8">
                                    <h4 className="text-xl font-black text-primary border-b pb-2">Business Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <input type="text" required value={businessForm.name} onChange={e => setBusinessForm({...businessForm, name: e.target.value})} className="input-premium" placeholder="Restaurant Name *" />
                                        <input type="text" required value={businessForm.phone} onChange={e => setBusinessForm({...businessForm, phone: e.target.value})} className="input-premium" placeholder="Restaurant Phone *" />
                                        <input type="text" required value={businessForm.category} onChange={e => setBusinessForm({...businessForm, category: e.target.value})} className="input-premium" placeholder="Cuisine / Category" />
                                        <input type="text" required value={businessForm.location} onChange={e => setBusinessForm({...businessForm, location: e.target.value})} className="input-premium" placeholder="Full Address (Area, City, State, PIN) *" />
                                        <div className="flex gap-4">
                                            <div className="flex-1"><label className="text-xs font-bold text-muted-foreground">Opening Time</label><input type="time" required value={businessForm.openingTime} onChange={e => setBusinessForm({...businessForm, openingTime: e.target.value})} className="input-premium" /></div>
                                            <div className="flex-1"><label className="text-xs font-bold text-muted-foreground">Closing Time</label><input type="time" required value={businessForm.closingTime} onChange={e => setBusinessForm({...businessForm, closingTime: e.target.value})} className="input-premium" /></div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-muted-foreground">Restaurant Logo / Cover</label>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="input-premium p-2" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <textarea value={businessForm.description} onChange={e => setBusinessForm({...businessForm, description: e.target.value})} className="input-premium min-h-[80px]" placeholder="Restaurant Description..." />
                                        </div>
                                    </div>

                                    <h4 className="text-xl font-black text-primary border-b pb-2 mt-8">Owner Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <input type="text" required value={businessForm.ownerName} onChange={e => setBusinessForm({...businessForm, ownerName: e.target.value})} className="input-premium" placeholder="Owner Full Name *" />
                                        <input type="email" required value={businessForm.ownerEmail} onChange={e => setBusinessForm({...businessForm, ownerEmail: e.target.value})} className="input-premium" placeholder="Owner Email (Login ID) *" />
                                        <input type="text" required value={businessForm.ownerMobile} onChange={e => setBusinessForm({...businessForm, ownerMobile: e.target.value})} className="input-premium" placeholder="Owner Mobile *" />
                                        <input type="password" required value={businessForm.password} onChange={e => setBusinessForm({...businessForm, password: e.target.value})} className="input-premium" placeholder="Temporary Password *" />
                                    </div>

                                    <button type="submit" className="btn-primary w-full h-14 mt-8">Create Business & Owner Account</button>
                                </form>
                            </div>
                        )}

                        {editingUser && (
                            <div className="card-premium p-8 bg-card border-none shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="text-2xl font-black">Update User</h4>
                                        <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                                    </div>
                                    <button onClick={() => setEditingUser(null)} className="p-2 rounded-xl bg-muted"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="input-premium" placeholder="Full Name" />
                                    <input value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="input-premium" placeholder="Phone" />
                                    <input value={userForm.address} onChange={e => setUserForm({...userForm, address: e.target.value})} className="input-premium md:col-span-2" placeholder="Address" />
                                    <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="input-premium">
                                        <option value="CUSTOMER">CUSTOMER</option>
                                        <option value="RESTAURANT_OWNER">RESTAURANT_OWNER</option>
                                        <option value="DELIVERY_AGENT">DELIVERY_AGENT</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                    <button type="submit" className="btn-primary">Save User</button>
                                </form>
                            </div>
                        )}

                        <div className="card-premium overflow-hidden border-none shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <th className="py-6 px-8">Restaurant</th>
                                            <th className="py-6 px-8">Owner</th>
                                            <th className="py-6 px-8">Location</th>
                                            <th className="py-6 px-8">Status</th>
                                            <th className="py-6 px-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {restaurants.map(rest => (
                                            <tr key={rest.id} className="hover:bg-primary/5 transition-colors">
                                                <td className="py-6 px-8 flex items-center gap-4">
                                                    <img src={rest.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&fit=crop'} className="w-10 h-10 rounded-full object-cover" alt="logo"/>
                                                    <div>
                                                        <p className="font-bold text-sm">{rest.name}</p>
                                                        <p className="text-[10px] opacity-50 font-medium">{rest.phone}</p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <p className="font-bold text-sm">{rest.ownerName}</p>
                                                    <p className="text-[10px] opacity-50 font-medium">Owner</p>
                                                </td>
                                                <td className="py-6 px-8 text-xs font-bold text-muted-foreground max-w-[200px] truncate">{rest.location}</td>
                                                <td className="py-6 px-8">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${rest.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {rest.active ? 'Active' : 'Blocked'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <button 
                                                        onClick={() => toggleRestaurantStatus(rest)}
                                                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${rest.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                    >
                                                        {rest.active ? 'Block' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {restaurants.length === 0 && <p className="text-center py-8 text-muted-foreground font-medium">No businesses registered yet.</p>}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* ... other tabs would follow similar premium logic ... */}
                {activeTab === 'users' && (
                    <div className="space-y-12">
                        <div className="flex justify-between items-center bg-primary/5 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                            <div>
                                <h3 className="text-3xl font-black mb-2">User & Admin Management</h3>
                                <p className="text-muted-foreground font-medium">Manage platform users and administrators.</p>
                            </div>
                            <button 
                                onClick={() => setShowAdminForm(!showAdminForm)}
                                className="btn-primary flex items-center gap-2"
                            >
                                {showAdminForm ? <><X className="w-5 h-5" /> Cancel</> : <><Plus className="w-5 h-5" /> Add Admin</>}
                            </button>
                        </div>

                        {showAdminForm && (
                            <div className="card-premium p-10 bg-card border-none shadow-3xl animate-in fade-in slide-in-from-top-4">
                                <form onSubmit={handleAdminSubmit} className="space-y-6">
                                    <h4 className="text-xl font-black text-primary border-b pb-2 mb-6">Create New Administrator</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <input type="text" required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="input-premium" placeholder="Full Name *" />
                                        <input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="input-premium" placeholder="Email Address *" />
                                        <input type="password" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="input-premium" placeholder="Password *" />
                                        <input type="text" value={adminForm.phone} onChange={e => setAdminForm({...adminForm, phone: e.target.value})} className="input-premium" placeholder="Phone Number" />
                                        <div className="md:col-span-2">
                                            <input type="text" value={adminForm.address} onChange={e => setAdminForm({...adminForm, address: e.target.value})} className="input-premium" placeholder="Address" />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary w-full h-14 mt-4">Create Admin Account</button>
                                </form>
                            </div>
                        )}

                        <div className="card-premium overflow-hidden border-none shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b-2 border-border">
                                            <th className="p-6 font-black text-muted-foreground">ID</th>
                                            <th className="p-6 font-black text-muted-foreground">User</th>
                                            <th className="p-6 font-black text-muted-foreground">Role</th>
                                            <th className="p-6 font-black text-muted-foreground">Status</th>
                                            <th className="p-6 font-black text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-6 font-medium text-muted-foreground">#{user.id}</td>
                                                <td className="p-6">
                                                    <p className="font-bold">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'RESTAURANT_OWNER' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {user.active ? 'Active' : 'Blocked'}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditUser(user)}
                                                            className="p-2 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                            title="Update User"
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleUserStatus(user)}
                                                            className={`p-2 rounded-xl transition-colors ${user.active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                                            title={user.active ? "Block User" : "Unblock User"}
                                                        >
                                                            <ShieldCheck className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.length === 0 && <p className="text-center py-8 text-muted-foreground font-medium">No users found.</p>}
                            </div>
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
                                    updateOrderStatus(incomingOrderAlert.id, 'ACCEPTED_BY_OWNER');
                                    setIncomingOrderAlert(null);
                                }}
                                className="flex-1 bg-primary text-white py-3 rounded-2xl font-black hover:scale-[1.02] transition-transform"
                            >
                                Accept Order
                            </button>
                            <button 
                                onClick={() => {
                                    updateOrderStatus(incomingOrderAlert.id, 'REJECTED_BY_OWNER');
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
        {paymentProofUrl && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => { URL.revokeObjectURL(paymentProofUrl); setPaymentProofUrl(null); }}>
                <div className="relative max-w-5xl max-h-[92vh]">
                    <button type="button" onClick={() => { URL.revokeObjectURL(paymentProofUrl); setPaymentProofUrl(null); }} className="absolute -top-12 right-0 p-2 rounded-full bg-white text-black"><X className="w-6 h-6" /></button>
                    <img src={paymentProofUrl} alt="Payment proof" className="max-w-full max-h-[88vh] object-contain rounded-xl bg-white" onClick={(e) => e.stopPropagation()} />
                </div>
            </div>
        )}
        </div>
    );
};

export default AdminDashboard;
