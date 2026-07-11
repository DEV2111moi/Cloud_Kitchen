import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineLogout,
  HiOutlineX,
} from 'react-icons/hi';
import { GiCookingPot } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/admin/home-cooks', icon: GiCookingPot, label: 'Home Cooks' },
  { to: '/admin/customers', icon: HiOutlineUsers, label: 'Customers' },
  { to: '/admin/delivery-partners', icon: HiOutlineTruck, label: 'Delivery Partners' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, admin } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-surface-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-bold">
              CK
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Cloud Kitchen</h1>
              <p className="text-[11px] text-white/50 font-medium">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <HiOutlineX size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold tracking-wider text-white/30 uppercase mb-2">
            Main Menu
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="text-lg shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Admin Info + Logout */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-sm font-bold">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[11px] text-white/40 truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <HiOutlineLogout size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
