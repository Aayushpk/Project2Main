import { useState, useEffect } from 'react';
import api from '../api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  Activity, AlertCircle, AlertTriangle, RefreshCw, TrendingUp,
  ShieldCheck, Clock, Package, ChevronDown, ChevronUp
} from 'lucide-react';

const RISK_CONFIG = {
  critical: { color: '#ef4444', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Critical' },
  warning:  { color: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'Warning' },
  upcoming: { color: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Upcoming' },
  healthy:  { color: '#22c55e', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Healthy' },
};

export default function Forecasting() {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [periodDays, setPeriodDays] = useState(7);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | chart | recommendations

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [invRes, summaryRes, recsRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/forecast/summary').catch(() => ({ data: null })),
        api.get('/forecast/recommendations').catch(() => ({ data: null })),
      ]);
      setInventory(invRes.data);
      setSummary(summaryRes.data);
      setRecommendations(recsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      await api.post('/forecast/generate', { periodDays: parseInt(periodDays) });
      // Reload data
      const [summaryRes, recsRes] = await Promise.all([
        api.get('/forecast/summary'),
        api.get('/forecast/recommendations'),
      ]);
      setSummary(summaryRes.data);
      setRecommendations(recsRes.data);
      setActiveTab('overview');
    } catch (err) {
      alert(err.response?.data?.error || 'Error generating forecasts');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSingle = async () => {
    if (!selectedItemId) return;
    setGenerating(true);
    try {
      await api.post('/forecast/generate', { itemId: selectedItemId, periodDays: parseInt(periodDays) });
      // Load comparison chart
      const res = await api.get(`/forecast/compare/${selectedItemId}`);
      setComparisonData(res.data);
      setActiveTab('chart');
      // Also refresh summary
      const [summaryRes, recsRes] = await Promise.all([
        api.get('/forecast/summary'),
        api.get('/forecast/recommendations'),
      ]);
      setSummary(summaryRes.data);
      setRecommendations(recsRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error generating forecast');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewChart = async (itemId) => {
    try {
      const res = await api.get(`/forecast/compare/${itemId}`);
      setComparisonData(res.data);
      setSelectedItemId(itemId);
      setActiveTab('chart');
    } catch (err) {
      alert(err.response?.data?.error || 'No forecast data available. Generate a forecast first.');
    }
  };

  if (loading) return <div className="text-gray-500">Loading forecasting engine...</div>;

  const riskBreakdown = summary?.riskBreakdown || { critical: 0, warning: 0, upcoming: 0, healthy: 0 };

  // Chart data for the bar chart showing risk distribution
  const riskChartData = [
    { name: 'Critical', count: riskBreakdown.critical, color: '#ef4444' },
    { name: 'Warning', count: riskBreakdown.warning, color: '#f59e0b' },
    { name: 'Upcoming', count: riskBreakdown.upcoming, color: '#3b82f6' },
    { name: 'Healthy', count: riskBreakdown.healthy, color: '#22c55e' },
  ];

  // Prepare comparison chart data
  let chartData = [];
  if (comparisonData?.dailySales) {
    chartData = comparisonData.dailySales.map(s => ({
      date: s.date.substring(5), // MM-DD
      actual: s.totalSold,
    }));
    // Add forecast projection point
    if (comparisonData.forecast) {
      const avgDaily = comparisonData.forecast.averageDailyDemand || 0;
      chartData.push({
        date: 'Forecast →',
        actual: null,
        predicted: Math.round(avgDaily),
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-blue-600" /> Demand Forecasting Engine
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={periodDays}
              onChange={e => setPeriodDays(e.target.value)}
              className="border-gray-300 rounded-lg shadow-sm border px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
            <button
              onClick={handleGenerateAll}
              disabled={generating}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Processing...' : 'Generate All Forecasts'}
            </button>
          </div>
        </div>

        {/* Single item forecast */}
        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Or forecast a single product</label>
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm border px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select product --</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.itemName} ({item.sku})</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateSingle}
            disabled={!selectedItemId || generating}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors text-sm font-medium"
          >
            Forecast & Chart
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'chart', label: 'Forecast Chart', icon: Activity },
          { key: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Risk stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(RISK_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`bg-white rounded-xl shadow-sm border p-5 ${cfg.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">{cfg.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${cfg.text}`}>{riskBreakdown[key]}</p>
                  </div>
                  <div className={`p-3 rounded-full ${cfg.bg}`}>
                    {key === 'critical' && <AlertCircle className={cfg.text} size={22} />}
                    {key === 'warning' && <AlertTriangle className={cfg.text} size={22} />}
                    {key === 'upcoming' && <Clock className={cfg.text} size={22} />}
                    {key === 'healthy' && <ShieldCheck className={cfg.text} size={22} />}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {key === 'critical' ? '≤3 days to stockout' :
                   key === 'warning' ? '≤7 days to stockout' :
                   key === 'upcoming' ? '≤14 days to stockout' :
                   '>14 days of stock'}
                </p>
              </div>
            ))}
          </div>

          {/* Risk bar chart + Forecast table side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-semibold mb-4">Risk Distribution</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {riskChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold">Forecast Results</h3>
                <span className="text-xs text-gray-400">{summary?.totalForecasted || 0} items forecasted</span>
              </div>
              {(!summary?.forecasts || summary.forecasts.length === 0) ? (
                <div className="p-10 text-center text-gray-400">
                  <Activity className="mx-auto mb-3 text-gray-300" size={40} />
                  <p className="font-medium">No forecasts generated yet</p>
                  <p className="text-xs mt-1">Click "Generate All Forecasts" to start</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Avg/Day</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Predicted</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Stockout</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {summary.forecasts.map((f) => {
                        const risk = RISK_CONFIG[f.riskLevel] || RISK_CONFIG.healthy;
                        return (
                          <tr key={f.itemId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                              {f.itemName}
                              <span className="block text-xs text-gray-400">{f.sku}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{f.currentStock}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{f.averageDailyDemand}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-blue-700">{f.predictedDemand}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {f.daysUntilStockout >= 999 ? '—' : `${f.daysUntilStockout}d`}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${risk.bg} ${risk.text}`}>
                                {risk.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => handleViewChart(f.itemId)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                View Chart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Forecast Chart ── */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {!comparisonData ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Activity className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="font-medium text-gray-600">Select a product and generate a forecast to view the chart</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-1">
                  {comparisonData.item?.itemName || 'Product'} — Sales Trend
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Daily sales volume with forecast projection
                </p>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} connectNulls={false} />
                      <Line type="monotone" dataKey="predicted" name="Predicted (Avg/Day)" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insight Cards */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Forecast Insights</h3>
                  <div className="space-y-3">
                    <InsightRow label="Predicted Demand" value={`${comparisonData.forecast.predictedDemand} units`} sub={`for ${comparisonData.forecast.period}`} />
                    <InsightRow label="Avg Daily Demand" value={`${comparisonData.forecast.averageDailyDemand} units/day`} />
                    <InsightRow label="Current Stock" value={`${comparisonData.item?.currentStock} units`} />
                    <InsightRow label="Days Until Stockout"
                      value={comparisonData.forecast.daysUntilStockout >= 999 ? 'N/A' : `${comparisonData.forecast.daysUntilStockout} days`}
                      highlight={comparisonData.forecast.daysUntilStockout <= 7}
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Reorder Recommendation</h3>
                  <div className="space-y-3">
                    <InsightRow label="Reorder Qty" value={`${comparisonData.forecast.recommendedReorderQty || 0} units`} />
                    <InsightRow label="Reorder By" value={comparisonData.forecast.suggestedReorderDate || '—'} />
                    <div className="pt-2">
                      {(() => {
                        const risk = RISK_CONFIG[comparisonData.forecast.riskLevel] || RISK_CONFIG.healthy;
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${risk.bg} ${risk.text}`}>
                            Risk: {risk.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Recommendations ── */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {(!recommendations || recommendations.totalAtRisk === 0) ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-12 text-center">
              <ShieldCheck className="mx-auto text-green-400 mb-3" size={48} />
              <p className="font-semibold text-green-700 text-lg">All Products Are Healthy</p>
              <p className="text-gray-500 text-sm mt-1">No reorder actions needed at this time.</p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={22} />
                <div>
                  <p className="font-semibold text-amber-800">{recommendations.totalAtRisk} product(s) need attention</p>
                  <p className="text-xs text-amber-600 mt-0.5">Sorted by risk severity — critical items first</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Daily</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stockout In</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Qty</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder By</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recommendations.recommendations.map((r) => {
                        const risk = RISK_CONFIG[r.riskLevel] || RISK_CONFIG.healthy;
                        return (
                          <tr key={r.itemId} className="hover:bg-gray-50">
                            <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-900">
                              {r.itemName}
                              <span className="block text-xs text-gray-400">{r.sku}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-gray-700">{r.currentStock}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-gray-700">{r.averageDailyDemand}</td>
                            <td className="px-5 py-4 whitespace-nowrap font-semibold text-red-600">
                              {r.daysUntilStockout >= 999 ? '—' : `${r.daysUntilStockout} days`}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap font-semibold text-blue-700">{r.recommendedReorderQty}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-gray-600">{r.suggestedReorderDate || '—'}</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${risk.bg} ${risk.text}`}>
                                {risk.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleViewChart(r.itemId)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Small helper component for insight rows in the chart sidebar
function InsightRow({ label, value, sub, highlight }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? 'text-red-600' : ''}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
        {sub && <span className="block text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}
