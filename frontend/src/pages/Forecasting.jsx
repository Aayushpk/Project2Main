import { useState, useEffect } from 'react';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';

export default function Forecasting() {
  const [inventory, setInventory] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [periodDays, setPeriodDays] = useState(7);
  const [chartData, setChartData] = useState([]);
  const [forecastResult, setForecastResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load inventory to populate dropdown
    api.get('/inventory').then(res => setInventory(res.data));
  }, []);

  const handleGenerateForecast = async () => {
    if (!selectedItemId) return;
    setLoading(true);
    try {
      // 1. Generate new forecast
      await api.post('/forecast', { itemId: selectedItemId, periodDays: parseInt(periodDays) });
      
      // 2. Fetch comparison data
      const res = await api.get(`/forecast/compare/${selectedItemId}`);
      
      const { actualSales, forecast } = res.data;
      
      // Format data for Recharts
      const formattedData = actualSales.map(sale => ({
        date: new Date(sale.saleDate).toLocaleDateString(),
        Actual: sale.quantitySold,
        Predicted: null // Historical has no prediction in this simplified model
      }));
      
      // Add the future predicted point
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(periodDays));
      formattedData.push({
        date: futureDate.toLocaleDateString() + ' (Forecast)',
        Actual: null,
        Predicted: forecast.predictedDemand
      });
      
      setChartData(formattedData);
      setForecastResult(forecast);
      
    } catch (err) {
      alert(err.response?.data?.error || "Error generating forecast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="text-blue-600"/> Demand Forecasting Model</h2>
        
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
            <select 
              value={selectedItemId} 
              onChange={e => setSelectedItemId(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choose an item --</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.itemName} ({item.sku})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Period (Days)</label>
            <select 
              value={periodDays} 
              onChange={e => setPeriodDays(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">1 Week</option>
              <option value="14">2 Weeks</option>
              <option value="30">1 Month</option>
            </select>
          </div>
          
          <button 
            onClick={handleGenerateForecast}
            disabled={!selectedItemId || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Processing...' : 'Generate AI Forecast'}
          </button>
        </div>
      </div>

      {chartData.length > 0 && forecastResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-4">Actual vs Predicted Demand</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Actual" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Predicted" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold mb-2">Forecast Insights</h3>
              <div className="mt-4 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">Predicted Demand</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{forecastResult.predictedDemand} <span className="text-sm font-normal">units</span></p>
                  <p className="text-xs text-blue-600 mt-1">for next {forecastResult.period}</p>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                  <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Action Recommended</p>
                    <p className="text-xs mt-1">Based on historical velocity, prepare to restock to meet the predicted demand of {forecastResult.predictedDemand} units within {forecastResult.period}.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
