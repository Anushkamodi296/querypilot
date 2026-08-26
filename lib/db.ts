import type { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
const initSqlJs = require('sql.js');

const DB_FILE_PATH = path.join(process.cwd(), 'querypilot.db');

let dbInstance: any = null;
let SQL: any = null;

export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;

  try {
    if (!SQL) {
      SQL = await initSqlJs();
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      const filebuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(filebuffer);
    } else {
      dbInstance = new SQL.Database();
    }

    initializeDatabase(dbInstance!);
    saveDatabase(dbInstance!);

    return dbInstance!;
  } catch (err: any) {
    console.error('CRITICAL ERROR in getDb():', err);
    throw err;
  }
}

function saveDatabase(db: SqlJsDatabase) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database to disk:', err);
  }
}

function initializeDatabase(db: SqlJsDatabase) {
  // Check if users table exists
  try {
    const check = db.exec("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='users'");
    if (check.length > 0 && check[0].values.length > 0 && (check[0].values[0][0] as number) > 0) {
      return;
    }
  } catch (e) {
    // proceed to init
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT NOT NULL,
      order_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Seed Categories
  const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports & Outdoors'];
  categories.forEach(name => {
    db.run('INSERT INTO categories (name) VALUES (?)', [name]);
  });

  // Seed Users
  const users = [
    ['Alex Morgan', 'alex.m@example.com', 'admin', '2024-01-15 08:30:00'],
    ['Sarah Chen', 'sarah.c@example.com', 'customer', '2024-02-01 10:15:00'],
    ['Marcus Vance', 'marcus.v@example.com', 'customer', '2024-02-14 14:20:00'],
    ['Elena Rostova', 'elena.r@example.com', 'customer', '2024-03-05 11:00:00'],
    ['David Kim', 'david.k@example.com', 'customer', '2024-03-12 16:45:00'],
    ['Jessica Taylor', 'jessica.t@example.com', 'customer', '2024-04-02 09:10:00'],
    ['Carlos Mendez', 'carlos.m@example.com', 'customer', '2024-04-18 13:25:00'],
    ['Aisha Patel', 'aisha.p@example.com', 'customer', '2024-05-01 15:30:00'],
    ['Liam O\'Connor', 'liam.o@example.com', 'customer', '2024-05-15 17:00:00'],
    ['Zoe Washington', 'zoe.w@example.com', 'customer', '2024-06-01 12:00:00'],
    ['Michael Scott', 'michael.s@example.com', 'customer', '2024-06-10 10:00:00'],
    ['Pam Beesly', 'pam.b@example.com', 'customer', '2024-06-15 14:30:00']
  ];
  users.forEach(u => db.run('INSERT INTO users (name, email, role, created_at) VALUES (?, ?, ?, ?)', u));

  // Seed Products
  const products = [
    ['Wireless Noise-Canceling Headphones', 1, 299.99, 45, '2024-01-10 09:00:00'],
    ['Ultra-Slim 4K OLED Monitor 27"', 1, 649.50, 18, '2024-01-12 10:00:00'],
    ['Ergonomic Mechanical Keyboard', 1, 129.99, 80, '2024-01-20 11:30:00'],
    ['Merino Wool Premium Hoodie', 2, 89.00, 120, '2024-02-05 14:00:00'],
    ['Waterproof Trail Running Jacket', 2, 145.00, 35, '2024-02-10 15:00:00'],
    ['Smart Espresso Machine Pro', 3, 499.00, 12, '2024-02-28 08:45:00'],
    ['Air Purifier HEPA H13', 3, 179.99, 50, '2024-03-01 09:30:00'],
    ['Designing Data-Intensive Applications', 4, 42.50, 200, '2024-01-05 12:00:00'],
    ['Clean Code: Handbook of Software Craftsmanship', 4, 38.99, 150, '2024-01-08 13:00:00'],
    ['Carbon Fiber Pickleball Paddle Set', 5, 79.95, 65, '2024-03-15 16:10:00'],
    ['Insulated Stainless Steel Flask 32oz', 5, 29.99, 300, '2024-03-20 10:00:00'],
    ['Smart Fitness Watch Ultra', 1, 399.00, 25, '2024-04-01 11:15:00']
  ];
  products.forEach(p => db.run('INSERT INTO products (title, category_id, price, stock, created_at) VALUES (?, ?, ?, ?, ?)', p));

  // Seed Orders
  const orders = [
    [2, 1, 1, 299.99, 'completed', '2024-03-01 10:15:00'],
    [2, 4, 2, 178.00, 'completed', '2024-03-05 14:20:00'],
    [3, 2, 1, 649.50, 'completed', '2024-03-10 11:30:00'],
    [4, 6, 1, 499.00, 'shipped', '2024-03-15 09:00:00'],
    [5, 3, 2, 259.98, 'completed', '2024-03-20 16:45:00'],
    [6, 8, 3, 127.50, 'completed', '2024-04-01 12:10:00'],
    [7, 5, 1, 145.00, 'pending', '2024-04-05 15:30:00'],
    [8, 10, 2, 159.90, 'completed', '2024-04-10 10:00:00'],
    [9, 11, 4, 119.96, 'completed', '2024-04-15 14:20:00'],
    [10, 7, 1, 179.99, 'shipped', '2024-04-20 17:00:00'],
    [2, 12, 1, 399.00, 'completed', '2024-05-01 09:30:00'],
    [3, 9, 1, 38.99, 'completed', '2024-05-05 11:15:00'],
    [4, 1, 2, 599.98, 'completed', '2024-05-10 13:45:00'],
    [5, 4, 1, 89.00, 'cancelled', '2024-05-12 16:00:00'],
    [6, 2, 1, 649.50, 'completed', '2024-05-18 10:30:00'],
    [7, 3, 1, 129.99, 'completed', '2024-05-22 14:00:00'],
    [11, 6, 1, 499.00, 'completed', '2024-06-01 15:20:00'],
    [12, 8, 2, 85.00, 'shipped', '2024-06-05 09:10:00'],
    [2, 11, 2, 59.98, 'completed', '2024-06-10 11:00:00'],
    [3, 12, 1, 399.00, 'pending', '2024-06-15 13:30:00']
  ];
  orders.forEach(o => db.run('INSERT INTO orders (user_id, product_id, quantity, total_price, status, order_date) VALUES (?, ?, ?, ?, ?, ?)', o));
}

export async function getSchemaDDL(): Promise<string> {
  const db = await getDb();
  const res = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  if (res.length === 0) return '';
  return res[0].values.map((v: any) => v[0] as string).join(';\n\n') + ';';
}

export interface TableSchemaInfo {
  tableName: string;
  rowCount: number;
  columns: { name: string; type: string; pk: boolean; nullable: boolean }[];
}

export async function getSchemaExplorerData(): Promise<TableSchemaInfo[]> {
  const db = await getDb();
  const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  if (res.length === 0) return [];

  const tableNames = res[0].values.map((v: any) => v[0] as string);
  
  return tableNames.map((tableName: string) => {
    const countRes = db.exec(`SELECT count(*) as count FROM "${tableName}"`);
    const rowCount = countRes.length > 0 && countRes[0].values.length > 0 ? (countRes[0].values[0][0] as number) : 0;
    
    const infoRes = db.exec(`PRAGMA table_info("${tableName}")`);
    const columns = infoRes.length > 0 ? infoRes[0].values.map((row: any) => ({
      name: String(row[1]),
      type: String(row[2]),
      pk: Boolean(row[5]),
      nullable: !Boolean(row[3])
    })) : [];

    return {
      tableName,
      rowCount,
      columns
    };
  });
}

export function validateQuerySafety(sql: string): { isSafe: boolean; reason?: string } {
  const cleanSql = sql.trim().replace(/^;+/, '').replace(/;+$/, '');
  const forbiddenRegex = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|ATTACH|DETACH|VACUUM|REINDEX|PRAGMA)\b/i;
  
  if (forbiddenRegex.test(cleanSql)) {
    return {
      isSafe: false,
      reason: 'Safety Gate Triggered: Write or structural modification queries (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, etc.) are strictly prohibited.'
    };
  }

  if (!/^(SELECT|WITH)\b/i.test(cleanSql)) {
    return {
      isSafe: false,
      reason: 'Safety Gate Triggered: Query must be a read-only SELECT or WITH statement.'
    };
  }

  return { isSafe: true };
}

