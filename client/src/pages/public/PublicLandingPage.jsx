import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedCooks } from '../../api/publicApi';
import { HiOutlineArrowRight, HiOutlineHeart, HiOutlineClock } from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PublicLandingPage = () => {
  const [featuredCooks, setFeaturedCooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCooks = async () => {
      try {
        const selectedCity = localStorage.getItem('ck_selected_city') || 'Coimbatore';
        const { data } = await getFeaturedCooks({ city: selectedCity });
        setFeaturedCooks(data.data.slice(0, 4)); // Show top 4
      } catch (error) {
        console.error('Error fetching cooks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCooks();

    const handleCityUpdate = () => {
      setLoading(true);
      fetchCooks();
    };
    window.addEventListener('cityUpdate', handleCityUpdate);
    return () => {
      window.removeEventListener('cityUpdate', handleCityUpdate);
    };
  }, []);

  return (
    <div className="space-y-16 pb-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-red-50/50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
              Homemade & Fresh
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-surface-900 tracking-tight leading-tight">
              Enjoy Delicious <br />
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Homemade Meals
              </span> <br />
              Delivered Daily.
            </h1>
            <p className="text-base text-surface-700/70 max-w-lg">
              Experience the taste of home with healthy, hygienic, and authentic dishes prepared with love by certified home cooks in your neighborhood.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/menu"
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/20 group"
              >
                <span>Browse Food Menu</span>
                <HiOutlineArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register-cook"
                className="px-6 py-3 rounded-xl text-sm font-semibold text-surface-700 bg-white border border-surface-200 hover:bg-surface-50 transition-all"
              >
                Become a Home Cook
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-300/10 to-red-500/10 rounded-3xl blur-3xl" />
            <img
              src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=600&auto=format&fit=crop&q=80"
              alt="Fresh healthy salad bowl"
              className="relative rounded-3xl shadow-2xl border border-white/40 w-full object-cover max-h-[400px]"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">Why Choose Us?</h2>
          <p className="text-sm text-surface-700/60 mt-2">
            We bridge the gap between passion and hunger, delivering quality home-cooked goodness.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Super Hygienic',
              desc: 'All cooks are FSSAI licensed and operate strictly clean home kitchens.',
              icon: '🧼',
            },
            {
              title: 'Regional Authenticity',
              desc: 'From traditional South Indian thalis to authentic Mughlai curries, enjoy original flavors.',
              icon: '🌶️',
            },
            {
              title: 'Empowering Communities',
              desc: 'Supporting local home makers and chefs to turn their culinary skills into a thriving business.',
              icon: '👩‍🍳',
            },
          ].map((feat, i) => (
            <div key={i} className="p-6 rounded-2xl border border-surface-200/50 bg-surface-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <span className="text-3xl mb-4 block">{feat.icon}</span>
              <h3 className="text-lg font-bold text-surface-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-surface-700/70">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cooks Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-surface-900">Meet Our Featured Home Cooks</h2>
            <p className="text-sm text-surface-700/60 mt-1">Highly-rated local chefs making mouth-watering dishes.</p>
          </div>
          <Link to="/register-cook" className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1">
            <span>Join them today</span>
            <HiOutlineArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading local chefs..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCooks.map((cook) => (
              <div key={cook._id} className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <div className="h-40 bg-orange-100 relative">
                  <img
                    src={cook.profileImage || "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400"}
                    alt={cook.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-bold text-orange-600">
                    ★ {cook.rating || 'New'}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-surface-900 text-base">{cook.name}</h3>
                    <p className="text-xs text-surface-700/60 line-clamp-2">{cook.bio || 'Professional home cook cooking fresh meals.'}</p>
                    <div className="flex flex-wrap gap-1">
                      {cook.speciality?.map((spec) => (
                        <span key={spec} className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-orange-50 text-orange-700">{spec}</span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-700/50 mt-4">
                    <span>{cook.totalOrders || 0}+ Orders completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicLandingPage;
