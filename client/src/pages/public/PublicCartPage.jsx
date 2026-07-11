import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, registerCustomer, placeOrder, getActiveOrders } from '../../api/publicApi';
import {
  HiOutlineShoppingCart, HiOutlineTrash, HiOutlineMinus, HiOutlinePlus,
  HiOutlineUserAdd, HiOutlineClipboardList, HiOutlineArrowLeft, HiOutlineCheck
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { formatCurrency } from '../../utils/helpers';

const PublicCartPage = () => {
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', street: '', city: '', pincode: '' });
  
  // Real-time tracking State
  const [activeOrders, setActiveOrders] = useState([]);
  const socketRef = useRef(null);

  // Load cart from local storage
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
    loadCart();
    fetchCustomersList();
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('ck_cart', JSON.stringify(newCart));
    // Trigger custom event so navbar can update badge
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const fetchCustomersList = async () => {
    try {
      const { data } = await getCustomers();
      setCustomers(data.data);
      if (data.data.length > 0) {
        // Auto-select Amit Shah if present, otherwise first customer
        const amit = data.data.find(c => c.phone === '8765432102' || c.name.toLowerCase().includes('amit'));
        if (amit) {
          setSelectedCustomerId(amit._id);
        } else {
          setSelectedCustomerId(data.data[0]._id);
        }
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

  // Socket connection to listen for order status updates
  useEffect(() => {
    if (!selectedCustomerId) return;
    fetchCustomerOrders(selectedCustomerId);

    const socketHost = window.location.origin.includes('5173')
      ? 'http://localhost:5000'
      : window.location.origin;
    
    socketRef.current = io(socketHost);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', selectedCustomerId);
    });

    socketRef.current.on('orderStatusUpdated', ({ orderId, status }) => {
      toast.success(`Order status updated to ${status.toUpperCase()}!`, {
        icon: '🍳',
        duration: 4000
      });
      fetchCustomerOrders(selectedCustomerId);
    });

    socketRef.current.on('orderUpdate', (updatedOrder) => {
      if (updatedOrder.customerId === selectedCustomerId) {
        fetchCustomerOrders(selectedCustomerId);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedCustomerId]);

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
    if (!selectedCustomerId) {
      toast.error('Please select or register a customer account');
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
      homeCookId: cart[0].homeCookId._id || cart[0].homeCookId,
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
      await placeOrder(orderData);
      toast.success('Order placed successfully! tracking is live.', {
        icon: '🎉',
        duration: 5000
      });
      saveCart([]);
      fetchCustomerOrders(selectedCustomerId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-orange-600 transition-colors">
          <HiOutlineArrowLeft />
          Back to Food Menu
        </Link>
      </div>

      {/* Split Page Side-Menu Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 columns: Cart checkout & customer setup */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="border-b border-surface-100 pb-4">
            <h1 className="text-3xl font-black text-surface-900 tracking-tight flex items-center gap-2.5">
              <HiOutlineShoppingCart className="text-orange-500" />
              <span>Checkout Order</span>
            </h1>
            <p className="text-sm text-surface-700/60 mt-1">Review your basket, select customer details, and finalize order.</p>
          </div>

          {/* Customer Selection Card */}
          <div className="bg-white border border-surface-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-surface-900 text-base">Select Customer Account</h3>
                <p className="text-xs text-surface-700/50">Identify who is placing this simulated order.</p>
              </div>
              <button
                onClick={() => setShowNewCustomerModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <HiOutlineUserAdd size={16} />
                Register New User
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Customer Name & Phone</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-surface-800 font-semibold"
                >
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone || c.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerId && (
                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-orange-800/80 tracking-wider">Simulated Delivery Address</span>
                  <span className="text-xs font-medium text-surface-800 mt-1 leading-snug">
                    {customers.find(c => c._id === selectedCustomerId)?.addresses?.[0]
                      ? `${customers.find(c => c._id === selectedCustomerId).addresses[0].street}, ${customers.find(c => c._id === selectedCustomerId).addresses[0].city}, ${customers.find(c => c._id === selectedCustomerId).addresses[0].pincode}`
                      : 'No address registered. Default address will be applied.'
                    }
                  </span>
                </div>
              )}
            </div>
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
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-650 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20"
                  >
                    Confirm & Place Order
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

            {activeOrders.length === 0 ? (
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
                  placeholder="e.g. Amit Shah"
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
                  placeholder="e.g. amit@example.com"
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
                  placeholder="e.g. 8765432102"
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
                    placeholder="e.g. 22 Andheri West"
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
                    placeholder="e.g. 400058"
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

export default PublicCartPage;
