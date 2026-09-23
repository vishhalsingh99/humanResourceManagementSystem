// Side-effect-only module: loads Backend/.env before any other module reads
// process.env. Import this as the FIRST import in any file that reads env
// vars at module-evaluation time (top-level, not inside a function) --
// ESM hoists and evaluates dependency modules before the importing file's own
// body runs, so a plain `dotenv.config()` call in server.js is too late to
// affect modules it transitively imports (e.g. config/databases.js).
// Resolved relative to this file (not process.cwd()) so it works regardless
// of the directory the process was launched from.
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
