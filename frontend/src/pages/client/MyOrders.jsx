import { useState, useEffect } from 'react';
import api from '../../api';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading your orders...</div>;

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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">My Orders</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500 flex flex-col items-center">
          <Package size={48} className="text-gray-300 mb-4" />
          <p>You haven't placed any orders yet.</p>
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
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(order.orderStatus)}`}>
                      Order: {order.orderStatus}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      Payment: {order.paymentStatus}
                    </span>
                  </div>
                  {expandedOrderId === order.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="bg-gray-50 p-5 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Order Items</h4>
                  <div className="space-y-3">
                    {order.items && order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku} | ${item.unitPrice.toFixed(2)} each</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">${item.lineTotal.toFixed(2)}</p>
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
