/**
 * forecastService.js — Demand Forecasting Engine for SmartInventory
 * 
 * Current implementation: Weighted Moving Average (WMA)
 * 
 * ──────────────────────────────────────────────────────────────────
 * FUTURE ML MODEL INTEGRATION NOTES:
 * 
 * 1. ARIMA (AutoRegressive Integrated Moving Average)
 *    - Suitable for short-term time-series forecasting (7-30 days)
 *    - Works well with stationary data or data made stationary via differencing
 *    - Recommended library: `arima` npm package
 *    - Replace the `weightedMovingAverage()` call in `generateForecast()` 
 *      with an ARIMA(p,d,q) model trained on daily aggregated sales
 *    - Typical parameters for retail inventory: ARIMA(2,1,2)
 * 
 * 2. LSTM (Long Short-Term Memory Neural Networks)
 *    - Suitable for larger datasets with complex, non-linear demand patterns
 *    - Can capture seasonality, promotions, and external factors
 *    - Recommended library: `@tensorflow/tfjs-node`
 *    - Would require a separate training pipeline and model serialization
 *    - Replace `weightedMovingAverage()` with LSTM inference in `generateForecast()`
 *    - Needs minimum 60+ days of historical data for reliable results
 * 
 * To swap models: modify `generateForecast()` to call your ML model
 * instead of `weightedMovingAverage()`. The output contract stays the same.
 * ──────────────────────────────────────────────────────────────────
 */

const db = require('../db');

// ── Helper: promisify db calls ──────────────────────────────────
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// ── Weighted Moving Average Model ───────────────────────────────
/**
 * Computes a weighted moving average over daily sales.
 * Recent days are weighted more heavily to capture trend shifts.
 * 
 * @param {Array} dailySales - Array of { date, totalSold } sorted chronologically
 * @param {number} windowSize - Number of days to consider (default: 14)
 * @returns {number} averageDailyDemand
 * 
 * ARIMA/LSTM SWAP POINT: Replace this function's logic with model inference.
 */
