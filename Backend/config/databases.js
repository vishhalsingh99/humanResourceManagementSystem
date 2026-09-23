// Backend/config/databases.js
import './env.js';
import mysql from 'mysql2/promise';
import { AsyncLocalStorage } from 'async_hooks';

// Database configuration - using MySQL
// Update these values according to your database settings
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Sahil@123',
  database: process.env.DB_NAME || 'hrsystem',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Ensures that DATE and DATETIME values are returned as strings
};

const tenantStorage = new AsyncLocalStorage();
const tenantPools = new Map();
const masterPool = mysql.createPool(dbConfig);

const createPoolForDatabase = (database) => mysql.createPool({
  ...dbConfig,
  database
});

const getTenantPool = (database) => {
  if (!database) return masterPool;

  if (!tenantPools.has(database)) {
    tenantPools.set(database, createPoolForDatabase(database));
  }

  return tenantPools.get(database);
};

const getActivePool = () => {
  const tenantDatabase = tenantStorage.getStore()?.tenantDatabase;
  return tenantDatabase ? getTenantPool(tenantDatabase) : masterPool;
};

const pool = {
  execute: (...args) => getActivePool().execute(...args),
  query: (...args) => getActivePool().query(...args),
  getConnection: (...args) => getActivePool().getConnection(...args)
};

const withTenantDatabase = (tenantDatabase, callback) => {
  if (!tenantDatabase) return callback();
  return tenantStorage.run({ tenantDatabase }, callback);
};

const createTenantDatabaseName = (companyName, adminId) => {
  const slug = String(companyName || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'company';

  return `${process.env.TENANT_DB_PREFIX || 'hrsystem'}_${slug}_${adminId}`;
};

const createTenantDatabase = async (databaseName) => {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error('Invalid tenant database name');
  }

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password
  });

  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [databaseName]);

   // Grant access to app user and cPanel user for phpMyAdmin visibility
    // await connection.query(`GRANT ALL PRIVILEGES ON \`${databaseName}\`.* TO 'adonee_user'@'localhost'`);
    // await connection.query(`GRANT ALL PRIVILEGES ON \`${databaseName}\`.* TO 'adonee'@'localhost'`);
    // await connection.query('FLUSH PRIVILEGES');

  } finally {
    await connection.end(); 
  }

  return getTenantPool(databaseName);
};

// Test connection
const testConnection = async () => {
  try {
    const connection = await masterPool.getConnection();
    console.log('✓ Database connection established successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

export {
  dbConfig,
  pool,
  masterPool,
  testConnection,
  getTenantPool,
  withTenantDatabase,
  createTenantDatabaseName,
  createTenantDatabase
};