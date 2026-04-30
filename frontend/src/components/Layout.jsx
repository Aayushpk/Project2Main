import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, LineChart, FileText, LogOut } from 'lucide-react';

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

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Warehouse, label: 'Warehouses', path: '/warehouses' },
    { icon: LineChart, label: 'Forecasting', path: '/forecasting' },
    { icon: FileText, label: 'Reports', path: '/reports' },
  ];

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
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Welcome, {localStorage.getItem('username')}</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {localStorage.getItem('username')?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
