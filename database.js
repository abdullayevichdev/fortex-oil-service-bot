const Database = require('better-sqlite3');
const path = require("path");
const { DB_PATH } = require("./config");

let db;

function initDatabase() {
  const dbPath = path.resolve(DB_PATH);
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id TEXT UNIQUE,
      customer_id TEXT,
      model TEXT,
      plate_number TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id TEXT UNIQUE,
      car_id TEXT,
      current_km INTEGER,
      coverage_km INTEGER,
      next_service_km INTEGER,
      oil_type TEXT,
      service_date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS nasiya (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id TEXT,
      current_km INTEGER,
      coverage_km INTEGER,
      oil_type TEXT,
      debt INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Database ready (better-sqlite3)");
  return db;
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ================= CUSTOMERS =================
function addCustomer(name, phone = null) {
  const id = genId();
  const stmt = db.prepare(`INSERT INTO customers (customer_id, name, phone) VALUES (?, ?, ?)`);
  stmt.run(id, name, phone);
  return id;
}

function getCustomer(customerId) {
  const stmt = db.prepare(`SELECT * FROM customers WHERE customer_id = ?`);
  return stmt.get(customerId);
}

function getCustomersByName(name) {
  const stmt = db.prepare(`SELECT * FROM customers WHERE name LIKE ? ORDER BY created_at DESC LIMIT 10`);
  return stmt.all(`%${name}%`);
}

function getRecentCustomers(limit = 20) {
  const stmt = db.prepare(`
    SELECT c.*, COUNT(car.id) as car_count 
    FROM customers c 
    LEFT JOIN cars car ON car.customer_id = c.customer_id 
    GROUP BY c.customer_id 
    ORDER BY c.created_at DESC 
    LIMIT ?
  `);
  return stmt.all(limit);
}

// ================= CARS =================
function addCar(customerId, model = "Noma'lum model", plate = null) {
  const id = genId();
  const stmt = db.prepare(`INSERT INTO cars (car_id, customer_id, model, plate_number) VALUES (?, ?, ?, ?)`);
  stmt.run(id, customerId, model, plate);
  return id;
}

// ================= SERVICES =================
function addService(carId, currentKm, coverageKm, oilType, notes = "") {
  const id = genId();
  const next = currentKm + coverageKm;
  const today = new Date().toISOString().split('T')[0];
  const stmt = db.prepare(`
    INSERT INTO services 
    (service_id, car_id, current_km, coverage_km, next_service_km, oil_type, service_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, carId, currentKm, coverageKm, next, oilType, today, notes);
  return id;
}

// ================= NASIYA =================
function addNasiya(carId, currentKm, coverageKm, oilType, debt) {
  const stmt = db.prepare(`
    INSERT INTO nasiya (car_id, current_km, coverage_km, oil_type, debt) VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(carId, currentKm, coverageKm, oilType, debt).lastInsertRowid;
}

function getAllNasiya() {
  const stmt = db.prepare(`
    SELECT n.*, c.name FROM nasiya n 
    LEFT JOIN cars car ON n.car_id = car.car_id 
    LEFT JOIN customers c ON car.customer_id = c.customer_id 
    ORDER BY n.created_at DESC
  `);
  return stmt.all();
}

function deleteNasiya(id) {
  const stmt = db.prepare(`DELETE FROM nasiya WHERE id = ?`);
  stmt.run(id);
}

// ================= STATISTICS =================
function getTodayStats() {
  const today = new Date().toISOString().split('T')[0];

  const totalStmt = db.prepare(`SELECT COUNT(*) as totalServices FROM services WHERE service_date = ?`);
  const row = totalStmt.get(today);

  const oilStmt = db.prepare(`
    SELECT oil_type, COUNT(*) as cnt 
    FROM services 
    WHERE service_date = ? 
    GROUP BY oil_type 
    ORDER BY cnt DESC 
    LIMIT 1
  `);
  const oilRow = oilStmt.get(today);

  return {
    totalServices: row?.totalServices || 0,
    mostUsedOil: oilRow?.oil_type || 'Hali yo‘q'
  };
}

module.exports = {
  initDatabase,
  addCustomer,
  getCustomer,
  getCustomersByName,
  getRecentCustomers,
  addCar,
  addService,
  getTodayStats,
  addNasiya,
  getAllNasiya,
  deleteNasiya
};