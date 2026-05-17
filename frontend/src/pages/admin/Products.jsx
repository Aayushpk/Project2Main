import { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Edit2, Check, X, Trash2 } from 'lucide-react';

export default function Products() {
  const [inventory, setInventory] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  
  // Add Form State
  const [formData, setFormData] = useState({
    itemName: '', sku: '', category: '', price: '', quantity: '', reorderLevel: '', supplier: ''
  });

  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);

  useEffect(() => {
    fetchInventory();

    const handleUpdate = () => fetchInventory();
    window.addEventListener('inventoryUpdated', handleUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleUpdate);
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      setDeleteConfirmationId(null);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting item");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        reorderLevel: parseInt(formData.reorderLevel)
      });
      setIsAddModalOpen(false);
      fetchInventory();
      setFormData({ itemName: '', sku: '', category: '', price: '', quantity: '', reorderLevel: '', supplier: '' });
    } catch (err) {
      alert("Error adding item");
    }
  };

  const handleUpdateQuantity = async (id) => {
    try {
      await api.put(`/inventory/${id}`, { quantity: parseInt(editQuantity) });
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      alert("Error updating quantity");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price.toFixed(2)}</td>
                  
                  {/* Editable Stock Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === item.id ? (
                      <input 
                        type="number" 
                        value={editQuantity} 
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="w-20 border rounded px-2 py-1"
                      />
                    ) : (
                      <span className={item.isLowStock ? "font-bold text-red-600" : ""}>{item.quantity}</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.isLowStock ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Low Stock</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => handleUpdateQuantity(item.id)} className="text-green-600 hover:text-green-900"><Check size={18}/></button>
                        <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-900"><X size={18}/></button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setEditingId(item.id); setEditQuantity(item.quantity); }} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={18}/>
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmationId(item.id)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Item Name</label><input required className="mt-1 w-full border rounded-md px-3 py-2" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">SKU</label><input required className="mt-1 w-full border rounded-md px-3 py-2" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
                <div><label className="block text-sm font-medium">Category</label><input className="mt-1 w-full border rounded-md px-3 py-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium">Price ($)</label><input type="number" step="0.01" required className="mt-1 w-full border rounded-md px-3 py-2" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                <div><label className="block text-sm font-medium">Quantity</label><input type="number" required className="mt-1 w-full border rounded-md px-3 py-2" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} /></div>
                <div><label className="block text-sm font-medium">Reorder Lvl</label><input type="number" required className="mt-1 w-full border rounded-md px-3 py-2" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm font-medium">Supplier</label><input className="mt-1 w-full border rounded-md px-3 py-2" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} /></div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this product? This will also delete all associated sales and forecasting history. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmationId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmationId)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
