import { useState, useEffect } from 'react';
import { getCookMenu, createCookMenuItem, updateCookMenuItem, deleteCookMenuItem } from '../../api/cookApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineInbox } from 'react-icons/hi';

const CookMenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main-course',
    cuisine: 'Indian',
    isVeg: true,
    isAvailable: true,
    preparationTime: '30 mins',
    image: '',
  });

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const { data } = await getCookMenu();
      setMenu(data.data);
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'main-course',
      cuisine: 'Indian',
      isVeg: true,
      isAvailable: true,
      preparationTime: '30 mins',
      image: '',
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || 'main-course',
      cuisine: item.cuisine || 'Indian',
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || '30 mins',
      image: item.image || '',
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Please enter name and price');
      return;
    }
    try {
      if (editingItem) {
        await updateCookMenuItem(editingItem._id, formData);
        toast.success('Menu item updated');
      } else {
        await createCookMenuItem(formData);
        toast.success('Menu item added successfully');
      }
      setShowFormModal(false);
      fetchMenu();
    } catch (error) {
      toast.error('Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCookMenuItem(id);
      toast.success('Menu item deleted');
      fetchMenu();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await updateCookMenuItem(item._id, { isAvailable: !item.isAvailable });
      toast.success(`${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}`);
      fetchMenu();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900">Manage Menu</h1>
          <p className="text-xs text-surface-700/50">Add new dishes, update prices, or toggle active item availability.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
        >
          <HiOutlinePlus size={16} />
          Add New Dish
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching menu items..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menu.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Food Image */}
                <div className="relative h-40 bg-surface-100">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Veg Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded bg-white/95 backdrop-blur-sm shadow-sm text-[9px] font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>{item.isVeg ? 'VEG' : 'NON-VEG'}</span>
                  </div>

                  {/* Availability Toggle pill */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold shadow-sm transition-all ${
                      item.isAvailable
                        ? 'bg-emerald-500 text-white'
                        : 'bg-surface-200 text-surface-700'
                    }`}
                  >
                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-surface-900 text-sm leading-snug line-clamp-1">{item.name}</h3>
                      <span className="font-black text-orange-600 text-sm">{formatCurrency(item.price)}</span>
                    </div>
                    <p className="text-[11px] text-surface-700/50 line-clamp-2">{item.description || 'No description provided.'}</p>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-surface-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-surface-700/40 uppercase bg-surface-50 px-2 py-0.5 rounded">
                      {item.category.replace('-', ' ')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-surface-700/60 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Item"
                      >
                        <HiOutlinePencil size={15} />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            title: 'Delete Menu Item',
                            message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
                            onConfirm: () => handleDelete(item._id),
                            danger: true,
                          })
                        }
                        className="p-1.5 rounded-lg text-surface-700/60 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Item"
                      >
                        <HiOutlineTrash size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {menu.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-surface-200/60 flex flex-col items-center justify-center space-y-2">
              <HiOutlineInbox size={32} className="text-surface-700/30" />
              <p className="text-surface-700/50 text-sm font-semibold">No dishes added to your menu yet</p>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editingItem ? 'Edit Dish' : 'Add New Dish'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Dish Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Paneer Tikka Masala"
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="220"
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
              >
                <option value="main-course">Main Course</option>
                <option value="starters">Starters</option>
                <option value="biryani">Biryani</option>
                <option value="breads">Breads</option>
                <option value="desserts">Desserts</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="thali">Thali</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Cuisine Type</label>
              <input
                type="text"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                placeholder="North Indian"
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Preparation Time</label>
              <input
                type="text"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                placeholder="25 mins"
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Describe the taste, ingredients, or quantity..."
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-surface-700">
              <input
                type="checkbox"
                checked={formData.isVeg}
                onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                className="accent-emerald-600 rounded"
              />
              <span>Is Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-surface-700">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="accent-orange-500 rounded"
              />
              <span>Is Available (In Stock)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-700 hover:bg-surface-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
            >
              {editingItem ? 'Save Changes' : 'Add Dish'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} />
    </div>
  );
};

export default CookMenuPage;
