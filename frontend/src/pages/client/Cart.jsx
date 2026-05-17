import { useState, useEffect } from 'react';
import api from '../../api';
import { Trash2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCartItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (id, newQty) => {
    if (newQty < 1) return;
    try {
      await api.put(`/cart/${id}`, { quantity: newQty });
      fetchCart();
    } catch (err) {
      alert('Error updating quantity');
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      fetchCart();
    } catch (err) {
      alert('Error removing item');
    }
  };

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      // Create order
      await api.post('/checkout');
      setShowCheckoutModal(false);
      navigate('/client/orders');
    } catch (err) {
      alert(err.response?.data?.error || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading cart...</div>;

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Your cart is currently empty.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.itemName}</h3>
                  <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  <p className="text-sm font-medium text-gray-900 mt-2">${item.unitPrice?.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >-</button>
                    <span className="w-4 text-center font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >+</button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="font-bold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit sticky top-24">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-base">Total</span>
                <span className="font-bold text-xl">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              <CreditCard size={18} />
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Checkout Simulation Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Simulate Payment</h3>
            <p className="text-gray-600 mb-6">
              You are about to pay <strong>${totalAmount.toFixed(2)}</strong>. This is a simulated checkout process.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleCheckout}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
