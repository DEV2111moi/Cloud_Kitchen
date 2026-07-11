import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCheckCircle,
  HiOutlineClock, HiOutlineTruck, HiOutlineCurrencyRupee, HiOutlineStar
} from 'react-icons/hi';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DeliveryDashboardPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [profile, setProfile] = useState(null);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/public/orders/delivery/${user._id}`);
      setTasks(data.data);
    } catch (error) {
      console.error('Failed to fetch delivery tasks:', error);
      toast.error('Failed to load delivery tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/public/delivery-partner/${user._id}/profile`);
      setProfile(data.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchDeliveredOrders = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/public/orders/delivery/${user._id}/history`);
      setDeliveredOrders(data.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { data } = await axios.put(`${API_URL}/public/orders/${orderId}/delivery-status`, {
        status: newStatus
      });
      if (data.success) {
        toast.success(`Order marked as ${newStatus}!`);
        fetchTasks();
        fetchProfile(); // refresh stats after delivery
        if (newStatus === 'delivered') {
          fetchDeliveredOrders(); // refresh history
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update delivery status');
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchTasks();
      fetchProfile();
      fetchDeliveredOrders();

      // Establish Socket connection for live status updates
      const socketHost = window.location.origin.includes('5173') || window.location.origin.includes('5174')
        ? 'http://localhost:5000'
        : window.location.origin;
      const socket = io(socketHost);

      socket.on('connect', () => {
        console.log('Delivery socket connected');
      });

      socket.on('orderUpdate', (updatedOrder) => {
        if (updatedOrder.deliveryPartnerId?._id === user._id || updatedOrder.deliveryPartnerId === user._id) {
          fetchTasks();
          fetchProfile();
        }
      });

      // Poll as fallback every 5 seconds
      const interval = setInterval(fetchTasks, 5000);

      return () => {
        socket.disconnect();
        clearInterval(interval);
      };
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Delivered',
      value: profile?.totalDelivered ?? profile?.totalDeliveries ?? 0,
      icon: HiOutlineCheckCircle,
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Total Earnings',
      value: `₹${(profile?.earnings || 0).toLocaleString('en-IN')}`,
      icon: HiOutlineCurrencyRupee,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Rating',
      value: profile?.rating ? `★ ${profile.rating.toFixed(1)}` : '★ 0.0',
      icon: HiOutlineStar,
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
    {
      label: 'Active Orders',
      value: tasks.length,
      icon: HiOutlineTruck,
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Delivery Dashboard</h1>
          <p className="text-sm text-surface-700/60">Welcome back, {user?.name || 'Partner'}! Manage your deliveries here.</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-200 px-4 py-2 rounded-xl flex items-center gap-2 self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-orange-950">Active & Ready for Duty</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-surface-200/60 p-4 hover:shadow-lg hover:shadow-surface-200/50 transition-all duration-300 group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`${card.text}`} size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-900">{card.value}</p>
            <p className="text-xs text-surface-700/50 mt-0.5 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'active'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          🚴 Active Tasks ({tasks.length})
        </button>
        <button
          onClick={() => { setActiveTab('history'); fetchDeliveredOrders(); }}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          ✅ Delivered ({profile?.totalDelivered ?? 0})
        </button>
      </div>

      {/* Active Tasks Tab */}
      {activeTab === 'active' && (
        <>
          {tasks.length === 0 ? (
            <div className="bg-white border border-surface-200/60 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="text-4xl">🚴</div>
              <h3 className="text-base font-bold text-surface-900">No Active Orders</h3>
              <p className="text-sm text-surface-700/60">
                You don't have any active deliveries assigned right now. When a customer in your city orders food, you'll be assigned automatically!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {tasks.map((task) => (
                <div key={task._id} className="bg-white border border-surface-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row">
                  {/* Left Column: Order Summary */}
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-surface-100 lg:w-1/3 bg-surface-50/40">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                        {task.orderNumber}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                        task.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                        task.status === 'picked' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">Items Ordered</span>
                        <ul className="text-xs text-surface-800 space-y-1 mt-1">
                          {task.items.map((it, idx) => (
                            <li key={idx} className="flex justify-between font-medium">
                              <span>{it.name} x {it.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-surface-100 pt-3 flex justify-between items-center">
                        <span className="text-xs text-surface-500 font-medium">Total Amount</span>
                        <span className="text-sm font-black text-surface-900">₹{task.totalAmount}</span>
                      </div>

                      <div className="bg-surface-100/70 p-3 rounded-xl border border-surface-200/40 text-xs space-y-1">
                        <div className="font-bold text-surface-800 uppercase text-[9px] tracking-wider">Payment Details</div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Method:</span>
                          <span className="font-semibold uppercase">{task.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Collect Cash:</span>
                          <span className="font-black text-orange-600">
                            {task.paymentMethod === 'cod' ? `₹${task.totalAmount}` : '₹0 (Paid Online)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Address Map & Actions */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pickup Section */}
                      <div className="space-y-3.5 relative pl-4 border-l-2 border-orange-400">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            STEP 1: Pick Up
                          </span>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-bold text-surface-900">{task.homeCookId?.name}</h4>
                          <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                            <HiOutlinePhone size={13} /> {task.homeCookId?.phone}
                          </p>
                        </div>
                        <div className="text-xs text-surface-600 bg-surface-50 p-3 rounded-xl border border-surface-100 flex gap-2">
                          <HiOutlineLocationMarker className="text-orange-500 shrink-0 mt-0.5" size={16} />
                          <div className="text-left font-medium leading-relaxed">
                            <p>{task.homeCookId?.address?.street || 'Not provided'}</p>
                            <p>{task.homeCookId?.address?.city}, {task.homeCookId?.address?.state} - {task.homeCookId?.address?.pincode}</p>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Section */}
                      <div className="space-y-3.5 relative pl-4 border-l-2 border-emerald-500">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            STEP 2: Deliver
                          </span>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-bold text-surface-900">{task.customerId?.name}</h4>
                          <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                            <HiOutlinePhone size={13} /> {task.customerId?.phone}
                          </p>
                        </div>
                        <div className="text-xs text-surface-600 bg-surface-50 p-3 rounded-xl border border-surface-100 flex gap-2">
                          <HiOutlineLocationMarker className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                          <div className="text-left font-medium leading-relaxed">
                            <p>{task.deliveryAddress?.street}</p>
                            <p>{task.deliveryAddress?.city}, {task.deliveryAddress?.state} - {task.deliveryAddress?.pincode}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Block */}
                    <div className="border-t border-surface-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {task.status === 'placed' || task.status === 'preparing' ? (
                        <div className="flex items-center gap-2.5 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200/50 w-full justify-center sm:justify-start text-xs font-semibold">
                          <HiOutlineClock size={18} className="animate-spin" />
                          <span>Food is currently being prepared by the Kitchen. Wait for status: "Ready".</span>
                        </div>
                      ) : task.status === 'ready' ? (
                        <button
                          onClick={() => updateStatus(task._id, 'picked')}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          🚴 Mark as Picked Up
                        </button>
                      ) : task.status === 'picked' ? (
                        <button
                          onClick={() => updateStatus(task._id, 'delivered')}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <HiOutlineCheckCircle size={18} />
                          🏁 Mark as Delivered
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delivered History Tab */}
      {activeTab === 'history' && (
        <>
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deliveredOrders.length === 0 ? (
            <div className="bg-white border border-surface-200/60 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="text-4xl">📦</div>
              <h3 className="text-base font-bold text-surface-900">No Delivery History</h3>
              <p className="text-sm text-surface-700/60">
                You haven't completed any deliveries yet. Complete your first delivery to see it here!
              </p>
            </div>
          ) : (
            <div className="bg-white border border-surface-200/60 rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200/60 text-left text-xs font-bold text-surface-700 uppercase tracking-wider">
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Kitchen</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200/50 text-sm text-surface-800">
                  {deliveredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-surface-50/40 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-bold text-emerald-600">{order.orderNumber}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold">{order.customerId?.name || 'N/A'}</div>
                        <div className="text-xs text-surface-500">{order.customerId?.phone}</div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <div className="font-semibold">{order.homeCookId?.name || 'N/A'}</div>
                        <div className="text-xs text-surface-500">{order.homeCookId?.address?.city}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs space-y-0.5">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="font-medium">{it.name} x{it.quantity}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-bold text-surface-900">₹{order.totalAmount}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-xs text-surface-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeliveryDashboardPage;
