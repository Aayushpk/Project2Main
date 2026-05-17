const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users
  db.run(`CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff'
  )`);

  // Inventory
  db.run(`CREATE TABLE IF NOT EXISTS Inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemName TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT,
    price REAL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reorderLevel INTEGER NOT NULL DEFAULT 0,
    supplier TEXT,
    suppliedDate TEXT
  )`);

  // InventoryHistory (Movement Log)
  db.run(`CREATE TABLE IF NOT EXISTS InventoryHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER,
    itemName TEXT,
    sku TEXT,
    eventType TEXT NOT NULL,
    quantityChange INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // SalesHistory
  db.run(`CREATE TABLE IF NOT EXISTS SalesHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    quantitySold INTEGER NOT NULL,
    saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    orderId INTEGER,
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);

  // Migration: add orderId column to SalesHistory if missing
  db.run(`ALTER TABLE SalesHistory ADD COLUMN orderId INTEGER`, (err) => {
    // Ignore "duplicate column" errors
  });

  // ForecastResults
  db.run(`CREATE TABLE IF NOT EXISTS ForecastResults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    period TEXT NOT NULL,
    predictedDemand INTEGER NOT NULL,
    forecastMeta TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);

  // Migration: add forecastMeta column if missing (safe for existing databases)
  db.run(`ALTER TABLE ForecastResults ADD COLUMN forecastMeta TEXT`, (err) => {
    // Ignore "duplicate column" errors — means column already exists
  });

  // ClientRequests
  db.run(`CREATE TABLE IF NOT EXISTS ClientRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientUsername TEXT NOT NULL,
    itemId INTEGER NOT NULL,
    itemName TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);

  // CartItems
  db.run(`CREATE TABLE IF NOT EXISTS CartItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    itemId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES Users(id),
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);

  // Orders
  db.run(`CREATE TABLE IF NOT EXISTS Orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    totalAmount REAL NOT NULL,
    orderStatus TEXT NOT NULL DEFAULT 'Pending',
    paymentStatus TEXT NOT NULL DEFAULT 'Pending',
    stockDeducted BOOLEAN NOT NULL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES Users(id)
  )`);

  // OrderItems
  db.run(`CREATE TABLE IF NOT EXISTS OrderItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    itemId INTEGER NOT NULL,
    productName TEXT NOT NULL,
    sku TEXT NOT NULL,
    unitPrice REAL NOT NULL,
    quantity INTEGER NOT NULL,
    lineTotal REAL NOT NULL,
    FOREIGN KEY(orderId) REFERENCES Orders(id),
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);

  // ReorderRequests
  db.run(`CREATE TABLE IF NOT EXISTS ReorderRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    productName TEXT NOT NULL,
    sku TEXT NOT NULL,
    currentStock INTEGER NOT NULL,
    reorderLevel INTEGER NOT NULL,
    recommendedQty INTEGER NOT NULL,
    suggestedDate DATETIME,
    status TEXT NOT NULL DEFAULT 'Requested',
    supplier TEXT,
    stockAdded BOOLEAN NOT NULL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);
});

module.exports = db;
