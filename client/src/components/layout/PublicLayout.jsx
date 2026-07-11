import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineX, HiOutlineShoppingCart, HiOutlineLocationMarker, HiOutlineUser } from 'react-icons/hi';

const CITIES = ['Coimbatore', 'Trichy', 'Theni', 'Chennai', 'Madurai', 'Salem'];

const PublicLayout = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const location = useLocation();

  const getInitialCity = () => {
    const savedCity = localStorage.getItem('ck_selected_city');
    if (savedCity) return savedCity;
    const customerRaw = localStorage.getItem('ck_customer');
    if (customerRaw) {
      try {
        const customerObj = JSON.parse(customerRaw);
        if (customerObj.addresses && customerObj.addresses[0]?.city) {
          return customerObj.addresses[0].city;
        }
      } catch (e) {}
    }
    return 'Coimbatore'; // Default
  };

  const [selectedCity, setSelectedCity] = useState(getInitialCity());

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setSelectedCity(newCity);
    localStorage.setItem('ck_selected_city', newCity);
    // Clear the cart when switching cities
    localStorage.removeItem('ck_cart');
    window.dispatchEvent(new Event('cartUpdate'));
    window.dispatchEvent(new Event('cityUpdate'));
  };

  const handleLogout = () => {
    localStorage.removeItem('ck_customer');
    localStorage.removeItem('ck_customer_token');
    localStorage.removeItem('ck_cart');
    setCustomer(null);
    window.dispatchEvent(new Event('cartUpdate'));
    window.dispatchEvent(new Event('cityUpdate'));
    navigate('/');
  };

  useEffect(() => {
    const checkCustomer = () => {
      const stored = localStorage.getItem('ck_customer');
      if (stored) {
        try {
          setCustomer(JSON.parse(stored));
        } catch (e) {
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    };
    checkCustomer();
    const interval = setInterval(checkCustomer, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (customer && customer.addresses && customer.addresses[0]?.city) {
      const customerCity = customer.addresses[0].city;
      const currentSaved = localStorage.getItem('ck_selected_city');
      if (!currentSaved) {
        localStorage.setItem('ck_selected_city', customerCity);
        setSelectedCity(customerCity);
        window.dispatchEvent(new Event('cityUpdate'));
      }
    }
  }, [customer]);

  const updateCount = () => {
    const saved = localStorage.getItem('ck_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const count = parsed.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('cartUpdate', updateCount);
    const interval = setInterval(updateCount, 1500);
    return () => {
      window.removeEventListener('cartUpdate', updateCount);
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Food Menu' },
    { to: '/register-cook', label: 'Become a Home Cook' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-surface-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & City Selector */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-base font-black text-white shadow-lg shadow-orange-500/25">
                  CK
                </div>
                <span className="text-lg font-bold text-surface-900 hidden sm:inline-block">Cloud Kitchen</span>
              </Link>

              {/* Swiggy-like City Selector */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 hover:border-orange-200 transition-colors px-3 py-1.5 rounded-xl shadow-sm">
                <HiOutlineLocationMarker className="text-orange-500 text-base" />
                <select
                  value={selectedCity}
                  onChange={handleCityChange}
                  className="bg-transparent text-xs font-bold text-orange-950 focus:outline-none cursor-pointer pr-1"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navbar Center/Right Items */}
            <div className="flex items-center gap-3">
              {/* Food Menu Link (desktop) */}
              <Link
                to="/menu"
                className={`hidden md:block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/menu'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                Food Menu
              </Link>

              {/* Shopping Cart Link */}
              <Link
                to="/cart"
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/cart'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                <HiOutlineShoppingCart size={18} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1.5 flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Sidebar Menu Button */}
              {customer ? (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 hover:bg-orange-100/50 transition-all active:scale-95 shadow-sm"
                >
                  <span className="text-xs font-bold text-orange-700 hidden sm:inline-block">
                    Hi, {customer.name.split(' ')[0]}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-black shadow-md">
                    {customer.name[0].toUpperCase()}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 text-surface-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <HiOutlineMenu size={24} />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Right Sidebar Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-full bg-white shadow-2xl flex flex-col z-50 animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <span className="text-base font-bold text-surface-900">Menu & Account</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-surface-400 hover:text-surface-700 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-5 border-b border-surface-100 bg-gradient-to-br from-orange-50/50 to-red-50/50">
              {customer ? (
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-base font-black shadow-lg shadow-orange-500/20">
                    {customer.name[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-surface-400 font-medium">Logged in as</div>
                    <div className="text-sm font-bold text-surface-900">{customer.name}</div>
                    <div className="text-[11px] text-surface-500">{customer.phone}</div>
                  </div>
                </div>
              ) : (
                <div className="text-left space-y-2">
                  <div className="text-sm font-bold text-surface-900">Welcome, Foodie!</div>
                  <p className="text-xs text-surface-500">Log in to view your orders and track deliveries.</p>
                  <Link
                    to="/cart"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-block px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-500/25 transition-all"
                  >
                    Login / Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Body / Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700 hover:bg-orange-50/30 hover:text-orange-600'
                }`}
              >
                <span>🏠</span>
                <span>Home</span>
              </Link>

              <Link
                to="/menu"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/menu'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700 hover:bg-orange-50/30 hover:text-orange-600'
                }`}
              >
                <span>🍽️</span>
                <span>Food Menu</span>
              </Link>

              <Link
                to="/register-cook"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/register-cook'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700 hover:bg-orange-50/30 hover:text-orange-600'
                }`}
              >
                <span>👩‍🍳</span>
                <span>Become a Home Cook</span>
              </Link>

              <Link
                to="/cart"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/cart'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700 hover:bg-orange-50/30 hover:text-orange-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>🛒</span>
                  <span>Cart</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <div className="border-t border-surface-100 my-4" />

              <Link
                to="/login"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/login'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700 hover:bg-orange-50/30 hover:text-orange-600'
                }`}
              >
                <span>🔑</span>
                <span>Staff Login</span>
              </Link>
            </div>

            {/* Logout Footer inside Drawer */}
            {customer && (
              <div className="p-4 border-t border-surface-100 bg-surface-50/30">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all shadow-md shadow-red-500/10 active:scale-95"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-surface-900 text-white/60 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-sm font-black text-white">
                  CK
                </div>
                <span className="text-base font-bold text-white">Cloud Kitchen</span>
              </div>
              <p className="text-sm leading-relaxed">
                Connecting home cooks with food lovers. Fresh, homemade meals delivered to your doorstep.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/menu" className="block text-sm hover:text-orange-400 transition-colors">Browse Menu</Link>
                <Link to="/register-cook" className="block text-sm hover:text-orange-400 transition-colors">Become a Cook</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
              <div className="space-y-2 text-sm">
                <p>support@cloudkitchen.com</p>
                <p>+91 98765 43210</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Follow Us</h4>
              <div className="flex gap-3">
                {['Instagram', 'Twitter', 'Facebook'].map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors cursor-pointer">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs">
            © 2026 Cloud Kitchen. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
