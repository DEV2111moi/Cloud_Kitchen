import { useState, useEffect } from 'react';
import {
  HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlineEye,
  HiOutlineCheck, HiOutlineX, HiOutlineBan, HiOutlinePlus,
  HiOutlineShieldCheck, HiOutlineLocationMarker,
} from 'react-icons/hi';
import {
  getDeliveryPartners, updateDeliveryPartnerStatus, deleteDeliveryPartner,
  createDeliveryPartner, updateDeliveryPartner, verifyDocuments,
} from '../../api/deliveryPartnerApi';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PartnerForm = ({ onSubmit, submitLabel, formData, setFormData, setShowCreateModal, setShowEditModal }) => (
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
        <label className="block text-sm font-medium text-surface-700 mb-1">Vehicle Type</label>
        <select value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white">
          <option value="bike">Bike</option>
          <option value="scooter">Scooter</option>
          <option value="car">Car</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-surface-700 mb-1">Vehicle Number</label>
        <input type="text" value={formData.vehicleNumber} onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
          placeholder="e.g., MH-02-AB-1234"
          className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
    </div>
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
        className="px-4 py-2 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
      <button type="submit"
        className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">{submitLabel}</button>
    </div>
  </form>
);

const DeliveryPartnerListPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', vehicleType: 'bike', vehicleNumber: '' });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data } = await getDeliveryPartners({ page, limit: 10, status: statusFilter, search });
      setPartners(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchPartners(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateDeliveryPartnerStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchPartners();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleVerify = async (id) => {
    try {
      await verifyDocuments(id);
      toast.success('Documents verified successfully');
      fetchPartners();
    } catch (error) {
      toast.error('Failed to verify documents');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeliveryPartner(id);
      toast.success('Delivery partner deleted');
      fetchPartners();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDeliveryPartner(formData);
      toast.success('Delivery partner created');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', phone: '', vehicleType: 'bike', vehicleNumber: '' });
      fetchPartners();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDeliveryPartner(selectedPartner._id, formData);
      toast.success('Delivery partner updated');
      setShowEditModal(false);
      fetchPartners();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const openEdit = (partner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      vehicleType: partner.vehicleType,
      vehicleNumber: partner.vehicleNumber || '',
    });
    setShowEditModal(true);
  };

  const vehicleIcons = { bike: '🏍️', scooter: '🛵', car: '🚗' };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-surface-700/50">{pagination.total} total delivery partners</p>
        </div>
        <button onClick={() => { setFormData({ name: '', email: '', phone: '', vehicleType: 'bike', vehicleNumber: '' }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25">
          <HiOutlinePlus size={18} />
          Add Delivery Partner
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
        <LoadingSpinner text="Loading delivery partners..." />
      ) : (
        <div className="bg-white rounded-xl border border-surface-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Partner</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden md:table-cell">Vehicle</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden lg:table-cell">Availability</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden lg:table-cell">Deliveries</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden sm:table-cell">Docs</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider hidden sm:table-cell">Rating</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-surface-700/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {partners.map((partner) => (
                  <tr key={partner._id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {getInitials(partner.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">{partner.name}</p>
                          <p className="text-xs text-surface-700/50 truncate">{partner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{vehicleIcons[partner.vehicleType]}</span>
                        <div>
                          <p className="text-sm capitalize font-medium text-surface-800">{partner.vehicleType}</p>
                          <p className="text-xs text-surface-700/50">{partner.vehicleNumber || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={partner.status} /></td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${partner.isAvailable ? 'text-emerald-600' : 'text-surface-700/50'}`}>
                        <span className={`w-2 h-2 rounded-full ${partner.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-surface-200'}`} />
                        {partner.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-surface-700 hidden lg:table-cell">{partner.totalDeliveries}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {partner.documents?.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <HiOutlineShieldCheck size={14} /> Verified
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-sm text-amber-500 font-medium">★ {partner.rating?.toFixed(1) || '0.0'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedPartner(partner); setShowViewModal(true); }}
                          className="p-1.5 rounded-lg text-surface-700/60 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="View">
                          <HiOutlineEye size={16} />
                        </button>
                        <button onClick={() => openEdit(partner)}
                          className="p-1.5 rounded-lg text-surface-700/60 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <HiOutlinePencil size={16} />
                        </button>
                        {!partner.documents?.verified && partner.status === 'approved' && (
                          <button onClick={() => handleVerify(partner._id)}
                            className="p-1.5 rounded-lg text-surface-700/60 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Verify Docs">
                            <HiOutlineShieldCheck size={16} />
                          </button>
                        )}
                        {partner.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusChange(partner._id, 'approved')}
                              className="p-1.5 rounded-lg text-surface-700/60 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Approve">
                              <HiOutlineCheck size={16} />
                            </button>
                            <button onClick={() => handleStatusChange(partner._id, 'rejected')}
                              className="p-1.5 rounded-lg text-surface-700/60 hover:text-red-600 hover:bg-red-50 transition-colors" title="Reject">
                              <HiOutlineX size={16} />
                            </button>
                          </>
                        )}
                        {partner.status === 'approved' && (
                          <button onClick={() => handleStatusChange(partner._id, 'suspended')}
                            className="p-1.5 rounded-lg text-surface-700/60 hover:text-orange-600 hover:bg-orange-50 transition-colors" title="Suspend">
                            <HiOutlineBan size={16} />
                          </button>
                        )}
                        {partner.status === 'suspended' && (
                          <button onClick={() => handleStatusChange(partner._id, 'approved')}
                            className="p-1.5 rounded-lg text-surface-700/60 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Activate">
                            <HiOutlineCheck size={16} />
                          </button>
                        )}
                        <button onClick={() => setConfirmDialog({
                          open: true, title: 'Delete Delivery Partner', message: `Are you sure you want to delete "${partner.name}"? This action cannot be undone.`,
                          onConfirm: () => handleDelete(partner._id), danger: true,
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
          {partners.length === 0 && (
            <div className="text-center py-12">
              <p className="text-surface-700/50 text-sm">No delivery partners found</p>
            </div>
          )}
          <div className="px-5 border-t border-surface-100">
            <Pagination currentPage={page} totalPages={pagination.pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Delivery Partner Details" size="lg">
        {selectedPartner && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                {getInitials(selectedPartner.name)}
              </div>
              <div>
                <h4 className="text-xl font-bold text-surface-900">{selectedPartner.name}</h4>
                <p className="text-sm text-surface-700/60">{selectedPartner.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedPartner.status} />
                  {selectedPartner.documents?.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-emerald-600/20">
                      <HiOutlineShieldCheck size={12} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Phone</p>
                <p className="text-sm font-medium">{selectedPartner.phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Vehicle</p>
                <p className="text-sm font-medium capitalize">
                  {vehicleIcons[selectedPartner.vehicleType]} {selectedPartner.vehicleType}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Vehicle No.</p>
                <p className="text-sm font-medium">{selectedPartner.vehicleNumber || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Total Deliveries</p>
                <p className="text-sm font-medium">{selectedPartner.totalDeliveries}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Earnings</p>
                <p className="text-sm font-medium">{formatCurrency(selectedPartner.earnings || 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-700/50 mb-1">Rating</p>
                <p className="text-sm font-medium">★ {selectedPartner.rating?.toFixed(1) || '0.0'}</p>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-50">
              <HiOutlineLocationMarker size={18} className={selectedPartner.isAvailable ? 'text-emerald-500' : 'text-surface-700/40'} />
              <div>
                <p className="text-sm font-medium text-surface-800">
                  {selectedPartner.isAvailable ? 'Currently Available' : 'Currently Busy'}
                </p>
                <p className="text-xs text-surface-700/50">
                  {selectedPartner.currentOrderId ? 'Assigned to an active order' : 'No active assignment'}
                </p>
              </div>
            </div>

            {/* Documents */}
            <div>
              <p className="text-sm font-semibold text-surface-800 mb-2">Documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Driving License', value: selectedPartner.documents?.drivingLicense },
                  { label: 'ID Proof', value: selectedPartner.documents?.idProof },
                  { label: 'Vehicle RC', value: selectedPartner.documents?.vehicleRC },
                ].map((doc) => (
                  <div key={doc.label} className="p-3 rounded-lg bg-surface-50">
                    <p className="text-xs text-surface-700/50 mb-1">{doc.label}</p>
                    <p className="text-sm font-medium text-surface-700">{doc.value || 'Not uploaded'}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-surface-700/40">Joined: {formatDate(selectedPartner.createdAt)}</p>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Delivery Partner" size="lg">
        <PartnerForm
          onSubmit={handleCreate}
          submitLabel="Create Partner"
          formData={formData}
          setFormData={setFormData}
          setShowCreateModal={setShowCreateModal}
          setShowEditModal={setShowEditModal}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Delivery Partner" size="lg">
        <PartnerForm
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          formData={formData}
          setFormData={setFormData}
          setShowCreateModal={setShowCreateModal}
          setShowEditModal={setShowEditModal}
        />
      </Modal>

      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} />
    </div>
  );
};

export default DeliveryPartnerListPage;