function weightedMovingAverage(dailySales, windowSize = 14) {
  if (dailySales.length === 0) return 0;

  // Use at most `windowSize` most-recent days
  const recentSales = dailySales.slice(-windowSize);
  const n = recentSales.length;

  // Linear weights: day 1 gets weight 1, day n gets weight n
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < n; i++) {
    const weight = i + 1; // more recent = higher weight
    weightedSum += recentSales[i].totalSold * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

// ── Risk Classification ─────────────────────────────────────────
function classifyRisk(daysUntilStockout) {
  if (daysUntilStockout <= 3) return 'critical';
  if (daysUntilStockout <= 7) return 'warning';
  if (daysUntilStockout <= 14) return 'upcoming';
  return 'healthy';
}

// ── Core Forecast Generator ─────────────────────────────────────
/**
 * Generate a full forecast for one inventory item.
 * 
 * @param {number} itemId
 * @param {number} periodDays - forecast horizon (7, 14, or 30)
 * @returns {Object} forecast result
 */
async function generateItemForecast(itemId, periodDays = 7) {
  // 1. Fetch the item
  const item = await dbGet("SELECT * FROM Inventory WHERE id = ?", [itemId]);
  if (!item) throw new Error("Item not found");

  // 2. Fetch raw sales history
  const rawSales = await dbAll(
    "SELECT quantitySold, saleDate FROM SalesHistory WHERE itemId = ? ORDER BY saleDate ASC",
    [itemId]
  );

  if (rawSales.length === 0) {
    throw new Error(`No sales history for "${item.itemName}". Cannot generate forecast.`);
  }

  // 3. Aggregate into daily totals
  const dailyMap = {};
  for (const sale of rawSales) {
    const day = sale.saleDate.substring(0, 10); // YYYY-MM-DD
    dailyMap[day] = (dailyMap[day] || 0) + sale.quantitySold;
  }
  const dailySales = Object.entries(dailyMap)
    .map(([date, totalSold]) => ({ date, totalSold }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 4. Compute weighted moving average
  //    ──── ARIMA/LSTM SWAP POINT ────
  //    Replace this call with your ML model inference:
  //      const averageDailyDemand = await arimaPredict(dailySales);
  //      const averageDailyDemand = await lstmPredict(dailySales);
  const averageDailyDemand = weightedMovingAverage(dailySales, 14);

  // 5. Calculate forecast metrics
  const predictedDemand = Math.max(1, Math.round(averageDailyDemand * periodDays));
  const currentStock = item.quantity;
  const daysUntilStockout = averageDailyDemand > 0
    ? Math.round(currentStock / averageDailyDemand)
    : 999; // effectively infinite if no demand
  const riskLevel = classifyRisk(daysUntilStockout);

  // Recommended reorder: enough to cover 2x the forecast period
  const safetyMultiplier = 2;
  const recommendedReorderQty = Math.max(
    item.reorderLevel,
    Math.round(averageDailyDemand * periodDays * safetyMultiplier) - currentStock
  );

  // Suggested reorder date: order `leadTimeDays` before stockout
  const leadTimeDays = 3; // assumed lead time
  const reorderInDays = Math.max(0, daysUntilStockout - leadTimeDays);
  const suggestedReorderDate = new Date();
  suggestedReorderDate.setDate(suggestedReorderDate.getDate() + reorderInDays);

  // 6. Persist to ForecastResults
  const periodStr = `${periodDays} days`;
  const forecastMeta = JSON.stringify({
    averageDailyDemand: Math.round(averageDailyDemand * 100) / 100,
    daysUntilStockout,
    recommendedReorderQty,
    suggestedReorderDate: suggestedReorderDate.toISOString().substring(0, 10),
    riskLevel,
    currentStock,
    reorderLevel: item.reorderLevel,
    dataPointsUsed: dailySales.length
  });

  const result = await dbRun(
    "INSERT INTO ForecastResults (itemId, period, predictedDemand, forecastMeta) VALUES (?, ?, ?, ?)",
    [itemId, periodStr, predictedDemand, forecastMeta]
  );

  return {
    id: result.lastID,
    itemId,
    itemName: item.itemName,
    sku: item.sku,
    category: item.category,
    period: periodStr,
    predictedDemand,
    averageDailyDemand: Math.round(averageDailyDemand * 100) / 100,
    currentStock,
    daysUntilStockout,
    recommendedReorderQty: Math.max(0, recommendedReorderQty),
    suggestedReorderDate: suggestedReorderDate.toISOString().substring(0, 10),
    riskLevel,
    reorderLevel: item.reorderLevel,
    dataPointsUsed: dailySales.length
  };
}

// ── Batch Forecast for All Items ────────────────────────────────
async function generateAllForecasts(periodDays = 7) {
  const items = await dbAll("SELECT id FROM Inventory");
  const results = [];
  const errors = [];

  for (const item of items) {
    try {
      const forecast = await generateItemForecast(item.id, periodDays);
      results.push(forecast);
    } catch (err) {
      errors.push({ itemId: item.id, error: err.message });
    }
  }

  return { results, errors };
}

// ── Summary: aggregate latest forecasts ─────────────────────────
async function getForecastSummary() {
  // Get the latest forecast per item (using max id per item)
  const forecasts = await dbAll(`
    SELECT fr.*, i.itemName, i.sku, i.category, i.quantity as currentStock, i.reorderLevel
    FROM ForecastResults fr
    INNER JOIN Inventory i ON fr.itemId = i.id
    WHERE fr.id IN (
      SELECT MAX(id) FROM ForecastResults GROUP BY itemId
    )
    ORDER BY fr.createdAt DESC
  `);

  // Parse forecastMeta and enrich
  const enriched = forecasts.map(f => {
    let meta = {};
    try { meta = JSON.parse(f.forecastMeta || '{}'); } catch (_) {}
    return {
      ...f,
      averageDailyDemand: meta.averageDailyDemand || 0,
      daysUntilStockout: meta.daysUntilStockout || 999,
      recommendedReorderQty: meta.recommendedReorderQty || 0,
      suggestedReorderDate: meta.suggestedReorderDate || null,
      riskLevel: meta.riskLevel || 'healthy',
      dataPointsUsed: meta.dataPointsUsed || 0
    };
  });

  // Aggregate stats
  const critical = enriched.filter(f => f.riskLevel === 'critical').length;
  const warning = enriched.filter(f => f.riskLevel === 'warning').length;
  const upcoming = enriched.filter(f => f.riskLevel === 'upcoming').length;
  const healthy = enriched.filter(f => f.riskLevel === 'healthy').length;

  return {
    totalForecasted: enriched.length,
    riskBreakdown: { critical, warning, upcoming, healthy },
    forecasts: enriched
  };
}

// ── Recommendations: items that need reorder ────────────────────
async function getRecommendations() {
  const summary = await getForecastSummary();
  
  // Filter to only items at risk (not healthy)
  const atRisk = summary.forecasts
    .filter(f => f.riskLevel !== 'healthy')
    .sort((a, b) => {
      const riskOrder = { critical: 0, warning: 1, upcoming: 2 };
      return (riskOrder[a.riskLevel] || 3) - (riskOrder[b.riskLevel] || 3);
    });

  return {
    totalAtRisk: atRisk.length,
    recommendations: atRisk
  };
}

// ── Comparison data for charts ──────────────────────────────────
async function getComparisonData(itemId) {
  // Latest forecast
  const forecast = await dbGet(
    "SELECT * FROM ForecastResults WHERE itemId = ? ORDER BY createdAt DESC LIMIT 1",
    [itemId]
  );
  if (!forecast) throw new Error("No forecast found for this item. Generate one first.");

  let meta = {};
  try { meta = JSON.parse(forecast.forecastMeta || '{}'); } catch (_) {}

  // Item info
  const item = await dbGet("SELECT * FROM Inventory WHERE id = ?", [itemId]);

  // Daily aggregated sales for the chart
  const rawSales = await dbAll(
    "SELECT quantitySold, saleDate FROM SalesHistory WHERE itemId = ? ORDER BY saleDate ASC",
    [itemId]
  );

  // Aggregate by day
  const dailyMap = {};
  for (const sale of rawSales) {
    const day = sale.saleDate.substring(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + sale.quantitySold;
  }
  const dailySales = Object.entries(dailyMap)
    .map(([date, totalSold]) => ({ date, totalSold }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    item: item ? { id: item.id, itemName: item.itemName, sku: item.sku, currentStock: item.quantity } : null,
    forecast: {
      ...forecast,
      ...meta
    },
    dailySales
  };
}

module.exports = {
  generateItemForecast,
  generateAllForecasts,
  getForecastSummary,
  getRecommendations,
  getComparisonData
};
