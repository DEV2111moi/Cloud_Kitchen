import { useState, useEffect } from 'react';
import {
  HiOutlineSearch, HiOutlineClock, HiOutlineTruck,
  HiOutlineLocationMarker, HiOutlineClipboardList, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineUser, HiOutlinePhone, HiOutlineEye
} from 'react-icons/hi';
import { getOrders, assignDeliveryPartner, updateOrderStatus } from '../../api/orderApi';
import { getDeliveryPartners } from '../../api/deliveryPartnerApi';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Assignment Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // View Details Modal State
  const [viewOrder, setViewOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getOrders({
        page,
        limit: 10,
        status: statusFilter,
        city: cityFilter,
        search
      });
      setOrders(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, cityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openAssignModal = async (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
    setPartnersLoading(true);
    try {
      // Fetch approved delivery partners in the cook's city
      const cookCity = order.homeCookId?.address?.city || '';
      const { data } = await getDeliveryPartners({
        status: 'approved',
        available: 'true',
        limit: 100
      });
      
      // Filter partners in the same city (case-insensitive)
      const filtered = data.data.filter(p => 
        p.city.toLowerCase() === cookCity.toLowerCase()
      );
      setPartners(filtered);
    } catch (error) {
      toast.error('Failed to load delivery partners');
    } finally {
      setPartnersLoading(false);
    }
  };

  const handleAssignPartner = async (partnerId) => {
    try {
      const { data } = await assignDeliveryPartner(selectedOrder._id, partnerId);
      if (data.success) {
        toast.success(partnerId ? 'Delivery partner assigned!' : 'Delivery partner unassigned!');
        setShowAssignModal(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign delivery partner');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await updateOrderStatus(orderId, newStatus);
      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
        if (viewOrder && viewOrder._id === orderId) {
          setViewOrder(data.data);
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Order Management</h1>
          <p className="text-sm text-surface-700/60">Monitor and manage all active customer orders, assignments, and deliveries.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-surface-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input
            type="text"
            placeholder="Search by Order ID (e.g. CK-000001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-surface-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
          >
            <option value="all">All Cities</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Trichy">Trichy</option>
            <option value="Theni">Theni</option>
            <option value="Chennai">Chennai</option>
            <option value="Salem">Salem</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready for Pickup</option>
            <option value="picked">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Grid/Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" text="Loading orders..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-surface-200/60 rounded-xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-base font-bold text-surface-900">No Orders Found</h3>
          <p className="text-sm text-surface-700/60">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="bg-white border border-surface-200/60 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200/60 text-left text-xs font-bold text-surface-700 uppercase tracking-wider">
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Kitchen (Home Cook)</th>
                <th className="px-6 py-4">Delivery Partner</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50 text-sm text-surface-800">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-surface-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-primary-600 block">{order.orderNumber}</span>
                    <span className="text-xs text-surface-500">{formatDate(order.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{order.customerId?.name || 'N/A'}</div>
                    <div className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                      <HiOutlinePhone size={12} /> {order.customerId?.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{order.homeCookId?.name || 'N/A'}</div>
                    <div className="text-xs text-surface-500 flex items-center gap-0.5 mt-0.5">
                      <HiOutlineLocationMarker size={12} className="text-red-500 shrink-0" />
                      <span>{order.homeCookId?.address?.city || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {order.deliveryPartnerId ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-surface-850">{order.deliveryPartnerId.name}</span>
                        <span className="text-xs text-surface-500 capitalize">{order.deliveryPartnerId.vehicleType}</span>
                        <button
                          onClick={() => openAssignModal(order)}
                          className="text-[11px] text-primary-600 hover:text-primary-700 font-bold self-start mt-1 underline"
                        >
                          Change Partner
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Unassigned</span>
                        <button
                          onClick={() => openAssignModal(order)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-bold underline mt-0.5"
                        >
                          Assign Partner
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-surface-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setViewOrder(order); setShowViewModal(true); }}
                        className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-700 hover:text-primary-600 transition-colors"
                        title="View Details"
                      >
                        <HiOutlineEye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Manual Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Partner to ${selectedOrder?.orderNumber}`}
      >
        <div className="space-y-4 text-left">
          <div className="bg-surface-50 p-3 rounded-lg border border-surface-150 text-xs text-surface-700">
            <p><strong>Pickup Kitchen:</strong> {selectedOrder?.homeCookId?.name}</p>
            <p className="mt-0.5"><strong>City:</strong> {selectedOrder?.homeCookId?.address?.city}</p>
          </div>

          <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">Available Partners in {selectedOrder?.homeCookId?.address?.city}</h3>
          
          {partnersLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : partners.length === 0 ? (
            <p className="text-xs text-surface-500 py-4 text-center">No available delivery partners found in this city.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {partners.map(p => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors">
                  <div>
                    <p className="font-semibold text-xs text-surface-850">{p.name}</p>
                    <p className="text-[10px] text-surface-500">{p.phone} | {p.vehicleType.toUpperCase()} ({p.vehicleNumber})</p>
                  </div>
                  <button
                    onClick={() => handleAssignPartner(p._id)}
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-bold transition-all"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedOrder?.deliveryPartnerId && (
            <div className="border-t border-surface-100 pt-3 flex justify-between">
              <button
                onClick={() => handleAssignPartner(null)}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-bold transition-all"
              >
                Unassign Current Partner
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 border border-surface-200 text-surface-700 hover:bg-surface-50 rounded text-xs font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* View Details & Manual Status Overrides Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Order Details: ${viewOrder?.orderNumber}`}
      >
        {viewOrder && (
          <div className="space-y-5 text-left text-xs text-surface-800">
            {/* Split Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-surface-900 uppercase text-[10px] tracking-wider mb-1">Customer</h4>
                <p className="font-semibold text-sm text-surface-850">{viewOrder.customerId?.name || 'N/A'}</p>
                <p className="text-surface-500 mt-0.5">{viewOrder.customerId?.phone}</p>
                <p className="text-surface-500">{viewOrder.customerId?.email}</p>
              </div>
              <div>
                <h4 className="font-bold text-surface-900 uppercase text-[10px] tracking-wider mb-1">Home Cook</h4>
                <p className="font-semibold text-sm text-surface-850">{viewOrder.homeCookId?.name || 'N/A'}</p>
                <p className="text-surface-500 mt-0.5">{viewOrder.homeCookId?.phone}</p>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-surface-100 pt-3">
              <div>
                <h4 className="font-bold text-surface-900 uppercase text-[10px] tracking-wider mb-1">Pickup Address</h4>
                <p className="text-surface-600 leading-relaxed">
                  {viewOrder.homeCookId?.address?.street}<br />
                  {viewOrder.homeCookId?.address?.city}, {viewOrder.homeCookId?.address?.state} - {viewOrder.homeCookId?.address?.pincode}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-surface-900 uppercase text-[10px] tracking-wider mb-1">Delivery Destination</h4>
                <p className="text-surface-600 leading-relaxed">
                  {viewOrder.deliveryAddress?.street}<br />
                  {viewOrder.deliveryAddress?.city}, {viewOrder.deliveryAddress?.state} - {viewOrder.deliveryAddress?.pincode}
                </p>
              </div>
            </div>

            {/* Itemized summary */}
            <div className="border-t border-surface-100 pt-3">
              <h4 className="font-bold text-surface-900 uppercase text-[10px] tracking-wider mb-2">Items List</h4>
              <div className="space-y-1.5">
                {viewOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between font-medium">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-surface-100 pt-2 flex justify-between font-black text-sm text-surface-900">
                  <span>Total Amount</span>
                  <span>{formatCurrency(viewOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Status updates override */}
            <div className="border-t border-surface-100 pt-3 space-y-2">
              <h4 className="font-bold text-surface-900 uppercase text-[10px] tracking-wider">Status Override (Admin Actions)</h4>
              <div className="flex flex-wrap gap-2">
                {['placed', 'preparing', 'ready', 'picked', 'delivered', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(viewOrder._id, st)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase border transition-all ${
                      viewOrder.status === st
                        ? 'bg-primary-600 text-white border-primary-600 shadow'
                        : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-surface-100 pt-3 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-surface-200 rounded-lg font-bold text-surface-700 hover:bg-surface-50"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderListPage;
