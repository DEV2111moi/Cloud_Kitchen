import { useState, useEffect, useRef } from 'react';
import { getMenu, getCustomers, registerCustomer, placeOrder, getActiveOrders } from '../../api/publicApi';
import {
  HiOutlineSearch, HiOutlineClock, HiOutlineShoppingCart, HiOutlineTrash,
  HiOutlineMinus, HiOutlinePlus, HiOutlineCheckCircle, HiOutlineUserAdd,
  HiOutlineClipboardList, HiOutlineChevronRight
} from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const PublicMenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [availableCategories, setAvailableCategories] = useState([]);

  // Cart & Checkout State
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', street: '', city: '', pincode: '' });
  
  // Real-time tracking State
  const [activeOrders, setActiveOrders] = useState([]);
  const socketRef = useRef(null);

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

  const fetchCustomersList = async () => {
    try {
      const { data } = await getCustomers();
      setCustomers(data.data);
      if (data.data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(data.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const fetchCustomerOrders = async (cid) => {
    if (!cid) return;
    try {
      const { data } = await getActiveOrders(cid);
      setActiveOrders(data.data);
    } catch (error) {
      console.error('Failed to fetch active orders:', error);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [categoryFilter, vegOnly, sortBy]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMenu();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchCustomersList();
  }, []);

  // Socket connection to listen for order status updates
  useEffect(() => {
    const socketHost = window.location.origin.includes('5173')
      ? 'http://localhost:5000'
      : window.location.origin;
    
    socketRef.current = io(socketHost);

    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to order tracking socket');
      if (selectedCustomerId) {
        socketRef.current.emit('join', selectedCustomerId);
      }
    });

    socketRef.current.on('orderStatusUpdated', ({ orderId, status }) => {
      console.log(`🔔 Status Update for order ${orderId}: ${status}`);
      toast.success(`Order status updated to ${status.toUpperCase()}!`, {
        icon: '🍳',
        duration: 4000
      });
      // Refresh active orders
      if (selectedCustomerId) {
        fetchCustomerOrders(selectedCustomerId);
      }
    });

    socketRef.current.on('orderUpdate', (updatedOrder) => {
      if (selectedCustomerId && updatedOrder.customerId === selectedCustomerId) {
        fetchCustomerOrders(selectedCustomerId);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerOrders(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Cart operations
  const addToCart = (item) => {
    // Check if cart has items and they are from a different cook
    if (cart.length > 0 && cart[0].homeCookId._id !== item.homeCookId._id) {
      const confirmClear = window.confirm(
        `Your cart contains items from "${cart[0].homeCookId.name}". Clear cart and order from "${item.homeCookId.name}" instead?`
      );
      if (!confirmClear) return;
      setCart([{ ...item, quantity: 1 }]);
      toast.success(`Cart cleared & "${item.name}" added`);
      return;
    }

    const existing = cart.find(i => i._id === item._id);
    if (existing) {
      setCart(cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
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
    setCart(updated);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(i => i._id !== itemId));
    toast.success('Item removed from cart');
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Checkout handling
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select or register a customer account first');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const customerObj = customers.find(c => c._id === selectedCustomerId);
    if (!customerObj) return;

    const orderData = {
      customerId: selectedCustomerId,
      homeCookId: cart[0].homeCookId._id,
      items: cart.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
      totalAmount: getCartTotal(),
      deliveryAddress: {
        street: customerObj.addresses?.[0]?.street || '123 Main St',
        city: customerObj.addresses?.[0]?.city || 'Kitchener',
        state: customerObj.addresses?.[0]?.state || 'ON',
        pincode: customerObj.addresses?.[0]?.pincode || 'N2M 3L5'
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'placed'
    };

    try {
      const { data } = await placeOrder(orderData);
      toast.success('Order placed successfully! tracking is live.', {
        icon: '🎉',
        duration: 5000
      });
      setCart([]);
      fetchCustomerOrders(selectedCustomerId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  // Register New Customer Simulator
  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      toast.error('Name, Email and Phone are required');
      return;
    }
    try {
      const address = {
        label: 'Home',
        street: newCustomer.street || '456 West Rd',
        city: newCustomer.city || 'Waterloo',
        state: newCustomer.state || 'ON',
        pincode: newCustomer.pincode || 'N2L 3G1'
      };

      const { data } = await registerCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address
      });

      toast.success(`Customer "${newCustomer.name}" registered!`);
      setShowNewCustomerModal(false);
      setNewCustomer({ name: '', email: '', phone: '', street: '', city: '', pincode: '' });
      
      // Refresh customers list and auto-select
      await fetchCustomersList();
      setSelectedCustomerId(data.data._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-amber-100 text-amber-800';
      case 'ready': return 'bg-indigo-100 text-indigo-800';
      case 'picked': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-rose-100 text-rose-800';
      default: return 'bg-surface-100 text-surface-800';
    }
  };

  const getStatusStepIndex = (status) => {
    const steps = ['placed', 'preparing', 'ready', 'picked', 'delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Simulation Info Banner */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-left">
            <h4 className="font-bold text-orange-950 text-sm">Customer Order & Live Cook Acceptance Demo</h4>
            <p className="text-xs text-orange-800/80">Select/register a customer account, add food items to cart, and checkout. Then watch the status change live as the Home Cook updates the order!</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-orange-950 mb-1">Select Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-white border border-orange-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-surface-800"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.phone || c.email})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md self-end mt-5"
          >
            <HiOutlineUserAdd size={16} />
            Register User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Menu items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <div className="text-left space-y-1">
            <h1 className="text-3xl font-black text-surface-900 tracking-tight">Browse Fresh Dishes</h1>
            <p className="text-sm text-surface-700/60">Healthy, delicious homemade food prepared by certified cooks near you.</p>
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

        {/* Right Side: Sticky Checkout Cart & Live Tracking Panel */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Active Cart */}
          <div className="bg-white rounded-2xl border border-surface-200/80 p-5 shadow-lg space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h2 className="font-black text-surface-900 text-lg flex items-center gap-2">
                <HiOutlineShoppingCart className="text-orange-500" />
                <span>Your Order Cart</span>
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🛒</span>
                <p className="text-xs text-surface-700/50 font-medium">Your cart is empty. Add delicious items from the menu!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item._id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-surface-50 border border-surface-200/40">
                      <div className="flex-1 mr-2 text-left">
                        <p className="font-bold text-surface-900">{item.name}</p>
                        <p className="text-[10px] text-surface-700/50">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => updateCartQty(item._id, -1)}
                          className="w-5 h-5 rounded-full bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100"
                        >
                          <HiOutlineMinus size={10} />
                        </button>
                        <span className="font-bold text-sm text-surface-850 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item._id, 1)}
                          className="w-5 h-5 rounded-full bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100"
                        >
                          <HiOutlinePlus size={10} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-rose-500 ml-1 hover:text-rose-700"
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
                    <span>Total Amount:</span>
                    <span className="text-lg text-orange-600">{formatCurrency(getCartTotal())}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                  Confirm & Place Order
                </button>
              </div>
            )}
          </div>

          {/* Live Order Tracking Status */}
          <div className="bg-white rounded-2xl border border-surface-200/80 p-5 shadow-lg space-y-4 text-left">
            <h2 className="font-black text-surface-900 text-lg flex items-center gap-2 border-b border-surface-100 pb-3">
              <HiOutlineClipboardList className="text-orange-500" />
              <span>Live Order Tracker</span>
            </h2>

            {activeOrders.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-2xl block mb-1">⏱️</span>
                <p className="text-[11px] text-surface-700/50">No active orders found for this customer. Place an order to see live tracking updates!</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
                {activeOrders.map((order) => {
                  const stepIndex = getStatusStepIndex(order.status);
                  return (
                    <div key={order._id} className="p-3.5 rounded-xl border border-surface-200 bg-surface-50/50 space-y-3.5 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-xs text-surface-900">{order.orderNumber}</p>
                          <p className="text-[10px] text-surface-700/55">From: {order.homeCookId?.name}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Horizontal progress bar / stepper */}
                      {order.status !== 'cancelled' ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[8px] font-bold uppercase text-surface-700/60">
                            <span className={stepIndex >= 0 ? 'text-orange-650 font-black' : ''}>Placed</span>
                            <span className={stepIndex >= 1 ? 'text-orange-650 font-black' : ''}>Preparing</span>
                            <span className={stepIndex >= 2 ? 'text-orange-650 font-black' : ''}>Ready</span>
                            <span className={stepIndex >= 3 ? 'text-orange-650 font-black' : ''}>Picked</span>
                            <span className={stepIndex >= 4 ? 'text-orange-650 font-black' : ''}>Delivered</span>
                          </div>
                          <div className="w-full bg-surface-200 rounded-full h-1.5 flex overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-700"
                              style={{ width: `${(Math.max(0, stepIndex) / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg text-center">This order was cancelled.</p>
                      )}

                      <div className="flex justify-between items-center text-[10px] border-t border-surface-100 pt-2.5">
                        <span className="text-surface-700/50">Total Amount:</span>
                        <span className="font-bold text-surface-850">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Customer Dialog Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-surface-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up text-left">
            <div>
              <h3 className="text-lg font-black text-surface-900">Register Simulated Customer</h3>
              <p className="text-xs text-surface-700/60">Create a customer profile to simulate ordering meals.</p>
            </div>
            <form onSubmit={handleRegisterCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-surface-750 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-surface-750 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-surface-750 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-750 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 101 Lake View Road"
                    value={newCustomer.street}
                    onChange={(e) => setNewCustomer({ ...newCustomer, street: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-750 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-750 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 400001"
                    value={newCustomer.pincode}
                    onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-surface-700 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 rounded-xl transition-all shadow-md"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenuPage;
