import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/': 'Dashboard',
  '/home-cooks': 'Home Cook Management',
  '/customers': 'Customer Management',
  '/delivery-partners': 'Delivery Partner Management',
  '/orders': 'Order Management',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        return title;
      }
    }
    return 'Admin Panel';
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={getTitle()} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