export async function validateQuerySyntax(sql: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const db = await getDb();
    const cleanSql = sql.trim().replace(/;+$/, '');
    db.exec(`EXPLAIN QUERY PLAN ${cleanSql}`);
    return { isValid: true };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || 'SQLite Syntax Error'
    };
  }
}

export interface QueryExecutionResult {
  success: boolean;
  sql: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  latencyMs: number;
  targetTables: string[];
  error?: string;
}

export async function executeQuery(sql: string): Promise<QueryExecutionResult> {
  const cleanSql = sql.trim().replace(/;+$/, '');
  const startTime = performance.now();

  try {
    const db = await getDb();
    const result = db.exec(cleanSql);
    const endTime = performance.now();
    const latencyMs = Math.round((endTime - startTime) * 100) / 100;

    if (result.length === 0) {
      return {
        success: true,
        sql: cleanSql,
        columns: [],
        rows: [],
        rowCount: 0,
        latencyMs,
        targetTables: extractTargetTables(cleanSql)
      };
    }

    const colNames = result[0].columns;
    const rawValues = result[0].values;
    
    const rows = rawValues.map((rowVals: any) => {
      const obj: Record<string, any> = {};
      colNames.forEach((col: string, i: number) => {
        obj[col] = rowVals[i];
      });
      return obj;
    });

    return {
      success: true,
      sql: cleanSql,
      columns: colNames,
      rows,
      rowCount: rows.length,
      latencyMs,
      targetTables: extractTargetTables(cleanSql)
    };
  } catch (err: any) {
    const endTime = performance.now();
    return {
      success: false,
      sql: cleanSql,
      columns: [],
      rows: [],
      rowCount: 0,
      latencyMs: Math.round((endTime - startTime) * 100) / 100,
      targetTables: extractTargetTables(cleanSql),
      error: err.message || 'Error executing SQL query'
    };
  }
}

function extractTargetTables(sql: string): string[] {
  const knownTables = ['users', 'products', 'categories', 'orders'];
  return knownTables.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(sql));
}
