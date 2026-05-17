import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api';
import { RefreshCw, CheckCircle, PackagePlus, ArrowRight } from 'lucide-react';

export default function ReorderManagement() {
  const [reorders, setReorders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'create'
  const location = useLocation();

  useEffect(() => {
    fetchData();
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reordersRes, inventoryRes] = await Promise.all([
        api.get('/reorders'),
        api.get('/inventory')
      ]);
      setReorders(reordersRes.data);
      // Filter inventory for low stock that doesn't already have an active request
      const activeItemIds = new Set(reordersRes.data.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').map(r => r.itemId));
      const lowStock = inventoryRes.data.filter(item => item.quantity <= item.reorderLevel && !activeItemIds.has(item.id));
      setLowStockItems(lowStock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async (id) => {
    try {
      await api.put(`/reorders/${id}/confirm-received`);
      fetchData();
      alert('Stock confirmed and inventory updated!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm stock');
    }
  };

  const handleCreateReorder = async (item) => {
    const recommended = Math.max(item.reorderLevel * 2 - item.quantity, item.reorderLevel);
    const qty = prompt(`Create reorder request for ${item.itemName}?\nRecommended quantity: ${recommended}`, recommended);
    
    if (qty && !isNaN(qty) && Number(qty) > 0) {
      try {
        await api.post('/reorders', { itemId: item.id, recommendedQty: Number(qty) });
        fetchData();
        setActiveTab('requests');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to create reorder request');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Requested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Dispatched': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Delivered': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="text-gray-500">Loading reorder data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Reorder Management</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('requests')}
        >
          Active & Past Requests
        </button>
        <button
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('create')}
        >
          <span>Create Request</span>
          {lowStockItems.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{lowStockItems.length} Low Stock</span>
          )}
        </button>
      </div>

      {activeTab === 'requests' ? (
        <div className="space-y-4">
          {reorders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <RefreshCw size={48} className="text-gray-300 mx-auto mb-4" />
              <p>No reorder requests found.</p>
            </div>
          ) : (
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reorders.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.itemName}</div>
                        <div className="text-sm text-gray-500">SKU: {req.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {req.recommendedQty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {req.supplier || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {req.status === 'Delivered' && !req.stockAdded ? (
                          <button 
                            onClick={() => handleConfirmReceived(req.id)}
                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 ml-auto transition-colors"
                          >
                            <CheckCircle size={14} /> Confirm Received
                          </button>
                        ) : req.stockAdded ? (
                          <span className="text-green-600 flex items-center justify-end gap-1"><CheckCircle size={14} /> Stock Added</span>
                        ) : (
                          <span className="text-gray-400">Waiting for Supplier</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {lowStockItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <CheckCircle size={48} className="text-green-300 mx-auto mb-4" />
              <p>All items have sufficient stock or pending requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lowStockItems.map((item) => (
                <div key={item.id} className="bg-white border border-red-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.itemName}</h3>
                  <p className="text-xs text-gray-500 mb-3">SKU: {item.sku}</p>
                  
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Current</p>
                      <p className="font-bold text-red-600 text-lg">{item.quantity}</p>
                    </div>
                    <ArrowRight className="text-gray-300 mb-1" size={16} />
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Reorder Level</p>
                      <p className="font-bold text-gray-700 text-lg">{item.reorderLevel}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleCreateReorder(item)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <PackagePlus size={16} /> Create Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
