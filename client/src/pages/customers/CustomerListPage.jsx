import { useState, useEffect } from 'react';
import {
  HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlineEye,
  HiOutlineBan, HiOutlineCheck, HiOutlineShoppingCart,
} from 'react-icons/hi';
import { getCustomers, getCustomer, updateCustomerStatus, deleteCustomer, updateCustomer } from '../../api/customerApi';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime, getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CustomerListPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await getCustomers({ page, limit: 10, status: statusFilter, search });
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchCustomers(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const viewCustomer = async (id) => {
    setLoadingDetail(true);
    setShowViewModal(true);
    try {
      const { data } = await getCustomer(id);
      setSelectedCustomer(data.data);
      setCustomerOrders(data.data.orders || []);
    } catch (error) {
      toast.error('Failed to load customer details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await updateCustomerStatus(id, newStatus);
      toast.success(`Customer ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}`);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(selectedCustomer._id, formData);
      toast.success('Customer updated');
      setShowEditModal(false);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const openEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ name: customer.name, email: customer.email, phone: customer.phone || '' });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-surface-700/50">{pagination.total} total customers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading customers..." />
      ) : (
        <div className="bg-white rounded-xl border border-surface-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden lg:table-cell">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden lg:table-cell">Total Spent</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden sm:table-cell">Last Order</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {getInitials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">{customer.name}</p>
                          <p className="text-xs text-surface-700/50 truncate">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-surface-700 hidden md:table-cell">{customer.phone || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={customer.status} /></td>
                    <td className="px-5 py-3 text-sm text-surface-700 hidden lg:table-cell">{customer.totalOrders}</td>
                    <td className="px-5 py-3 text-sm font-medium text-surface-800 hidden lg:table-cell">{formatCurrency(customer.totalSpent || 0)}</td>
                    <td className="px-5 py-3 text-sm text-surface-700/60 hidden sm:table-cell">
                      {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewCustomer(customer._id)}
                          className="p-1.5 rounded-lg text-surface-700/60 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="View">
                          <HiOutlineEye size={16} />
                        </button>
                        <button onClick={() => openEdit(customer)}
                          className="p-1.5 rounded-lg text-surface-700/60 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <HiOutlinePencil size={16} />
                        </button>
                        <button onClick={() => handleStatusToggle(customer._id, customer.status)}
                          className={`p-1.5 rounded-lg transition-colors ${customer.status === 'active'
                            ? 'text-surface-700/60 hover:text-orange-600 hover:bg-orange-50' : 'text-surface-700/60 hover:text-emerald-600 hover:bg-emerald-50'
                          }`} title={customer.status === 'active' ? 'Block' : 'Unblock'}>
                          {customer.status === 'active' ? <HiOutlineBan size={16} /> : <HiOutlineCheck size={16} />}
                        </button>
                        <button onClick={() => setConfirmDialog({
                          open: true, title: 'Delete Customer', message: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
                          onConfirm: () => handleDelete(customer._id), danger: true,
                        })}
                          className="p-1.5 rounded-lg text-surface-700/60 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                          <HiOutlineTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {customers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-surface-700/50 text-sm">No customers found</p>
            </div>
          )}
          <div className="px-5 border-t border-surface-100">
            <Pagination currentPage={page} totalPages={pagination.pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* View Modal with Order History */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Customer Details" size="xl">
        {loadingDetail ? (
          <LoadingSpinner text="Loading details..." />
        ) : selectedCustomer && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-xl font-bold text-white">
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <h4 className="text-xl font-bold text-surface-900">{selectedCustomer.name}</h4>
                <p className="text-sm text-surface-700/60">{selectedCustomer.email}</p>
                <StatusBadge status={selectedCustomer.status} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Phone</p>
                <p className="text-sm font-medium">{selectedCustomer.phone || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Total Orders</p>
                <p className="text-sm font-medium">{selectedCustomer.totalOrders}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Total Spent</p>
                <p className="text-sm font-medium">{formatCurrency(selectedCustomer.totalSpent || 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Joined</p>
                <p className="text-sm font-medium">{formatDate(selectedCustomer.createdAt)}</p>
              </div>
            </div>

            {/* Addresses */}
            {selectedCustomer.addresses?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-surface-800 mb-2">Saved Addresses</p>
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr, i) => (
                    <div key={i} className="p-3 rounded-lg bg-surface-50 text-sm">
                      <span className="font-medium text-primary-600">{addr.label}:</span>{' '}
                      {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History */}
            <div>
              <p className="text-sm font-semibold text-surface-800 mb-2 flex items-center gap-2">
                <HiOutlineShoppingCart size={16} />
                Order History ({customerOrders.length})
              </p>
              {customerOrders.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customerOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-surface-800">{order.orderNumber}</p>
                        <p className="text-xs text-surface-700/50">
                          {order.homeCookId?.name || 'Unknown'} • {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-surface-900">{formatCurrency(order.totalAmount)}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-700/50 text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">Save Changes</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} />
    </div>
  );
};

export default CustomerListPage;
