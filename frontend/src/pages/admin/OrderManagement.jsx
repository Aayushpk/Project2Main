import { useState, useEffect } from 'react';
import api from '../../api';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Packed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Shipped': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statuses = ['Pending', 'Approved', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

  if (loading) return <div className="text-gray-500">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Order Management</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-bold text-gray-900">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-medium text-gray-900">{order.clientUsername}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4 sm:mt-0" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Update Status:</label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      disabled={order.stockDeducted} // Prevent change if delivered
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                    {expandedOrderId === order.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </button>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="bg-gray-50 p-5 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Order Items</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {order.items && order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]">{item.itemName}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
