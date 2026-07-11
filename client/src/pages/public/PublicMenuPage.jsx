import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMenu } from '../../api/publicApi';
import {
  HiOutlineSearch, HiOutlineShoppingCart, HiOutlineTrash,
  HiOutlineMinus, HiOutlinePlus, HiOutlineArrowRight
} from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PublicMenuPage = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [availableCategories, setAvailableCategories] = useState([]);

  // Local storage synchronized Cart State
  const [cart, setCart] = useState([]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const { data } = await getMenu({
        category: categoryFilter,
        veg: vegOnly,
        search,
        sort: sortBy
      });
      setMenuItems(data.data);
      if (data.filters?.categories) {
        setAvailableCategories(data.filters.categories);
      }
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const loadCart = () => {
    const saved = localStorage.getItem('ck_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchMenu();
    loadCart();
  }, [categoryFilter, vegOnly, sortBy]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMenu();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('ck_cart', JSON.stringify(newCart));
    // Trigger custom event so navbar can update badge
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const addToCart = (item) => {

    if (cart.length > 0 && cart[0].homeCookId._id !== item.homeCookId._id) {
      const confirmClear = window.confirm(
        `Your cart contains items from "${cart[0].homeCookId.name}". Clear cart and order from "${item.homeCookId.name}" instead?`
      );
      if (!confirmClear) return;
      saveCart([{ ...item, quantity: 1 }]);
      toast.success(`Cart cleared & "${item.name}" added`);
      return;
    }

    const existing = cart.find(i => i._id === item._id);
    let updated;
    if (existing) {
      updated = cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      updated = [...cart, { ...item, quantity: 1 }];
    }
    saveCart(updated);
    toast.success(`"${item.name}" added to cart`);
  };

  const updateCartQty = (itemId, change) => {
    const updated = cart.map(i => {
      if (i._id === itemId) {
        const newQty = i.quantity + change;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean);
    saveCart(updated);
  };

  const removeFromCart = (itemId) => {
    const updated = cart.filter(i => i._id !== itemId);
    saveCart(updated);
    toast.success('Item removed from cart');
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Menu items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <div className="text-left space-y-1">
            <h1 className="text-3xl font-black text-surface-900 tracking-tight">Browse Fresh Dishes</h1>
            <p className="text-sm text-surface-700/60 font-medium">Healthy, delicious homemade food prepared by certified cooks near you.</p>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface-50 border border-surface-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for biryani, curry, desserts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-surface-200 text-sm select-none">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <span className="font-semibold text-emerald-700">Veg Only</span>
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-surface-700 font-medium"
              >
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
              }`}
            >
              All Categories
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-all ${
                  categoryFilter === cat
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                }`}
              >
                {cat.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Food Grid */}
          {loading ? (
            <LoadingSpinner text="Searching recipes..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item._id} className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full">
                  <div className="relative h-40 bg-surface-100 overflow-hidden">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-white/95 backdrop-blur shadow-sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[9px] font-bold uppercase text-surface-850">{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <h3 className="font-bold text-surface-900 text-sm line-clamp-1">{item.name}</h3>
                        <span className="font-bold text-orange-600 text-sm">{formatCurrency(item.price)}</span>
                      </div>
                      <p className="text-xs text-surface-700/60 line-clamp-2 mb-3">{item.description}</p>
                    </div>

                    <div className="pt-3 border-t border-surface-100 space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-surface-750">Cook: <span className="font-bold text-surface-900">{item.homeCookId?.name || 'Home Cook'}</span></span>
                        <span className="text-surface-750">⏱ {item.preparationTime || '30 mins'}</span>
                      </div>

                      <button
                        onClick={() => addToCart(item)}
                        className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <HiOutlineShoppingCart size={15} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {menuItems.length === 0 && !loading && (
            <div className="text-center py-16 bg-surface-50 rounded-2xl border border-dashed border-surface-200">
              <p className="text-surface-700/50 text-sm font-medium">No dishes match your filters</p>
            </div>
          )}
        </div>

        {/* Right Side: Sticky Checkout Basket Summary Panel */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-surface-200/80 p-5 shadow-lg space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h2 className="font-black text-surface-900 text-lg flex items-center gap-2">
                <HiOutlineShoppingCart className="text-orange-500" />
                <span>Selected Basket</span>
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => saveCart([])}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-3xl block mb-2">🛒</span>
                <p className="text-xs text-surface-700/50 font-medium">Your basket is empty. Add delicious items from the menu!</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item._id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-surface-50 border border-surface-200/40">
                      <div className="flex-1 mr-2 text-left">
                        <p className="font-bold text-surface-900">{item.name}</p>
                        <p className="text-[10px] text-surface-700/50">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item._id, -1)}
                          className="w-5 h-5 rounded-full bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100"
                        >
                          <HiOutlineMinus size={10} />
                        </button>
                        <span className="font-bold text-xs text-surface-850 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item._id, 1)}
                          className="w-5 h-5 rounded-full bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100"
                        >
                          <HiOutlinePlus size={10} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-rose-500 ml-1 hover:text-rose-750"
                        >
                          <HiOutlineTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-surface-100 pt-3 space-y-2.5 text-xs text-surface-800">
                  <div className="flex justify-between font-semibold">
                    <span>Kitchen:</span>
                    <span className="text-orange-650">{cart[0].homeCookId?.name}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm border-t border-surface-100 pt-2.5">
                    <span>Subtotal:</span>
                    <span className="text-base text-orange-600">{formatCurrency(getCartTotal())}</span>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <HiOutlineArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMenuPage;
