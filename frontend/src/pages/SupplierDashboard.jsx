import { useState, useEffect } from 'react';
import api from '../api';
import { RefreshCw, Package, AlertTriangle, Truck } from 'lucide-react';

export default function SupplierDashboard() {
  const [reorderRequests, setReorderRequests] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reorderRes, productsRes] = await Promise.all([
        api.get('/reorder-requests'),
        api.get('/products-supplied'),
      ]);
      setReorderRequests(reorderRes.data);
      setAllProducts(productsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading supplier dashboard...</div>;

  const totalProducts = allProducts.length;
  const criticalItems = reorderRequests.filter(r => r.status === 'Critical').length;
  const lowStockItems = reorderRequests.length;
  const suppliers = [...new Set(allProducts.map(p => p.supplier).filter(Boolean))];

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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Products" value={totalProducts} icon={Package} colorClass="bg-blue-100 text-blue-600" />
        <StatCard title="Reorder Requests" value={lowStockItems} icon={RefreshCw} colorClass="bg-amber-100 text-amber-600" />
        <StatCard title="Critical Items" value={criticalItems} icon={AlertTriangle} colorClass="bg-red-100 text-red-600" />
        <StatCard title="Active Suppliers" value={suppliers.length} icon={Truck} colorClass="bg-green-100 text-green-600" />
      </div>

      {/* Urgent Reorder Requests */}
      {reorderRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center gap-2">
            <RefreshCw className="text-amber-600" size={20} />
            <h3 className="text-lg font-semibold text-amber-800">Pending Reorder Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggested Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reorderRequests.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{item.currentStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reorderLevel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{item.suggestedReorder}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
