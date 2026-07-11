import { useState } from 'react';
import { registerAsCook } from '../../api/publicApi';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineBookOpen, HiOutlineLocationMarker, HiOutlineClipboardCheck } from 'react-icons/hi';

const PublicRegisterCookPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    speciality: '',
    bio: '',
    hasFssai: 'no',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in name, email, and phone number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await registerAsCook(formData);
      if (data.success) {
        setSuccess(true);
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/10">
          ✓
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-surface-900">Application Submitted!</h2>
          <p className="text-sm text-surface-700/60 leading-relaxed">
            Thank you for registering as a Home Cook. Our admin team will review your profile, verify the details, and contact you shortly. Once approved, you can start listing your delicious dishes!
          </p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Registration Instructions */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <h1 className="text-3xl font-black text-surface-900 leading-tight">
            Turn Your Culinary Passion Into a <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Thriving Business</span>
          </h1>
          <p className="text-sm text-surface-700/70 leading-relaxed">
            Join our Cloud Kitchen platform as a home cook. Prepare authentic dishes in your clean home kitchen, choose your menu, set your pricing, and leave the delivery to us.
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <HiOutlineClipboardCheck size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-surface-900">1. Apply Online</h4>
                <p className="text-xs text-surface-700/50 mt-0.5">Submit the form with your speciality and details.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <HiOutlineUser size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-surface-900">2. Admin Verification</h4>
                <p className="text-xs text-surface-700/50 mt-0.5">Our admins review and approve your kitchen verification & document profile.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <HiOutlineBookOpen size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-surface-900">3. Live and Earn</h4>
                <p className="text-xs text-surface-700/50 mt-0.5">Publish your menu, start receiving orders, and make money from home!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-surface-200/60 shadow-xl shadow-surface-200/20">
          <h2 className="text-xl font-bold text-surface-900 mb-6">Home Cook Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Full Name *</label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Chef Priyanka"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Email Address *</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Specialities (comma separated)</label>
                <div className="relative">
                  <HiOutlineBookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} />
                  <input
                    type="text"
                    value={formData.speciality}
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                    placeholder="North Indian, Biryani, Sweets"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Bio / Tell Us About Yourself</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                placeholder="Share your cooking passion, experience, or details of your kitchen setups..."
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none"
              />
            </div>

            {/* FSSAI Choice */}
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1.5">Do you have an FSSAI Certificate?</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasFssai: 'yes' })}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                    formData.hasFssai === 'yes'
                      ? 'bg-orange-50 border-orange-500 text-orange-655'
                      : 'border-surface-200 text-surface-700 bg-white hover:bg-surface-50'
                  }`}
                >
                  Yes, I have FSSAI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasFssai: 'no' })}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                    formData.hasFssai === 'no'
                      ? 'bg-orange-50 border-orange-500 text-orange-655'
                      : 'border-surface-200 text-surface-700 bg-white hover:bg-surface-50'
                  }`}
                >
                  No, I don't have FSSAI yet
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-surface-800 border-b border-surface-100 pb-1">Kitchen Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-surface-700 mb-0.5">Street Address</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-surface-700 mb-0.5">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-surface-700 mb-0.5">Pincode</label>
                  <input
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:from-orange-600 hover:to-red-650 transition-all disabled:opacity-60 shadow-lg shadow-orange-500/25"
            >
              {loading ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicRegisterCookPage;
