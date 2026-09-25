const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;

// Render auto-injects RENDER_EXTERNAL_URL on every web service, so self-pinging works out
// of the box with no dashboard configuration. KEEPALIVE_URL can still override it (e.g. to
// ping a custom domain instead of the *.onrender.com one).
const defaultKeepAliveUrl = () => {
  if (process.env.KEEPALIVE_URL) return process.env.KEEPALIVE_URL;
  if (process.env.RENDER_EXTERNAL_URL) return `${process.env.RENDER_EXTERNAL_URL}/users`;
  return null;
};

export const startKeepAlive = (url = defaultKeepAliveUrl()) => {
  if (!url) return null;

  const ping = async () => {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'HRMS-KeepAlive/1.0' } });
      console.log(`Keep-alive ping: ${response.status}`);
    } catch (error) {
      console.warn(`Keep-alive ping failed: ${error.message}`);
    }
  };

  const interval = setInterval(ping, KEEP_ALIVE_INTERVAL_MS);
  interval.unref();
  console.log(`Keep-alive enabled: ${url} every 5 minutes`);
  return interval;
};
