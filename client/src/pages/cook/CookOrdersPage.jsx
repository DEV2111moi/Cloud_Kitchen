import { useState, useEffect, useRef } from 'react';
import { getCookOrders, updateOrderStatus } from '../../api/cookApi';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineTruck, HiOutlineInbox as HiOutlineInboxGray } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';

const CookOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const socketRef = useRef(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getCookOrders({ status: statusFilter });
      setOrders(data.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Socket notification
  useEffect(() => {
    if (!user?._id) return;
    const socketHost = window.location.origin.includes('5173')
      ? 'http://localhost:5000'
      : window.location.origin;

    socketRef.current = io(socketHost);

    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to cook socket');
      socketRef.current.emit('join', user._id);
    });

    socketRef.current.on('newOrder', (newOrder) => {
      console.log('🔔 New incoming order:', newOrder);
      toast.success(`New order received: ${newOrder.orderNumber}!`, {
        icon: '🔔',
        duration: 5000
      });
      // Soft ping sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
        audio.volume = 0.5;
        audio.play();
      } catch (err) {
        console.error('Audio play failed:', err);
      }
      // Reload order list
      fetchOrders();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900">Kitchen Orders</h1>
          <p className="text-xs text-surface-700/50">Manage your active orders and update their preparation stages.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        >
          <option value="all">All Orders</option>
          <option value="placed">New Placed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready for Pickup</option>
          <option value="picked">Picked Up</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching kitchen tickets..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-surface-200/60 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <div>
                  <h3 className="font-bold text-surface-900 text-sm">{order.orderNumber}</h3>
                  <p className="text-[10px] text-surface-700/50">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-surface-950 text-sm">{formatCurrency(order.totalAmount)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-surface-700/50 uppercase tracking-wider">Items Ordered</p>
                <div className="bg-surface-50 rounded-xl p-3 space-y-1.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs font-semibold text-surface-850">
                      <span>{item.name} <span className="text-surface-700/50">x {item.quantity}</span></span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer and Delivery details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-surface-100 pt-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-surface-700/50 uppercase tracking-wider flex items-center gap-1">
                    <HiOutlineUser /> Customer Details
                  </span>
                  <p className="font-bold text-surface-800">{order.customerId?.name || 'Customer'}</p>
                  <p className="text-surface-700/50">{order.customerId?.phone || 'No phone'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-surface-700/50 uppercase tracking-wider flex items-center gap-1">
                    <HiOutlineTruck /> Delivery Partner
                  </span>
                  {order.deliveryPartnerId ? (
                    <>
                      <p className="font-bold text-surface-800">{order.deliveryPartnerId.name}</p>
                      <p className="text-surface-700/50 capitalize">{order.deliveryPartnerId.vehicleType} • {order.deliveryPartnerId.phone}</p>
                    </>
                  ) : (
                    <p className="text-surface-700/40 italic">Waiting for assignment</p>
                  )}
                </div>
              </div>

              {/* Order Status Controller Action Bar */}
              <div className="border-t border-surface-100 pt-4 flex flex-wrap gap-2 justify-end">
                {order.status === 'placed' && (
                  <button
                    onClick={() => handleStatusChange(order._id, 'preparing')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/10"
                  >
                    Start Cooking (Prepare)
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleStatusChange(order._id, 'ready')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/10"
                  >
                    Mark Ready for Pickup
                  </button>
                )}
                {['placed', 'preparing'].includes(order.status) && (
                  <button
                    onClick={() => handleStatusChange(order._id, 'cancelled')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-surface-200/60 flex flex-col items-center justify-center space-y-2">
              <HiOutlineInboxGray size={32} className="text-surface-700/30" />
              <p className="text-surface-700/50 text-sm font-semibold">No kitchen tickets found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CookOrdersPage;
