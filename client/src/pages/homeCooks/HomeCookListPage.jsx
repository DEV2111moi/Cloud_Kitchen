import { useState, useEffect } from 'react';
import {
  HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlineEye,
  HiOutlineCheck, HiOutlineX, HiOutlineBan, HiOutlinePlus,
} from 'react-icons/hi';
import { getHomeCooks, updateHomeCookStatus, deleteHomeCook, createHomeCook, updateHomeCook } from '../../api/homeCookApi';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CookForm = ({ onSubmit, submitLabel, formData, setFormData, showCreateModal, showEditModal, setShowCreateModal, setShowEditModal }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1">Phone *</label>
        <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1">Speciality (comma separated)</label>
        <input type="text" value={formData.speciality} onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
          placeholder="North Indian, Mughlai"
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1">FSSAI Certificate Status</label>
        <select value={formData.hasFssai} onChange={(e) => setFormData({ ...formData, hasFssai: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white">
          <option value="no">No FSSAI Certificate</option>
          <option value="yes">Yes, FSSAI Certified</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1">
          Assign Password {showEditModal ? '(Leave blank to keep unchanged)' : '*'}
        </label>
        <input type="password" required={showCreateModal} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Min 6 characters"
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1">Bio</label>
      <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3}
        className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
    </div>
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
        className="px-4 py-2 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
      <button type="submit"
        className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">{submitLabel}</button>
    </div>
  </form>
);

const HomeCookListPage = () => {
  const [homeCooks, setHomeCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedCook, setSelectedCook] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', speciality: '', bio: '', status: 'pending', hasFssai: 'no', password: '' });

  const fetchHomeCooks = async () => {
    setLoading(true);
    try {
      const { data } = await getHomeCooks({ page, limit: 10, status: statusFilter, search });
      setHomeCooks(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch home cooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHomeCooks(); }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchHomeCooks(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateHomeCookStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchHomeCooks();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHomeCook(id);
      toast.success('Home cook deleted');
      fetchHomeCooks();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createHomeCook({
        ...formData,
        speciality: formData.speciality.split(',').map(s => s.trim()).filter(Boolean),
      });
      toast.success('Home cook created');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', phone: '', speciality: '', bio: '', status: 'pending', hasFssai: 'no', password: '' });
      fetchHomeCooks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateHomeCook(selectedCook._id, {
        ...formData,
        speciality: typeof formData.speciality === 'string'
          ? formData.speciality.split(',').map(s => s.trim()).filter(Boolean)
          : formData.speciality,
      });
      toast.success('Home cook updated');
      setShowEditModal(false);
      fetchHomeCooks();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const openEdit = (cook) => {
    setSelectedCook(cook);
    setFormData({
      name: cook.name,
      email: cook.email,
      phone: cook.phone,
      speciality: Array.isArray(cook.speciality) ? cook.speciality.join(', ') : cook.speciality,
      bio: cook.bio || '',
      status: cook.status,
      hasFssai: cook.hasFssai || 'no',
      password: '',
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-surface-700/50">{pagination.total} total home cooks</p>
        </div>
        <button onClick={() => { setFormData({ name: '', email: '', phone: '', speciality: '', bio: '', status: 'pending', hasFssai: 'no', password: '' }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25">
          <HiOutlinePlus size={18} />
          Add Home Cook
        </button>
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading home cooks..." />
      ) : (
        <div className="bg-white rounded-xl border border-surface-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Cook</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden md:table-cell">Speciality</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden lg:table-cell">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden lg:table-cell">Revenue</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden sm:table-cell">Rating</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {homeCooks.map((cook) => (
                  <tr key={cook._id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {getInitials(cook.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">{cook.name}</p>
                          <p className="text-xs text-surface-700/50 truncate">{cook.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(cook.speciality || []).slice(0, 2).map((s) => (
                          <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-amber-50 text-amber-700 font-medium">{s}</span>
                        ))}
                        {(cook.speciality || []).length > 2 && (
                          <span className="px-2 py-0.5 text-xs rounded-md bg-surface-100 text-surface-700">+{cook.speciality.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={cook.status} /></td>
                    <td className="px-5 py-3 text-sm text-surface-700 hidden lg:table-cell">{cook.totalOrders}</td>
                    <td className="px-5 py-3 text-sm font-medium text-surface-800 hidden lg:table-cell">{formatCurrency(cook.revenue || 0)}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-sm text-amber-500 font-medium">★ {cook.rating?.toFixed(1) || '0.0'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedCook(cook); setShowViewModal(true); }}
                          className="p-1.5 rounded-lg text-surface-700/60 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="View">
                          <HiOutlineEye size={16} />
                        </button>
                        <button onClick={() => openEdit(cook)}
                          className="p-1.5 rounded-lg text-surface-700/60 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <HiOutlinePencil size={16} />
                        </button>
                        {cook.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusChange(cook._id, 'approved')}
                              className="p-1.5 rounded-lg text-surface-700/60 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Approve">
                              <HiOutlineCheck size={16} />
                            </button>
                            <button onClick={() => handleStatusChange(cook._id, 'rejected')}
                              className="p-1.5 rounded-lg text-surface-700/60 hover:text-red-600 hover:bg-red-50 transition-colors" title="Reject">
                              <HiOutlineX size={16} />
                            </button>
                          </>
                        )}
                        {cook.status === 'approved' && (
                          <button onClick={() => handleStatusChange(cook._id, 'suspended')}
                            className="p-1.5 rounded-lg text-surface-700/60 hover:text-orange-600 hover:bg-orange-50 transition-colors" title="Suspend">
                            <HiOutlineBan size={16} />
                          </button>
                        )}
                        {cook.status === 'suspended' && (
                          <button onClick={() => handleStatusChange(cook._id, 'approved')}
                            className="p-1.5 rounded-lg text-surface-700/60 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Activate">
                            <HiOutlineCheck size={16} />
                          </button>
                        )}
                        <button onClick={() => setConfirmDialog({
                          open: true, title: 'Delete Home Cook', message: `Are you sure you want to delete "${cook.name}"? This action cannot be undone.`,
                          onConfirm: () => handleDelete(cook._id), danger: true,
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
          {homeCooks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-surface-700/50 text-sm">No home cooks found</p>
            </div>
          )}
          <div className="px-5 border-t border-surface-100">
            <Pagination currentPage={page} totalPages={pagination.pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Home Cook Details" size="lg">
        {selectedCook && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl font-bold text-white">
                {getInitials(selectedCook.name)}
              </div>
              <div>
                <h4 className="text-xl font-bold text-surface-900">{selectedCook.name}</h4>
                <p className="text-sm text-surface-700/60">{selectedCook.email}</p>
                <StatusBadge status={selectedCook.status} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Phone</p>
                <p className="text-sm font-medium">{selectedCook.phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">FSSAI Status</p>
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${
                  selectedCook.hasFssai === 'yes'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                    : 'bg-amber-50 text-amber-700 border border-amber-250'
                }`}>
                  {selectedCook.hasFssai === 'yes' ? 'Yes, Certified' : 'No FSSAI'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Rating</p>
                <p className="text-sm font-medium">★ {selectedCook.rating?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Total Orders</p>
                <p className="text-sm font-medium">{selectedCook.totalOrders}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Revenue</p>
                <p className="text-sm font-medium">{formatCurrency(selectedCook.revenue || 0)}</p>
              </div>
            </div>
            {selectedCook.speciality?.length > 0 && (
              <div>
                <p className="text-xs text-surface-700/50 mb-2">Specialities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCook.speciality.map(s => (
                    <span key={s} className="px-3 py-1 text-sm rounded-lg bg-amber-50 text-amber-700 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedCook.bio && (
              <div>
                <p className="text-xs text-surface-700/50 mb-1">Bio</p>
                <p className="text-sm text-surface-700">{selectedCook.bio}</p>
              </div>
            )}
            {selectedCook.address && (
              <div>
                <p className="text-xs text-surface-700/50 mb-1">Address</p>
                <p className="text-sm text-surface-700">
                  {[selectedCook.address.street, selectedCook.address.city, selectedCook.address.state, selectedCook.address.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
            <p className="text-xs text-surface-700/40">Joined: {formatDate(selectedCook.createdAt)}</p>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Home Cook" size="lg">
        <CookForm
          onSubmit={handleCreate}
          submitLabel="Create Home Cook"
          formData={formData}
          setFormData={setFormData}
          showCreateModal={showCreateModal}
          showEditModal={showEditModal}
          setShowCreateModal={setShowCreateModal}
          setShowEditModal={setShowEditModal}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Home Cook" size="lg">
        <CookForm
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          formData={formData}
          setFormData={setFormData}
          showCreateModal={showCreateModal}
          showEditModal={showEditModal}
          setShowCreateModal={setShowCreateModal}
          setShowEditModal={setShowEditModal}
        />
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} />
    </div>
  );
};

export default HomeCookListPage;
