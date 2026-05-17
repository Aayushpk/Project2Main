import { useState, useEffect } from 'react';
import api from '../../api';
import { BookOpen, ClipboardList, Package, ShoppingCart } from 'lucide-react';

export default function ClientDashboard() {
  const [catalogue, setCatalogue] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, reqRes] = await Promise.all([
        api.get('/catalogue'),
        api.get('/client-requests'),
      ]);
      setCatalogue(catRes.data);
      setMyRequests(reqRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading client dashboard...</div>;

  const totalAvailable = catalogue.length;
  const categories = [...new Set(catalogue.map(p => p.category).filter(Boolean))];
  const pendingRequests = myRequests.filter(r => r.status === 'pending').length;

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
        <StatCard title="Available Products" value={totalAvailable} icon={Package} colorClass="bg-blue-100 text-blue-600" />
        <StatCard title="Categories" value={categories.length} icon={BookOpen} colorClass="bg-teal-100 text-teal-600" />
        <StatCard title="My Requests" value={myRequests.length} icon={ClipboardList} colorClass="bg-indigo-100 text-indigo-600" />
        <StatCard title="Pending Requests" value={pendingRequests} icon={ShoppingCart} colorClass="bg-amber-100 text-amber-600" />
      </div>

      {/* Recent Requests */}
      {myRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested On</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myRequests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
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
