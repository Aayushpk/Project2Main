import { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import api from '../../api';

export default function SaleSimulatorModal({ isOpen, onClose }) {
  const [inventory, setInventory] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
      setMessage('');
      setError('');
      setQuantity(1);
      setSelectedItemId('');
    }
  }, [isOpen]);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      // Filter out out-of-stock items for sales
      setInventory(response.data.filter(item => item.quantity > 0));
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory');
    }
  };

  const handleSimulateSale = async (e) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) return;

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await api.post('/sales', {
        itemId: parseInt(selectedItemId),
        quantitySold: parseInt(quantity)
      });
      
      setMessage('Sale recorded successfully!');
      
      // Dispatch event to update other components
      window.dispatchEvent(new Event('inventoryUpdated'));
      
      // Refresh inventory in the modal
      await fetchInventory();
      setQuantity(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Error recording sale');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShoppingCart size={24} />
            <h3 className="text-xl font-bold text-gray-900">Sale Simulator</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        {message && (
          <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSimulateSale} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
            <select
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="" disabled>-- Choose an item --</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemName} (Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Sold</label>
            <input
              type="number"
              required
              min="1"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedItemId || inventory.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
