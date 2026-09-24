import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import {
  dbConfig,
  masterPool,
} from "../../config/databases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const masterMigrationsDir = path.resolve(__dirname, "../master");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const migrationsDir = __dirname;
// If your SQL files are inside a sql folder, use:
// const migrationsDir = path.join(__dirname, "sql");

export async function migrateDatabase(tenantPool, databaseName, migrationDirectories = [masterMigrationsDir, __dirname]) {
  console.log(`\n📦 Migrating Database: ${databaseName}`);

  // Create migration history table
  await tenantPool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(191) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = migrationDirectories.flatMap((directory) => fs
    .readdirSync(directory)
    .filter(file => file.endsWith(".sql"))
    .sort()
    .map(file => ({ file, path: path.join(directory, file) })));

  if (!files.length) {
    console.log("📄 No migration files found.");
    return;
  }

  for (const file of files) {
    const filename = file.file;
    const [executed] = await tenantPool.query(
      "SELECT id FROM migrations WHERE filename = ?",
      [filename]
    );

    if (executed.length > 0) {
      console.log(`⏩ Skipped: ${filename}`);
      continue;
    }

    console.log(`🚀 Running: ${filename}`);

    const sql = fs.readFileSync(file.path, "utf8");

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
        [filename]
      );

      await connection.commit();

      console.log(`✅ Completed: ${filename}`);
    } catch (err) {
      await connection.rollback();

      console.error(`❌ Failed: ${filename}`);
      console.error(err.sqlMessage || err.message);

      throw err;
    } finally {
      connection.release();
    }
  }
}

export async function runMigrations() {
  console.log(`🔍 Migrating configured database: ${dbConfig.database}`);
  await migrateDatabase(masterPool, dbConfig.database);
  console.log("\n🎉 Database migrations completed successfully.");
}

if (process.argv[1] === __filename) {
  runMigrations().catch((error) => {
    console.error("\n❌ Migration Runner Error");
    console.error(error);
    process.exitCode = 1;
  });
}

export default runMigrations;