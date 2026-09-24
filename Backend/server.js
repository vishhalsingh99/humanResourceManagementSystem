import './config/env.js';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { testConnection, pool } from './config/databases.js';
import { createTables } from './db.js';
import { runMigrations } from './migrations/sql/migrationRunner.js';
import { seedAccount } from './scripts/seedAccount.js';
import { seedDemoData } from './scripts/seedDemoData.js';
import routes from './routes.js';
import pdfRoute from './modules/pdf/pdf.routes.js';
import { rateLimiter, errorHandler, logger } from './middlewares/index.js';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173,http://192.168.1.46:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// `trust proxy` tells Express how many reverse-proxy hops (Nginx, a load
// balancer, etc) sit in front of it so it can safely resolve req.ip from the
// X-Forwarded-For chain. Configurable via TRUST_PROXY so this doesn't silently
// depend on NODE_ENV being set correctly on the server:
//   TRUST_PROXY=false        -> trust nothing, always use the raw socket IP
//   TRUST_PROXY=true         -> trust every hop (only safe if every hop strips
//                                client-supplied X-Forwarded-* headers)
//   TRUST_PROXY=2            -> trust exactly N hops (e.g. CDN + Nginx)
//   TRUST_PROXY=loopback,... -> comma-separated Express proxy addr presets/IPs/CIDRs
//   unset (default)          -> 1, i.e. "exactly one reverse proxy in front"
//                                which matches a single Nginx instance and is
//                                also harmless for direct/local connections.
const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return 1;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
};

app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !isProduction || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

app.use(express.json({
  limit: '5mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '2mb'
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(logger);
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 1000 }));

app.use('/api', routes);
app.use('/api/pdf', pdfRoute);

app.get('/users', (req, res) => {
  res.json({ status: 'ok', message: 'HRMS API is running' });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    await createTables(pool, {
      includeMasterTables: true,
      includeTenantTables: true
    });
    await runMigrations();
    await seedAccount({ initializeSchema: false, logCredentials: false });
    await seedDemoData();

    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
      console.log(`HRMS health check: http://localhost:${PORT}/users`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
