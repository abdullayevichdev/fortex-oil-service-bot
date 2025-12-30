const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { DB_PATH } = require("./config");

let db;

function initDatabase() {
  const dbPath = path.resolve(DB_PATH);
  db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON`);

    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id TEXT UNIQUE,
        customer_id TEXT,
        model TEXT,
        plate_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id TEXT UNIQUE,
        car_id TEXT,
        current_km INTEGER,
        coverage_km INTEGER,
        next_service_km INTEGER,
        oil_type TEXT,
        service_date TEXT,  -- Sana qo'lda qo'shiladi
        notes TEXT
      )
    `);
  });

  console.log("✅ Database ready");
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
async function addCustomer(name, phone = null) {
  const id = genId();
  const db = getDb();
  return new Promise((res, rej) => {
    db.run(
      `INSERT INTO customers (customer_id, name, phone) VALUES (?, ?, ?)`,
      [id, name, phone],
      function (err) {
        if (err) return rej(err);
        res(id);
      }
    );
  });
}

async function getCustomer(customerId) {
  const db = getDb();
  return new Promise((res, rej) => {
    db.get(`SELECT * FROM customers WHERE customer_id = ?`, [customerId], (err, row) => {
      if (err) return rej(err);
      res(row);
    });
  });
}

async function getCustomersByName(name) {
  const db = getDb();
  return new Promise((res, rej) => {
    db.all(
      `SELECT * FROM customers WHERE name LIKE ? ORDER BY created_at DESC LIMIT 10`,
      [`%${name}%`],
      (err, rows) => {
        if (err) return rej(err);
        res(rows || []);
      }
    );
  });
}

async function getRecentCustomers(limit = 20) {
  const db = getDb();
  return new Promise((res, rej) => {
    db.all(
      `SELECT c.*, COUNT(car.id) as car_count 
       FROM customers c 
       LEFT JOIN cars car ON car.customer_id = c.customer_id 
       GROUP BY c.customer_id 
       ORDER BY c.created_at DESC 
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return rej(err);
        res(rows || []);
      }
    );
  });
}

// ================= CARS =================
async function addCar(customerId, model = "Noma'lum model", plate = null) {
  const id = genId();
  const db = getDb();
  return new Promise((res, rej) => {
    db.run(
      `INSERT INTO cars (car_id, customer_id, model, plate_number) VALUES (?, ?, ?, ?)`,
      [id, customerId, model, plate],
      function (err) {
        if (err) return rej(err);
        res(id);
      }
    );
  });
}

// ================= SERVICES ================= (MUHIM O'ZGARTIRISH!)
async function addService(carId, currentKm, coverageKm, oilType, notes = "") {
  const id = genId();
  const next = currentKm + coverageKm;
  const today = new Date().toISOString().split('T')[0]; // BUGUNGI SANA: YYYY-MM-DD
  const db = getDb();

  return new Promise((res, rej) => {
    db.run(
      `INSERT INTO services 
      (service_id, car_id, current_km, coverage_km, next_service_km, oil_type, service_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, carId, currentKm, coverageKm, next, oilType, today, notes],
      function (err) {
        if (err) return rej(err);
        res(id);
      }
    );
  });
}

// ================= STATISTICS =================
async function getTodayStats() {
  const today = new Date().toISOString().split('T')[0];
  const db = getDb();

  return new Promise((res, rej) => {
    db.get(
      `SELECT COUNT(*) as totalServices FROM services WHERE service_date = ?`,
      [today],
      (err, row) => {
        if (err) return rej(err);

        db.get(
          `SELECT oil_type, COUNT(*) as cnt 
           FROM services 
           WHERE service_date = ? 
           GROUP BY oil_type 
           ORDER BY cnt DESC 
           LIMIT 1`,
          [today],
          (err2, oilRow) => {
            if (err2) return rej(err2);
            res({
              totalServices: row?.totalServices || 0,
              mostUsedOil: oilRow?.oil_type || 'Hali yo‘q'
            });
          }
        );
      }
    );
  });
}

module.exports = {
  initDatabase,
  addCustomer,
  getCustomer,
  getCustomersByName,
  getRecentCustomers,
  addCar,
  addService,
  getTodayStats
};