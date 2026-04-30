const db = require('./db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  console.log("Seeding data...");
  const adminPassword = await bcrypt.hash('admin123', 10);

  db.serialize(() => {
    // Clear existing data
    db.run("DELETE FROM ForecastResults");
    db.run("DELETE FROM SalesHistory");
    db.run("DELETE FROM InventoryHistory");
    db.run("DELETE FROM Inventory");
    db.run("DELETE FROM Users");

    // Seed Admin User
    db.run("INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, ?)", ['admin', adminPassword, 'admin']);

    // Seed Inventory Items
    db.run(`INSERT INTO Inventory (id, itemName, sku, category, price, quantity, reorderLevel, supplier, suppliedDate) VALUES
      (1, 'Laptop Pro 15', 'TECH-LAP-001', 'Electronics', 1299.99, 15, 20, 'TechSupply Inc', '2026-04-01'),
      (2, 'Wireless Mouse', 'TECH-MOU-002', 'Electronics', 25.50, 50, 10, 'TechSupply Inc', '2026-04-05'),
      (3, 'Mechanical Keyboard', 'TECH-KEY-003', 'Electronics', 85.00, 8, 15, 'TechSupply Inc', '2026-04-10')
    `);

    // Seed Fake Sales History (for forecasting)
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      const dateStr = date.toISOString();
      db.run(`INSERT INTO SalesHistory (itemId, quantitySold, saleDate) VALUES (1, ?, ?)`, [Math.floor(Math.random() * 3) + 1, dateStr]);
      db.run(`INSERT INTO SalesHistory (itemId, quantitySold, saleDate) VALUES (2, ?, ?)`, [Math.floor(Math.random() * 10) + 1, dateStr]);
      db.run(`INSERT INTO SalesHistory (itemId, quantitySold, saleDate) VALUES (3, ?, ?)`, [Math.floor(Math.random() * 5) + 1, dateStr]);
    }
  });

  console.log("Seeding complete. Use Ctrl+C to exit if it hangs.");
};

seedData();
