import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Map, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const AddressForm = ({ initialData, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        mobileNumber: '',
        houseNo: '',
        area: '',
        landmark: '',
        city: 'Beohari',
        state: 'Madhya Pradesh',
        pinCode: '484774',
        addressType: 'Home',
        deliveryNote: '',
        latitude: 24.0322,
        longitude: 81.3853,
        isDefault: false
    });

    const [locationStatus, setLocationStatus] = useState('');
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
            if (initialData.latitude && initialData.longitude) {
                setShowMap(true);
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTypeSelect = (type) => {
        setFormData({ ...formData, addressType: type });
    };

    const handleGetCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setLocationStatus('Fetching...');
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await response.json();
                        
                        if (data && data.address) {
                            const { city, town, village, state, postcode, road, suburb } = data.address;
                            
                            const detectedCity = city || town || village || '';
                            
                            if (detectedCity.toLowerCase() !== 'beohari') {
                                toast.error('Sorry, food delivery is not available at this location. We currently serve only Beohari.');
                                setLocationStatus('');
                                return;
                            }

                            setFormData(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                area: suburb || road || prev.area,
                                state: state || prev.state,
                                pinCode: postcode || prev.pinCode
                            }));
                            toast.success('Location updated!');
                        }
                        setLocationStatus('');
                        setShowMap(true);
                    } catch (error) {
                        console.error('Error fetching address details', error);
                        toast.error('Failed to resolve location details.');
                        setLocationStatus('');
                        setShowMap(true); // Still show map so they can adjust
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    toast.error('Location access denied or unavailable.');
                    setLocationStatus('');
                }
            );
        } else {
            toast.error("Geolocation is not supported by this browser.");
        }
    };

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setFormData(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
            },
        });
        return formData.latitude ? (
            <Marker position={{ lat: formData.latitude, lng: formData.longitude }}></Marker>
        ) : null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (formData.city.toLowerCase() !== 'beohari') {
            toast.error("Sorry, food delivery is not available at this location. We currently serve only Beohari.");
            return;
        }

        onSave(formData);
    };

    return (
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            {onCancel && (
                <button onClick={onCancel} className="absolute top-6 right-6 p-2 rounded-full bg-muted hover:bg-border transition-colors z-10">
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2 pr-8">
                    <MapPin className="text-primary w-6 h-6 shrink-0" /> {initialData ? 'Edit Address' : 'Add New Address'}
                </h2>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-primary/80 leading-snug">
                        📍 Delivering in Beohari. Food delivery is available in Beohari and our covered nearby delivery areas.
                    </p>
                </div>
            </div>

            <button 
                type="button"
                onClick={handleGetCurrentLocation}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 py-4 rounded-2xl font-bold transition-colors mb-6 border border-blue-200 dark:border-blue-800"
            >
                <Navigation className={`w-5 h-5 ${locationStatus ? 'animate-pulse' : ''}`} />
                {locationStatus || 'Use Current Location'}
            </button>

            {showMap && (
                <div className="mb-6 relative rounded-2xl overflow-hidden border border-border h-48 w-full z-0">
                    <MapContainer center={[formData.latitude, formData.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                    </MapContainer>
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-black/90 p-2 rounded-lg text-xs font-bold text-center z-[400] shadow-sm backdrop-blur-sm pointer-events-none">
                        Tap on the map to adjust exact location
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">Full Name *</label>
                        <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="input-premium" placeholder="e.g. Sagar Kushwaha" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">Mobile Number *</label>
                        <input type="tel" name="mobileNumber" required value={formData.mobileNumber} onChange={handleChange} className="input-premium" placeholder="10-digit mobile number" pattern="[0-9]{10}" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">House / Flat / Shop No. *</label>
                    <input type="text" name="houseNo" required value={formData.houseNo} onChange={handleChange} className="input-premium" placeholder="e.g. House No 123" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">Area / Locality *</label>
                        <input type="text" name="area" required value={formData.area} onChange={handleChange} className="input-premium" placeholder="e.g. Ward 4, Main Market" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">Landmark (Optional)</label>
                        <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="input-premium" placeholder="e.g. Near Post Office" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">City *</label>
                        <select name="city" required value={formData.city} onChange={handleChange} className="input-premium appearance-none font-bold text-primary">
                            <option value="Beohari">Beohari</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">State *</label>
                        <input type="text" name="state" required value={formData.state} onChange={handleChange} className="input-premium" placeholder="Madhya Pradesh" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">PIN Code *</label>
                        <input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange} className="input-premium" placeholder="484774" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 ml-2 text-muted-foreground">Save address as *</label>
                    <div className="flex gap-3">
                        {['Home', 'Work', 'Other'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleTypeSelect(type)}
                                className={`flex-1 py-2.5 rounded-xl font-bold transition-colors ${formData.addressType === type ? 'bg-primary text-white shadow-md' : 'bg-muted hover:bg-border text-foreground'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1.5 ml-2 text-muted-foreground">Delivery Note (Optional)</label>
                    <input type="text" name="deliveryNote" value={formData.deliveryNote} onChange={handleChange} className="input-premium" placeholder="e.g. Please call upon arrival" />
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-primary/20">
                        {loading ? 'Saving...' : 'Save Address'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddressForm;
