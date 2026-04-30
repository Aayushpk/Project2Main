const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super-secret-key-for-project';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 1. Authentication Route (FR-01)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM Users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role, username: user.username });
  });
});

// 2. Inventory Routes (FR-02, FR-03, FR-04, FR-08, FR-09)
app.get('/api/inventory', authenticateToken, (req, res) => {
  db.all("SELECT * FROM Inventory", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Add low stock flag (FR-08)
    const inventoryWithAlerts = rows.map(item => ({
      ...item,
      isLowStock: item.quantity <= item.reorderLevel
    }));

    res.json(inventoryWithAlerts);
  });
});

app.post('/api/inventory', authenticateToken, (req, res) => {
  const { itemName, sku, category, price, quantity, reorderLevel, supplier, suppliedDate } = req.body;
  db.run(
    `INSERT INTO Inventory (itemName, sku, category, price, quantity, reorderLevel, supplier, suppliedDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [itemName, sku, category || null, price, quantity, reorderLevel, supplier || null, suppliedDate || null],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      const newId = this.lastID;
      db.run("INSERT INTO InventoryHistory (itemId, itemName, sku, eventType, quantityChange) VALUES (?, ?, ?, ?, ?)", 
        [newId, itemName, sku, "Add", quantity]);
      res.json({ id: newId, message: "Item added successfully" });
    }
  );
});

app.put('/api/inventory/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body; // updated quantity

  // Need to log to InventoryHistory
  db.get("SELECT itemName, sku, quantity FROM Inventory WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Item not found" });

    const oldQuantity = row.quantity;
    const quantityChange = quantity - oldQuantity;

    db.run("UPDATE Inventory SET quantity = ? WHERE id = ?", [quantity, id], function (err) {
      if (err) return res.status(400).json({ error: err.message });

      db.run("INSERT INTO InventoryHistory (itemId, itemName, sku, eventType, quantityChange) VALUES (?, ?, ?, ?, ?)", 
        [id, row.itemName, row.sku, "Update", quantityChange]);

      res.json({ message: "Quantity updated successfully" });
    });
  });
});

// DELETE /api/inventory/:id (FR-02)
app.delete('/api/inventory/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get("SELECT itemName, sku, quantity FROM Inventory WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Item not found" });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("DELETE FROM SalesHistory WHERE itemId = ?", [id]);
      db.run("DELETE FROM ForecastResults WHERE itemId = ?", [id]);
      
      db.run("DELETE FROM Inventory WHERE id = ?", [id], function(err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
        
        db.run("INSERT INTO InventoryHistory (itemId, itemName, sku, eventType, quantityChange) VALUES (?, ?, ?, ?, ?)", 
          [id, row.itemName, row.sku, "Removal", -row.quantity]);
          
        db.run("COMMIT");
        res.json({ message: "Item deleted successfully" });
      });
    });
  });
});

// POST /api/sales (FR-05)
app.post('/api/sales', authenticateToken, (req, res) => {
  const { itemId, quantitySold } = req.body;
  
  if (!itemId || !quantitySold || quantitySold <= 0) {
    return res.status(400).json({ error: "Invalid item or quantity" });
  }

  db.get("SELECT itemName, sku, quantity FROM Inventory WHERE id = ?", [itemId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Item not found" });

    const oldQuantity = row.quantity;
    const newQuantity = oldQuantity - quantitySold;

    if (newQuantity < 0) {
      return res.status(400).json({ error: "Not enough stock to complete sale" });
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      db.run("UPDATE Inventory SET quantity = ? WHERE id = ?", [newQuantity, itemId], function(err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
      });

      db.run("INSERT INTO InventoryHistory (itemId, itemName, sku, eventType, quantityChange) VALUES (?, ?, ?, ?, ?)", 
        [itemId, row.itemName, row.sku, "Sale", -quantitySold]);

      db.run("INSERT INTO SalesHistory (itemId, quantitySold) VALUES (?, ?)", [itemId, quantitySold], function(err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
        db.run("COMMIT");
        res.json({ message: "Sale recorded successfully", newQuantity });
      });
    });
  });
});

// GET /api/reports (FR-05, Fig 2.2/2.3)
app.get('/api/reports', authenticateToken, (req, res) => {
  const reportsData = {};
  
  db.serialize(() => {
    db.all("SELECT * FROM InventoryHistory ORDER BY timestamp DESC LIMIT 50", (err, logs) => {
      if (err) return res.status(500).json({ error: err.message });
      reportsData.movementLog = logs;
      
      db.get("SELECT SUM(price * quantity) as totalValue FROM Inventory", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        reportsData.totalValue = row.totalValue || 0;
        
        db.get("SELECT COUNT(*) as lowStockCount FROM Inventory WHERE quantity <= reorderLevel", (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          reportsData.lowStockCount = row.lowStockCount || 0;
          
          db.all("SELECT category, COUNT(*) as count FROM Inventory GROUP BY category", (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            reportsData.categoryDistribution = rows;
            res.json(reportsData);
          });
        });
      });
    });
  });
});

// 3. Forecasting Routes (FR-06, FR-07)
// Simulate ARIMA/LSTM with a simple moving average algorithm over the past data
app.post('/api/forecast', authenticateToken, (req, res) => {
  const { itemId, periodDays = 7 } = req.body;

  // Get sales history for the item
  db.all("SELECT quantitySold, saleDate FROM SalesHistory WHERE itemId = ? ORDER BY saleDate ASC", [itemId], (err, sales) => {
    if (err) return res.status(500).json({ error: err.message });
    if (sales.length === 0) return res.status(400).json({ error: "Not enough historical data to generate forecast" });

    // Simulate simple moving average as a proxy for the heavy ML model
    // Calculate average daily sales over the available history
    const totalSold = sales.reduce((sum, record) => sum + record.quantitySold, 0);
    const averageDaily = totalSold / sales.length;

    // The "predicted demand" for the upcoming period is the average daily * periodDays
    // We add a tiny bit of random variation to simulate a real model's output
    const predictedDemand = Math.max(1, Math.round(averageDaily * periodDays * (0.9 + Math.random() * 0.2)));

    const periodStr = `${periodDays} days`;

    // Save forecast
    db.run("INSERT INTO ForecastResults (itemId, period, predictedDemand) VALUES (?, ?, ?)", [itemId, periodStr, predictedDemand], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        id: this.lastID,
        itemId,
        period: periodStr,
        predictedDemand,
        message: "Forecast generated successfully"
      });
    });
  });
});

app.get('/api/forecast/compare/:itemId', authenticateToken, (req, res) => {
  const { itemId } = req.params;

  // Get latest forecast
  db.get("SELECT * FROM ForecastResults WHERE itemId = ? ORDER BY createdAt DESC LIMIT 1", [itemId], (err, forecast) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!forecast) return res.status(404).json({ error: "No forecast found for this item. Generate one first." });

    // Get actual sales (aggregate for display)
    db.all("SELECT quantitySold, saleDate FROM SalesHistory WHERE itemId = ? ORDER BY saleDate DESC LIMIT 30", [itemId], (err, sales) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        forecast,
        actualSales: sales.reverse() // chronological order
      });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
