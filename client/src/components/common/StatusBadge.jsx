const StatusBadge = ({ status, className = '' }) => {
  const colors = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
    suspended: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    blocked: 'bg-red-50 text-red-700 ring-red-600/20',
    placed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    preparing: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    ready: 'bg-teal-50 text-teal-700 ring-teal-600/20',
    picked: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    cancelled: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    refunded: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset capitalize ${
        colors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20'
      } ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
