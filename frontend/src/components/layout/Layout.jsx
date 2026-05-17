import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, LineChart, FileText, LogOut, ShoppingCart, RefreshCw, Truck, BookOpen, ClipboardList } from 'lucide-react';
import SaleSimulatorModal from '../common/SaleSimulatorModal';

const SidebarItem = ({ icon: Icon, label, path, isActive }) => (
  <Link 
    to={path} 
    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

// Role-based menu configs
const menuConfigs = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: LineChart, label: 'Forecasting', path: '/forecasting' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: ShoppingCart, label: 'Order Management', path: '/order-management' },
    { icon: RefreshCw, label: 'Reorder Management', path: '/reorder-management' },
  ],
  supplier: [
    { icon: LayoutDashboard, label: 'Supplier Dashboard', path: '/supplier' },
    { icon: RefreshCw, label: 'Reorder Requests', path: '/supplier/reorder-requests' },
    { icon: Truck, label: 'Products Supplied', path: '/supplier/products-supplied' },
  ],
  client: [
    { icon: LayoutDashboard, label: 'Client Dashboard', path: '/client' },
    { icon: BookOpen, label: 'Product Catalogue', path: '/client/catalogue' },
    { icon: ShoppingCart, label: 'Cart', path: '/client/cart' },
    { icon: ClipboardList, label: 'My Orders', path: '/client/orders' },
    { icon: ClipboardList, label: 'My Requests', path: '/client/my-requests' },
  ],
};

// Role badge colors
const roleBadgeColors = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  supplier: 'bg-amber-100 text-amber-700 border-amber-200',
  client: 'bg-teal-100 text-teal-700 border-teal-200',
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const role = localStorage.getItem('role') || 'admin';
  const username = localStorage.getItem('username') || 'User';
  const menuItems = menuConfigs[role] || menuConfigs.admin;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Determine page title from current path
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    if (currentItem) return currentItem.label;
    if (location.pathname === '/') return 'Dashboard';
    return location.pathname.substring(1).replace(/\//g, ' > ').replace(/(^|\s)\S/g, t => t.toUpperCase());
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider">SMART INVENTORY</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white w-full rounded-lg hover:bg-gray-800 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-6">
            {/* Only show Simulate Sale for admin */}
            {role === 'admin' && (
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors font-medium text-sm border border-indigo-200"
              >
                <ShoppingCart size={16} />
                Simulate Sale
              </button>
            )}
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="text-right">
                <span className="block text-sm text-gray-700 font-medium">{username}</span>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${roleBadgeColors[role] || ''}`}>
                  {role}
                </span>
              </div>
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {role === 'admin' && (
        <SaleSimulatorModal 
          isOpen={isSimulatorOpen} 
          onClose={() => setIsSimulatorOpen(false)} 
        />
      )}
    </div>
  );
}
