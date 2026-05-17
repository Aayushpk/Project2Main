import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [salesGrowth, setSalesGrowth] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();

    const handleUpdate = () => fetchInventory();
    window.addEventListener('inventoryUpdated', handleUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleUpdate);
  }, []);

  const fetchInventory = async () => {
    try {
      const [invResponse, growthResponse] = await Promise.all([
        api.get('/inventory'),
        api.get('/sales/growth')
      ]);
      setInventory(invResponse.data);
      setSalesGrowth(growthResponse.data?.growth || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.isLowStock);
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={totalItems} 
          icon={Package} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStockItems.length} 
          icon={AlertTriangle} 
          colorClass="bg-red-100 text-red-600" 
        />
        <StatCard 
          title="Total Value" 
          value={`$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={DollarSign} 
          colorClass="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Sales Growth" 
          value={`${salesGrowth > 0 ? '+' : ''}${salesGrowth.toFixed(1)}%`} 
          icon={TrendingUp} 
          colorClass={salesGrowth >= 0 ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"} 
        />
      </div>

      {/* Low Stock Alerts Table */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="text-lg font-semibold text-red-800">Low Stock Alerts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reorderLevel}</td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900 cursor-pointer"
                      onClick={() => navigate('/reorders', { state: { tab: 'create' } })}
                    >
                      Restock
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          Activity feed will go here...
        </div>
      </div>
    </div>
  );
}
