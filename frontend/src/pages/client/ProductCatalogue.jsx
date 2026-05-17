import { useState, useEffect } from 'react';
import api from '../../api';
import { ShoppingCart, X } from 'lucide-react';

export default function ProductCatalogue() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [orderModal, setOrderModal] = useState(null); // { itemId, itemName, maxQty }
  const [orderQty, setOrderQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/catalogue');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!orderModal) return;
    setSubmitting(true);
    try {
      await api.post('/cart', { itemId: orderModal.itemId, quantity: orderQty });
      setSuccessMsg(`Added ${orderQty}x ${orderModal.itemName} to your cart!`);
      setOrderModal(null);
      setOrderQty(1);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding to cart');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading catalogue...</div>;

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = filterCategory
    ? products.filter(p => p.category === filterCategory)
    : products;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Product Catalogue</h2>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{product.itemName}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
              </div>
              <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">${product.price?.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{product.quantity} available</p>
              </div>
              <button
                onClick={() => {
                  setOrderModal({ itemId: product.id, itemName: product.itemName, maxQty: product.quantity });
                  setOrderQty(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <ShoppingCart size={14} />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add to Cart Modal */}
      {orderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add to Cart</h3>
              <button onClick={() => setOrderModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{orderModal.itemName}</strong> — {orderModal.maxQty} available
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max={orderModal.maxQty}
                value={orderQty}
                onChange={(e) => setOrderQty(Math.min(Number(e.target.value), orderModal.maxQty))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setOrderModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium text-sm">Cancel</button>
              <button
                onClick={handleAddToCart}
                disabled={submitting || orderQty < 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
