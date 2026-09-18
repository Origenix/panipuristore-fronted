import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Search, MapPin, Clock, ArrowRight, ChevronRight, Zap, Flame, Leaf, CheckCircle2, Star } from 'lucide-react';



const heroImages = [
  "/panipuri_hero_bg.jpg",
  "/dahi_puri.jpg",
  "/bhel_puri.jpg",
  "/papdi_chaat.jpg",
  "/beverage.jpg"
];

const Home = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'ROLE_ADMIN') navigate('/admin');
      else if (user.role === 'ROLE_RESTAURANT_OWNER') navigate('/owner');
      else if (user.role === 'ROLE_DELIVERY_AGENT') navigate('/delivery');
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories and menu items
        const [res, catRes] = await Promise.all([
            axios.get('/menu/public/restaurant/1'),
            axios.get('/categories/public/active')
        ]);
        
        setCategories(catRes.data);

        // Filter Trending items
        const trendingItems = res.data
          .filter(item => item.trending === true)
          .map(item => ({...item, image: item.image || '/panipuri_hero_bg.jpg'}));
          
        setMenuItems(trendingItems.slice(0, 4));
        setError(null);
      } catch (err) {
        console.error(err);
        if (err.code === 'ERR_NETWORK') {
          setError('Network error: Cannot connect to server.');
        } else {
          setError('Failed to load menu items.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="pt-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative h-[650px] lg:h-[750px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroImages.map((img, index) => (
            <img 
              key={index}
              src={img} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentHeroImage ? 'opacity-100' : 'opacity-0'}`}
              alt={`Panipuri Store Background ${index + 1}`}
            />
          ))}
          {/* Removed the dark overlay so the images are 100% clear. Only keeping bottom gradient for smooth transition to page content */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-20">
          <span className="badge-premium bg-accent text-secondary mb-6 shadow-lg">100% Authentic Taste</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-white drop-shadow-xl">
            Street Food. <br />
            <span className="text-primary">Big Flavours.</span>
          </h1>
          <p className="text-base md:text-2xl text-gray-200 mb-10 font-medium max-w-2xl mx-auto drop-shadow-md">
            Your favourite pani puri, crispy chaats, and tangy Indian street-food specials — prepared fresh, hygienic, and incredibly delicious.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/menu" className="btn-primary w-full sm:w-auto h-14 px-10 text-lg">
              Order Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/restaurants" className="btn-secondary bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 w-full sm:w-auto h-14 px-10 text-lg">
              Explore Restaurants
            </Link>
          </div>
        </div>
      </section>

      {/* Categories / Menu Discovery */}
      <section className="section-padding -mt-20 relative z-20">
        <div className="glass rounded-[2rem] p-6 md:p-12 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-4">
            <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3">
              Cravings? <span className="text-primary">We got you.</span>
            </h2>
            <Link to="/menu" className="text-primary font-bold flex items-center gap-1 group text-sm md:text-base">
              View full menu <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 custom-scrollbar scroll-smooth snap-x snap-mandatory">
            {categories.map((cat, idx) => (
              <Link 
                key={idx} 
                to={`/menu`}
                className="flex-shrink-0 group flex flex-col items-center w-[90px] md:w-[150px] snap-center"
              >
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 md:mb-4 border-[3px] md:border-[4px] border-background shadow-lg group-hover:border-primary transition-all duration-300 relative">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                  <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={cat.name} />
                </div>
                <span className="text-[11px] md:text-base font-bold text-center group-hover:text-primary transition-colors leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Panipuri Store? */}
      <section className="section-padding bg-muted/30">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Why Panipuri Store?</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">We bring the authentic street food experience without compromising on quality or hygiene.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          <div className="card-premium p-6 md:p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-6">
              <Leaf className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Fresh Ingredients</h3>
            <p className="text-muted-foreground">Every puri is fried fresh, and our chutneys are made daily using premium ingredients.</p>
          </div>
          <div className="card-premium p-6 md:p-8 text-center flex flex-col items-center border-primary/20 shadow-primary/5">
            <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-primary flex items-center justify-center mb-6">
              <Flame className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Authentic Flavours</h3>
            <p className="text-muted-foreground">Spicy, tangy, and sweet. Our recipes stay true to the authentic Indian street food roots.</p>
          </div>
          <div className="card-premium p-6 md:p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3">100% Hygienic</h3>
            <p className="text-muted-foreground">Prepared in a pristine, modern kitchen. Safe, clean, and totally trustworthy.</p>
          </div>
        </div>
      </section>

      {/* Popular Items / Trending */}
      <section className="section-padding">
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3">
            Trending <span className="text-primary">Pani Puri Bites</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 dark:bg-red-950/10 rounded-3xl border border-red-200 dark:border-red-900">
            <p className="text-red-500 font-bold text-lg mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-secondary">Try Again</button>
          </div>
        ) : menuItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
            {menuItems.map((item) => (
              <div key={item.id} className="card-premium group flex flex-col">
                <div className="relative h-60 overflow-hidden">
                  <img src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&fit=crop'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {item.vegOrNonVeg === 'Veg' ? (
                    <div className="absolute top-4 right-4 bg-white p-1 rounded-sm shadow-sm">
                      <div className="w-4 h-4 border-2 border-green-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-white p-1 rounded-sm shadow-sm">
                      <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-bold text-white drop-shadow-md">{item.name}</h3>
                      <p className="text-white/80 text-sm font-medium">{item.categoryName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">{item.description || "A delicious street-food special prepared fresh for you."}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-2xl font-black">
                      ₹{item.price}
                    </div>
                    <Link to="/menu" className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-bold transition-colors">
                      Add +
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">No items available.</div>
        )}
      </section>

      {/* Special Offers */}
      <section className="section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-[3rem] p-10 text-white relative overflow-hidden group bg-gradient-to-r from-[#D32F2F] to-[#E64A19]">
            <div className="relative z-10">
              <span className="badge-premium bg-white/20 text-white mb-4">Limited Time</span>
              <h3 className="text-4xl md:text-5xl font-black mb-4">Chaat Lover's <br/>Combo</h3>
              <p className="text-lg md:text-xl mb-8 opacity-90 font-medium max-w-sm">Get 2 Plates of Pani Puri + 1 Dahi Puri at 20% OFF!</p>
              <Link to="/menu" className="inline-block bg-white text-primary px-8 py-4 rounded-full font-black shadow-xl hover:-translate-y-1 transition-transform">
                Grab Combo
              </Link>
            </div>
            <img src="https://images.unsplash.com/photo-1593504049359-71556090623a?w=600&fit=crop" className="absolute right-0 top-0 bottom-0 h-full w-1/2 object-cover mix-blend-overlay opacity-40 group-hover:scale-110 transition-transform duration-700" alt="Offer bg" />
          </div>
          
          <div className="rounded-[3rem] p-10 text-secondary relative overflow-hidden group bg-accent">
            <div className="relative z-10">
              <span className="badge-premium bg-black/10 text-secondary mb-4">New User</span>
              <h3 className="text-4xl md:text-5xl font-black mb-4">First Order? <br/>Free Delivery!</h3>
              <p className="text-lg md:text-xl mb-8 opacity-90 font-medium max-w-sm">Use code <strong className="bg-white px-2 py-1 rounded-md">PANIPURI100</strong> on checkout.</p>
              <Link to="/signup" className="inline-block bg-secondary text-white px-8 py-4 rounded-full font-black shadow-xl hover:-translate-y-1 transition-transform">
                Sign Up Now
              </Link>
            </div>
            <Zap className="absolute -right-10 -bottom-10 w-64 h-64 text-white/20 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
