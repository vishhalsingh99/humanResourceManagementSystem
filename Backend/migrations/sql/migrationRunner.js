import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import {
  masterPool,
  getTenantPool,
} from "../../config/databases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const migrationsDir = __dirname;
// If your SQL files are inside a sql folder, use:
// const migrationsDir = path.join(__dirname, "sql");

async function migrateDatabase(tenantPool, databaseName) {
  console.log(`\n📦 Migrating Database: ${databaseName}`);

  // Create migration history table
  await tenantPool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(191) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith(".sql"))
    .sort();

  if (!files.length) {
    console.log("📄 No migration files found.");
    return;
  }

  for (const file of files) {
    const [executed] = await tenantPool.query(
      "SELECT id FROM migrations WHERE filename = ?",
      [file]
    );

    if (executed.length > 0) {
      console.log(`⏩ Skipped: ${file}`);
      continue;
    }

    console.log(`🚀 Running: ${file}`);

    const sql = fs.readFileSync(
      path.join(migrationsDir, file),
      "utf8"
    );

    const connection = await tenantPool.getConnection();

    try {
      await connection.beginTransaction();

      // Execute each SQL statement
      // Execute each SQL statement
const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  try {
    await connection.query(statement);
  } catch (err) {

    // Ignore duplicate column/table/index errors
    if (
      err.code === "ER_DUP_FIELDNAME" ||
      err.code === "ER_TABLE_EXISTS_ERROR" ||
      err.code === "ER_DUP_KEYNAME"
    ) {
      console.log(`⚠️ ${err.sqlMessage}`);
      continue;
    }

    throw err;
  }
}

      await connection.query(
        "INSERT INTO migrations (filename) VALUES (?)",
        [file]
      );

      await connection.commit();

      console.log(`✅ Completed: ${file}`);
    } catch (err) {
      await connection.rollback();

      console.error(`❌ Failed: ${file}`);
      console.error(err.sqlMessage || err.message);

      throw err;
    } finally {
      connection.release();
    }
  }
}

async function runMigrations() {
  try {
    console.log("🔍 Fetching tenant databases...");

    const [tenants] = await masterPool.query(`
      SELECT database_name
      FROM tenants
      WHERE status = 'active'
        AND database_name IS NOT NULL
    `);

    if (!tenants.length) {
      console.log("⚠️ No tenant databases found.");
      return;
    }

    console.log(`✅ Found ${tenants.length} tenant database(s).\n`);

    for (const tenant of tenants) {
      const databaseName = tenant.database_name;

      const tenantPool = getTenantPool(databaseName);

      await migrateDatabase(
        tenantPool,
        databaseName
      );
    }

    console.log("\n🎉 All tenant migrations completed successfully.");
  } catch (err) {
    console.error("\n❌ Migration Runner Error");
    console.error(err);

    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  runMigrations();
}

export default runMigrations;