import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineX, HiOutlineShoppingCart } from 'react-icons/hi';

const PublicLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

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
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-base font-black text-white shadow-lg shadow-orange-500/25">
                CK
              </div>
              <span className="text-lg font-bold text-surface-900">Cloud Kitchen</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-surface-700 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

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
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1.5 flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/login"
                className="ml-3 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-6-600 transition-all shadow-lg shadow-orange-500/25"
              >
                Staff Login
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-surface-700">
              {menuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-surface-200 animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                    location.pathname === link.to
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-surface-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Cart Link */}
              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/cart'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-surface-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <HiOutlineShoppingCart size={18} />
                  <span>Cart</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-orange-600"
              >
                Staff Login
              </Link>
            </div>
          </div>
        )}
      </nav>

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
