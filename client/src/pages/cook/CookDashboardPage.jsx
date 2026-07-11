import { useState, useEffect } from 'react';
import { getCookStats } from '../../api/cookApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { HiOutlineChartBar, HiOutlineCurrencyRupee, HiOutlineStar, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const CookDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getCookStats();
        setStats(data.data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Loading your kitchen stats..." />;

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: HiOutlineCurrencyRupee, color: 'bg-emerald-500' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: HiOutlineChartBar, color: 'bg-orange-500' },
    { title: 'Active Orders', value: stats?.activeOrdersCount || 0, icon: HiOutlineClock, color: 'bg-blue-500' },
    { title: 'Kitchen Rating', value: `★ ${stats?.rating?.toFixed(1) || '0.0'}`, icon: HiOutlineStar, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-black text-surface-900">Welcome Back, {stats?.name}!</h1>
        <p className="text-xs text-surface-700/50">Here is how your kitchen is performing today.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white p-5 rounded-2xl border border-surface-200/60 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-surface-700/50 uppercase tracking-wider">{card.title}</p>
              <p className="text-2xl font-black text-surface-900">{card.value}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl ${card.color} text-white flex items-center justify-center shadow-lg shadow-surface-200`}>
              <card.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Shop Status Block */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-surface-900">Kitchen Status</h3>
          <p className="text-xs text-surface-700/60">Your kitchen is currently approved and open to receive online orders.</p>
        </div>
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
          Active & Open
        </span>
      </div>
    </div>
  );
};

export default CookDashboardPage;
