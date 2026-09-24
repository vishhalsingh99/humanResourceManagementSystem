// Backend/config/databases.js
import './env.js';
import mysql from 'mysql2/promise';

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

const masterPool = mysql.createPool(dbConfig);

const getTenantPool = () => masterPool;

const getActivePool = () => masterPool;

const pool = {
  execute: (...args) => getActivePool().execute(...args),
  query: (...args) => getActivePool().query(...args),
  getConnection: (...args) => getActivePool().getConnection(...args)
};

const withTenantDatabase = (tenantDatabase, callback) => {
  return callback();
};

const createTenantDatabaseName = () => dbConfig.database;

const createTenantDatabase = async (databaseName) => {
  return masterPool;
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