# Deployment

## Backend on Render

Create the service from `render.yaml`, or configure a Render Web Service with:

- Root directory: `Backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/users`

Set the variables listed in `Backend/.env.example`. The backend creates tables, runs pending migrations, and upserts the configured seed account before listening. Use a persistent MySQL-compatible database; Render's local filesystem is ephemeral, so uploaded files under `Backend/uploads` are not durable across deploys.

Set `FRONTEND_URLS` to the exact Vercel origin, for example `https://hrms.example.com`, without a trailing slash.

## Frontend on Vercel

Create a Vercel project with the `Frontend` directory as its root directory. Vercel detects Vite automatically. Set:

```text
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_API_URL=https://your-backend.onrender.com/api
```

`Frontend/vercel.json` handles client-side route fallback. Redeploy after changing either public Vite variable because they are embedded at build time.