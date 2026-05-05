const db = require('./db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  console.log("Seeding data...");
  const adminPassword = await bcrypt.hash('admin123', 10);
  const supplierPassword = await bcrypt.hash('supplier123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  db.serialize(() => {
    // Clear existing data
    db.run("DELETE FROM ForecastResults");
    db.run("DELETE FROM SalesHistory");
    db.run("DELETE FROM InventoryHistory");
    db.run("DELETE FROM Inventory");
    db.run("DELETE FROM Users");

    // Seed Users
    db.run("INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, ?)", ['admin', adminPassword, 'admin']);
    db.run("INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, ?)", ['supplier', supplierPassword, 'supplier']);
    db.run("INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, ?)", ['client', clientPassword, 'client']);

    // Seed Inventory Items
    db.run(`INSERT INTO Inventory (id, itemName, sku, category, price, quantity, reorderLevel, supplier, suppliedDate) VALUES
      (1, 'Laptop Pro 15', 'TECH-LAP-001', 'Electronics', 1299.99, 15, 20, 'TechSupply Inc', '2026-04-01'),
      (2, 'Wireless Mouse', 'TECH-MOU-002', 'Electronics', 25.50, 50, 10, 'TechSupply Inc', '2026-04-05'),
      (3, 'Mechanical Keyboard', 'TECH-KEY-003', 'Electronics', 85.00, 8, 15, 'TechSupply Inc', '2026-04-10'),
      (4, '4K Monitor 27"', 'TECH-MON-004', 'Electronics', 350.00, 12, 10, 'VisionTech', '2026-04-12'),
      (5, 'USB-C Hub', 'TECH-HUB-005', 'Electronics', 45.99, 30, 20, 'ConnectAll', '2026-04-14'),
      (6, 'Noise Cancelling Headphones', 'TECH-AUD-006', 'Electronics', 199.99, 25, 10, 'AudioMax', '2026-04-15'),
      (7, 'Ergonomic Office Chair', 'FURN-CHR-007', 'Furniture', 220.00, 5, 5, 'OfficePlus', '2026-04-02'),
      (8, 'Standing Desk', 'FURN-DSK-008', 'Furniture', 450.00, 3, 5, 'OfficePlus', '2026-04-03'),
      (9, 'Desk Lamp', 'FURN-LMP-009', 'Furniture', 35.00, 40, 15, 'LightBright', '2026-04-08'),
      (10, 'Webcam 1080p', 'TECH-CAM-010', 'Electronics', 60.00, 18, 15, 'VisionTech', '2026-04-18'),
      (11, 'Wireless Charger', 'TECH-CHG-011', 'Electronics', 25.00, 60, 25, 'PowerUp', '2026-04-19'),
      (12, 'Bluetooth Speaker', 'TECH-SPK-012', 'Electronics', 45.00, 35, 15, 'AudioMax', '2026-04-20'),
      (13, 'Gaming Mousepad', 'TECH-PAD-013', 'Accessories', 15.00, 100, 30, 'GameGear', '2026-04-21'),
      (14, 'External SSD 1TB', 'TECH-STR-014', 'Electronics', 120.00, 22, 10, 'TechSupply Inc', '2026-04-22'),
      (15, 'Laptop Stand', 'TECH-STN-015', 'Accessories', 30.00, 45, 15, 'ErgoTech', '2026-04-23'),
      (16, 'HDMI Cable 6ft', 'TECH-CBL-016', 'Accessories', 10.00, 150, 50, 'ConnectAll', '2026-04-24'),
      (17, 'Network Switch 8-Port', 'TECH-NET-017', 'Electronics', 35.00, 10, 5, 'NetGear', '2026-04-25'),
      (18, 'UPS Battery Backup', 'TECH-PWR-018', 'Electronics', 85.00, 8, 5, 'PowerUp', '2026-04-26'),
      (19, 'Monitor Arm Mount', 'TECH-MNT-019', 'Accessories', 55.00, 14, 10, 'ErgoTech', '2026-04-27'),
      (20, 'Microphone Condenser', 'TECH-MIC-020', 'Electronics', 110.00, 12, 5, 'AudioMax', '2026-04-28')
    `);

    // Seed Fake Sales History (for forecasting)
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      const dateStr = date.toISOString();
      for (let itemId = 1; itemId <= 20; itemId++) {
        db.run(`INSERT INTO SalesHistory (itemId, quantitySold, saleDate) VALUES (?, ?, ?)`, [itemId, Math.floor(Math.random() * 5) + 1, dateStr]);
      }
    }
  });

  console.log("Seeding complete. Use Ctrl+C to exit if it hangs.");
};

seedData();
