import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { signupCustomer, loginCustomer, placeOrder, getActiveOrders } from '../../api/publicApi';
import {
  HiOutlineShoppingCart, HiOutlineTrash, HiOutlineMinus, HiOutlinePlus,
  HiOutlineUserAdd, HiOutlineClipboardList, HiOutlineArrowLeft,
  HiOutlineLockClosed, HiOutlineMail, HiOutlinePhone, HiOutlineUser,
  HiOutlineHome, HiOutlineLogout
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { formatCurrency } from '../../utils/helpers';

const PublicCartPage = () => {
  const [cart, setCart] = useState([]);
  
  // Customer Auth States
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  
  // Form inputs state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '', email: '', phone: '', password: '',
    street: '', city: '', state: 'ON', pincode: ''
  });
  
  // Real-time tracking State
  const [activeOrders, setActiveOrders] = useState([]);
  const socketRef = useRef(null);

  // Load cart and check active customer session
  useEffect(() => {
    loadCart();
    
    // Check if customer is already logged in
    const savedCustomer = localStorage.getItem('ck_customer');
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer);
        setCurrentCustomer(parsed);
      } catch (e) {
        console.error('Failed to parse customer session:', e);
      }
    }
  }, []);

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

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('ck_cart', JSON.stringify(newCart));
    // Trigger custom event so navbar can update badge
    window.dispatchEvent(new Event('cartUpdate'));
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

  // Socket connection to listen for order status updates
  useEffect(() => {
    if (!currentCustomer) {
      setActiveOrders([]);
      return;
    }
    
    fetchCustomerOrders(currentCustomer._id);

    const socketHost = window.location.origin.includes('5173') || window.location.origin.includes('5174')
      ? 'http://localhost:5000'
      : window.location.origin;
    
    socketRef.current = io(socketHost);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', currentCustomer._id);
    });

    socketRef.current.on('orderStatusUpdated', ({ orderId, status }) => {
      toast.success(`Order status updated to ${status.toUpperCase()}!`, {
        icon: '🍳',
        duration: 4000
      });
      fetchCustomerOrders(currentCustomer._id);
    });

    socketRef.current.on('orderUpdate', (updatedOrder) => {
      if (updatedOrder.customerId === currentCustomer._id) {
        fetchCustomerOrders(currentCustomer._id);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentCustomer]);

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

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!currentCustomer) {
      toast.error('Please sign in or sign up first');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const orderData = {
      customerId: currentCustomer._id,
      homeCookId: cart[0].homeCookId._id || cart[0].homeCookId,
      items: cart.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
      totalAmount: getCartTotal(),
      deliveryAddress: {
        street: signupForm.street || '22 Andheri West',
        city: signupForm.city || 'Mumbai',
        state: signupForm.state || 'Maharashtra',
        pincode: signupForm.pincode || '400058'
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'placed'
    };

    try {
      await placeOrder(orderData);
      toast.success('Order placed successfully! live tracking started.', {
        icon: '🎉',
        duration: 5000
      });
      saveCart([]);
      fetchCustomerOrders(currentCustomer._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please fill in all credentials');
      return;
    }
    try {
      const { data } = await loginCustomer(loginForm);
      toast.success(`Welcome back, ${data.data.name}!`);
      setCurrentCustomer(data.data);
      localStorage.setItem('ck_customer', JSON.stringify(data.data));
      localStorage.setItem('ck_customer_token', data.data.token);
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Incorrect email or password');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.phone) {
      toast.error('Name, Email, Phone and Password are required');
      return;
    }
    try {
      const address = {
        street: signupForm.street || '456 West Rd',
        city: signupForm.city || 'Waterloo',
        state: signupForm.state || 'ON',
        pincode: signupForm.pincode || 'N2L 3G1'
      };

      const { data } = await signupCustomer({
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        password: signupForm.password,
        address
      });

      toast.success(`Account created successfully! Welcome, ${signupForm.name}.`);
      setCurrentCustomer(data.data);
      localStorage.setItem('ck_customer', JSON.stringify(data.data));
      localStorage.setItem('ck_customer_token', data.data.token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ck_customer');
    localStorage.removeItem('ck_customer_token');
    setCurrentCustomer(null);
    setActiveOrders([]);
    toast.success('Logged out successfully');
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

  if (!currentCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-left">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-orange-600 transition-colors">
            <HiOutlineArrowLeft />
            Back to Food Menu
          </Link>
        </div>

        {/* Customer Authentication Panel */}
        <div className="bg-white border border-surface-200/80 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-surface-900 tracking-tight flex items-center justify-center gap-2">
              <HiOutlineShoppingCart className="text-orange-500" />
              <span>Checkout Order</span>
            </h1>
            <p className="text-xs text-surface-700/60 mt-1">Sign in or register to complete your order</p>
          </div>

          <div className="flex border-b border-surface-100 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-surface-700/60 hover:text-surface-900'
              }`}
            >
              Customer Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'signup'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-surface-700/60 hover:text-surface-900'
              }`}
            >
              Create New Account
            </button>
          </div>

          {/* Login Tab */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-750 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. amit@customer.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-750 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                  />
                </div>
              </div>

              {/* Demo credentials hint box */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5">
                <span className="text-[10px] uppercase font-bold text-orange-800 tracking-wider">Demo Customer Credentials:</span>
                <p className="text-xs text-surface-800 mt-1">
                  Email: <span className="font-bold">amit@customer.com</span> | Password: <span className="font-bold">customer123</span> (Amit Shah)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white rounded-xl text-sm font-bold transition-all shadow-md"
              >
                Authenticate & Sign In
              </button>
            </form>
          )}

          {/* Signup Tab */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surface-750 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amit Shah"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-750 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 8765432102"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-750 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-750 uppercase tracking-wider mb-1.5">Password *</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="Create strong password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="border-t border-surface-100 pt-3">
                <h4 className="text-xs font-bold text-surface-900 flex items-center gap-1.5 mb-2.5">
                  <HiOutlineHome className="text-orange-500" />
                  <span>Delivery Address details</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Street Address (e.g. 22 Andheri West)"
                      value={signupForm.street}
                      onChange={(e) => setSignupForm({ ...signupForm, street: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="City (e.g. Mumbai)"
                      value={signupForm.city}
                      onChange={(e) => setSignupForm({ ...signupForm, city: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={signupForm.pincode}
                      onChange={(e) => setSignupForm({ ...signupForm, pincode: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white rounded-xl text-sm font-bold transition-all shadow-md"
              >
                Create Account & Register
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-orange-600 transition-colors">
          <HiOutlineArrowLeft />
          Back to Food Menu
        </Link>
      </div>

      {/* Split Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 columns: Cart checkout & Auth Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="border-b border-surface-100 pb-4">
            <h1 className="text-3xl font-black text-surface-900 tracking-tight flex items-center gap-2.5">
              <HiOutlineShoppingCart className="text-orange-500" />
              <span>Checkout Order</span>
            </h1>
            <p className="text-sm text-surface-700/60 mt-1">Review your basket, and confirm order.</p>
          </div>

          {/* Logged In Customer Profile Card */}
          <div className="bg-white border border-surface-200/85 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-black text-white text-lg">
                {currentCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-base">{currentCustomer.name}</h3>
                <p className="text-xs text-surface-700/60 font-semibold">{currentCustomer.email} | {currentCustomer.phone}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 border border-surface-200 text-surface-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-xs font-bold transition-all"
            >
              <HiOutlineLogout size={16} />
              Sign Out
            </button>
          </div>

          {/* Cart Items Details List */}
          <div className="bg-white border border-surface-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-surface-900 text-base">Items in Basket</h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-2">🛒</span>
                <p className="text-sm text-surface-700/50 font-semibold">Your basket is empty.</p>
                <Link to="/menu" className="mt-3 inline-block px-4 py-2 bg-orange-100 text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-200">
                  Go to Food Menu
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {cart.map((item) => (
                  <div key={item._id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0">
                    <div className="text-left">
                      <p className="font-bold text-surface-900 text-sm">{item.name}</p>
                      <p className="text-xs text-surface-700/50">Cooked by: {item.homeCookId?.name || 'Home Cook'}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-2 py-1">
                        <button onClick={() => updateCartQty(item._id, -1)} className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-surface-200 text-surface-700 hover:bg-surface-100">
                          <HiOutlineMinus size={10} />
                        </button>
                        <span className="font-bold text-xs text-surface-850 w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item._id, 1)} className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-surface-200 text-surface-700 hover:bg-surface-100">
                          <HiOutlinePlus size={10} />
                        </button>
                      </div>
                      
                      <span className="font-black text-surface-900 text-sm w-20 text-right">{formatCurrency(item.price * item.quantity)}</span>
                      
                      <button onClick={() => removeFromCart(item._id)} className="text-rose-500 hover:text-rose-700 p-1">
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-4 mt-2 space-y-2 border-t border-surface-100 text-sm text-surface-800">
                  <div className="flex justify-between font-medium">
                    <span>Kitchen:</span>
                    <span className="text-orange-650 font-bold">{cart[0].homeCookId?.name}</span>
                  </div>
                  <div className="flex justify-between font-black text-base border-t border-surface-100 pt-3">
                    <span>Total Bill:</span>
                    <span className="text-xl text-orange-600">{formatCurrency(getCartTotal())}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleCheckout}
                    disabled={!currentCustomer}
                    className={`px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${
                      currentCustomer
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white shadow-orange-500/20'
                        : 'bg-surface-100 text-surface-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {!currentCustomer ? 'Sign in to Place Order' : 'Confirm & Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 columns: Side menu live tracker */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white border border-surface-200/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="font-black text-surface-900 text-lg flex items-center gap-2 border-b border-surface-100 pb-3">
              <HiOutlineClipboardList className="text-orange-500" />
              <span>Live Order Tracker</span>
            </h2>

            {!currentCustomer ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-1">🔐</span>
                <p className="text-xs text-surface-700/50">Please log in to view active order tickets.</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-1">⏱️</span>
                <p className="text-xs text-surface-700/50">No active tickets for this customer profile.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {activeOrders.map((order) => {
                  const stepIndex = getStatusStepIndex(order.status);
                  return (
                    <div key={order._id} className="p-3.5 rounded-xl border border-surface-200 bg-surface-50/50 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-xs text-surface-900">{order.orderNumber}</p>
                          <p className="text-[10px] text-surface-700/50">Kitchen: {order.homeCookId?.name}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>

                      {order.status !== 'cancelled' ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[8px] font-bold uppercase text-surface-700/60">
                            <span className={stepIndex >= 0 ? 'text-orange-650 font-black' : ''}>Placed</span>
                            <span className={stepIndex >= 1 ? 'text-orange-650 font-black' : ''}>Prep</span>
                            <span className={stepIndex >= 2 ? 'text-orange-650 font-black' : ''}>Ready</span>
                            <span className={stepIndex >= 3 ? 'text-orange-650 font-black' : ''}>Transit</span>
                            <span className={stepIndex >= 4 ? 'text-orange-650 font-black' : ''}>Done</span>
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

                      <div className="flex justify-between items-center text-[10px] border-t border-surface-100 pt-2 text-surface-700/60">
                        <span>Total: <span className="font-bold text-surface-900">{formatCurrency(order.totalAmount)}</span></span>
                        <span>{order.items.length} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCartPage;
