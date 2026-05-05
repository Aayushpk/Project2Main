import { useState, useEffect } from 'react';
import api from '../api';
import { RefreshCw } from 'lucide-react';

export default function ReorderRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/reorder-requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading reorder requests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Reorder Requests</h2>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm border border-gray-200"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <RefreshCw className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-700">No Reorder Requests</h3>
          <p className="text-gray-500 mt-1">All inventory items are currently above their reorder levels.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggested Reorder Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{item.currentStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reorderLevel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{item.suggestedReorder}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supplier || '—'}</td>
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
