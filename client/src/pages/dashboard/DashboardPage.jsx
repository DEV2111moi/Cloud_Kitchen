import { useState, useEffect } from 'react';
import {
  HiOutlineShoppingCart,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import { GiCookingPot } from 'react-icons/gi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getStats, getChartData } from '../../api/dashboardApi';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([getStats(), getChartData()]);
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;

  const statCards = [
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: HiOutlineShoppingCart,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: HiOutlineCurrencyRupee,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Customers',
      value: stats?.totalCustomers || 0,
      icon: HiOutlineUserGroup,
      color: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
    {
      label: 'Home Cooks',
      value: stats?.totalHomeCooks || 0,
      icon: GiCookingPot,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Delivery Partners',
      value: stats?.totalDeliveryPartners || 0,
      icon: HiOutlineTruck,
      color: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: HiOutlineClock,
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <HiOutlineTrendingUp className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
            </div>
            <p className="text-2xl font-bold text-surface-900">{card.value}</p>
            <p className="text-xs text-surface-700/50 mt-0.5 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200/60 p-5">
          <h3 className="text-base font-bold text-surface-900 mb-4">Revenue & Orders Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={charts?.ordersTrend || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue (₹)" />
              <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fill="url(#colorOrders)" name="Orders" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="bg-white rounded-xl border border-surface-200/60 p-5">
          <h3 className="text-base font-bold text-surface-900 mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={(charts?.ordersByStatus || []).map(item => ({
                  name: item._id,
                  value: item.count,
                }))}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {(charts?.ordersByStatus || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs capitalize text-surface-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Home Cooks */}
        <div className="bg-white rounded-xl border border-surface-200/60 p-5">
          <h3 className="text-base font-bold text-surface-900 mb-4">Top Home Cooks</h3>
          <div className="space-y-3">
            {(charts?.topHomeCooks || []).map((cook, i) => (
              <div key={cook._id || i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-surface-200 text-surface-700'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-800 truncate">{cook.name}</p>
                  <p className="text-xs text-surface-700/50">{cook.totalOrders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-surface-900">{formatCurrency(cook.revenue || 0)}</p>
                  <p className="text-xs text-amber-500">★ {cook.rating?.toFixed(1)}</p>
                </div>
              </div>
            ))}
            {(!charts?.topHomeCooks || charts.topHomeCooks.length === 0) && (
              <p className="text-sm text-surface-700/50 text-center py-6">No data available</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-surface-200/60 p-5">
          <h3 className="text-base font-bold text-surface-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {(stats?.recentOrders || []).map((order) => (
              <div key={order._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <HiOutlineShoppingCart className="text-primary-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-800">{order.orderNumber}</p>
                  <p className="text-xs text-surface-700/50">
                    {order.customerId?.name || 'Unknown'} → {order.homeCookId?.name || 'Unknown'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-surface-900">{formatCurrency(order.totalAmount)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-sm text-surface-700/50 text-center py-6">No orders yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
