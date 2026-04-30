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
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);

  // ForecastResults
  db.run(`CREATE TABLE IF NOT EXISTS ForecastResults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    period TEXT NOT NULL,
    predictedDemand INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(itemId) REFERENCES Inventory(id)
  )`);
});

module.exports = db;
