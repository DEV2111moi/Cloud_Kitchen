import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Redirect based on role
      if (user.role === 'homecook') {
        navigate('/cook');
      } else if (user.role === 'delivery') {
        navigate('/delivery');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-surface-900 via-primary-900 to-surface-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl font-black text-white mb-6 shadow-2xl shadow-primary-500/30">
            CK
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            Cloud Kitchen
          </h1>
          <p className="text-lg text-white/50 font-medium mb-8">
            Centralized Management Portal
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
            {[
              { label: 'Home Cooks', value: '500+' },
              { label: 'Customers', value: '10K+' },
              { label: 'Deliveries', value: '50K+' },
              { label: 'Revenue', value: '₹2Cr+' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl font-black text-white">
              CK
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900">Cloud Kitchen</h1>
              <p className="text-xs text-surface-700/50">Management Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
            <p className="text-surface-700/60 text-sm">Sign in with your Admin or Home Cook credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-800 placeholder-surface-700/40 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-800 placeholder-surface-700/40 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-700/40 hover:text-surface-700"
                >
                  {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold text-sm hover:from-primary-700 hover:to-primary-800 focus:ring-4 focus:ring-primary-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-600/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
            <div>
              <p className="text-xs font-bold text-surface-800 mb-1">👑 Admin Demo Credentials</p>
              <p className="text-xs text-surface-700">
                <span className="font-semibold">Email:</span> admin@cloudkitchen.com | <span className="font-semibold">Pass:</span> admin123
              </p>
            </div>
            <div className="border-t border-surface-200 pt-2">
              <p className="text-xs font-bold text-surface-800 mb-1">🍳 Home Cook Demo Credentials</p>
              <p className="text-xs text-surface-700">
                <span className="font-semibold">Email:</span> priya@homecook.com | <span className="font-semibold">Pass:</span> cook123
              </p>
            </div>
            <div className="border-t border-surface-200 pt-2">
              <p className="text-xs font-bold text-surface-800 mb-1">🚴 Delivery Partner Demo Credentials</p>
              <p className="text-xs text-surface-700">
                <span className="font-semibold">Email:</span> rajesh@delivery.com | <span className="font-semibold">Pass:</span> delivery123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
