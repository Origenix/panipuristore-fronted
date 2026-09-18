import React, { useState, useEffect } from 'react';
import { Home, Briefcase, MapPin, Plus, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import AddressForm from '../components/AddressForm';

const MyAddresses = () => {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/addresses/my');
            setAddresses(res.data);
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async (formData) => {
        setSaving(true);
        try {
            if (editingAddress) {
                await axios.put(`/addresses/${editingAddress.id}`, formData);
                toast.success('Address updated successfully');
            } else {
                await axios.post('/addresses', formData);
                toast.success('Address added successfully');
            }
            setShowForm(false);
            setEditingAddress(null);
            fetchAddresses();
        } catch (error) {
            console.error('Error saving address:', error);
            toast.error(error.response?.data?.message || 'Failed to save address');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        
        try {
            await axios.delete(`/addresses/${id}`);
            toast.success('Address deleted successfully');
            fetchAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.error('Failed to delete address');
        }
    };

    const getIconForType = (type) => {
        switch (type.toLowerCase()) {
            case 'home': return <Home className="w-5 h-5" />;
            case 'work': return <Briefcase className="w-5 h-5" />;
            default: return <MapPin className="w-5 h-5" />;
        }
    };

    if (showForm) {
        return (
            <div className="pt-28 pb-20 min-h-screen bg-background section-padding max-w-3xl mx-auto">
                <AddressForm 
                    initialData={editingAddress} 
                    onSave={handleSaveAddress} 
                    onCancel={() => { setShowForm(false); setEditingAddress(null); }}
                    loading={saving}
                />
            </div>
        );
    }

    return (
        <div className="pt-28 pb-20 min-h-screen bg-background">
            <div className="section-padding max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-muted hover:bg-border transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black uppercase text-primary">My Addresses</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-3xl border border-border">
                        <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">No Saved Addresses</h3>
                        <p className="text-muted-foreground mb-6">Add a delivery address to checkout faster.</p>
                        <button 
                            onClick={() => setShowForm(true)}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add New Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button 
                            onClick={() => setShowForm(true)}
                            className="w-full p-4 border-2 border-dashed border-primary/40 rounded-2xl text-primary font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add New Address
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {addresses.map(address => (
                                <div key={address.id} className="card-premium p-6 bg-card border border-border flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm">
                                                {getIconForType(address.addressType)}
                                                {address.addressType}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">{address.fullName}</h3>
                                        <p className="text-muted-foreground text-sm mb-4">
                                            {address.houseNo}, {address.area}<br/>
                                            {address.landmark && <span>{address.landmark},<br/></span>}
                                            {address.city}, {address.state} - {address.pinCode}<br/>
                                            Mobile: <span className="font-semibold text-foreground">{address.mobileNumber}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                                        <button 
                                            onClick={() => { setEditingAddress(address); setShowForm(true); }}
                                            className="text-blue-500 font-bold hover:underline flex items-center gap-1 text-sm"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAddress(address.id)}
                                            className="text-red-500 font-bold hover:underline flex items-center gap-1 text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAddresses;
