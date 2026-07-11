import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const Navbar = ({ onMenuClick, title }) => {
  const { admin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-200/60">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-surface-700 hover:bg-surface-100 transition-colors"
          >
            <HiOutlineMenuAlt2 size={22} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-surface-900">{title}</h2>
            <p className="text-xs text-surface-700/50 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-surface-100 rounded-lg px-3 py-2 min-w-[200px]">
            <HiOutlineSearch className="text-surface-700/40" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none w-full text-surface-700 placeholder-surface-700/40"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-surface-700 hover:bg-surface-100 transition-colors">
            <HiOutlineBell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Admin avatar */}
          <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-surface-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs font-bold text-white">
              {getInitials(admin?.name)}
            </div>
            <span className="text-sm font-medium text-surface-800">{admin?.name?.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
