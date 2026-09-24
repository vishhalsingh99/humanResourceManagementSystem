const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;

export const startKeepAlive = (url = process.env.KEEPALIVE_URL) => {
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
