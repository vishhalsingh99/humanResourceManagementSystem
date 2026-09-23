import ipaddr from 'ipaddr.js';

const normalizeIp = (ip) => {
  if (!ip) return null;

  ip = String(ip).trim().toLowerCase();

  // Strip a trailing port from forms like "1.2.3.4:5678" that can show up in
  // proxy headers. Do NOT strip ":" from IPv6 addresses.
  if (/^[0-9.]+:[0-9]+$/.test(ip)) {
    ip = ip.split(":")[0];
  }

  if (
    ip.startsWith("::ffff:") &&
    /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip.slice(7))
  ) {
    return ip.slice(7);
  }

  return ip;
};

const isValidIpAddress = (ip) => {
  if (!ip) return false;

  try {
    ipaddr.process(ip);
    return true;
  } catch {
    return false;
  }
};

// True for loopback (127.0.0.1/::1) and private/internal ranges (10.0.0.0/8,
// 172.16.0.0/12, 192.168.0.0/16, link-local, etc). When Express's resolved IP
// falls in one of these ranges it almost always means the request actually
// came from a reverse proxy (Nginx) sitting on the same host/private network,
// and Express's `trust proxy` setting has not been told about it.
const isPrivateOrLoopback = (ip) => {
  if (!ip) return false;
  try {
    const addr = ipaddr.process(String(ip));
    const range = addr.range();
    return [
      "loopback",
      "private",
      "linkLocal",
      "uniqueLocal",
      "unspecified",
    ].includes(range);
  } catch {
    return false;
  }
};

const firstForwardedIp = (headerValue) => {
  if (!headerValue) return null;
  // X-Forwarded-For can be a comma-separated list: "client, proxy1, proxy2"
  const first = String(headerValue).split(",")[0]?.trim();
  return first || null;
};

const getClientIp = (req) => {
  const socketIp = normalizeIp(
    req.socket?.remoteAddress || req.connection?.remoteAddress,
  );
  let ip = normalizeIp(req.ip) || socketIp;

  if (isPrivateOrLoopback(ip)) {
    const realIpHeader = req.headers["x-real-ip"];
    const forwardedHeader = req.headers["x-forwarded-for"];
    const candidate =
      normalizeIp(realIpHeader) ||
      normalizeIp(firstForwardedIp(forwardedHeader));

    if (candidate && isValidIpAddress(candidate)) {
      ip = candidate;
    }
  }

  return ip;
};

/**
 * Diagnostic snapshot of every signal used to resolve the client IP.
 * Intended for admin-only debugging of reverse-proxy IP detection issues —
 * never expose this to regular employees.
 */
const getNetworkDebugInfo = (req) => {
  const socketIp =
    req.socket?.remoteAddress || req.connection?.remoteAddress || null;

  return {
    detectedIp: getClientIp(req),
    reqIp: req.ip || null,
    socketIp,
    forwardedFor: req.headers["x-forwarded-for"] || null,
    realIp: req.headers["x-real-ip"] || null,
    trustProxy: req.app?.get ? req.app.get("trust proxy") : undefined,
  };
};

const isIpInCidr = (clientIp, cidr) => {
  try {
    const addr = ipaddr.process(clientIp);
    const match = ipaddr.process(cidr) || ipaddr.parseCIDR(cidr);

    if (Array.isArray(match)) {
      const [network, prefixLength] = match;
      return (
        addr.kind() === network.kind() && addr.match(network, prefixLength)
      );
    }

    return addr.toString() === match.toString();
  } catch {
    return false;
  }
};

// wifi_allowed_ips is a JSON column — mysql2 normally auto-parses it to an
// array, but tolerate a raw JSON string too so this never silently denies
// everyone due to a driver/config quirk.
const toIpArray = (allowedIps) => {
  if (Array.isArray(allowedIps)) return allowedIps;
  if (typeof allowedIps === "string" && allowedIps.trim()) {
    try {
      const parsed = JSON.parse(allowedIps);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isIpAllowed = (clientIp, allowedIps) => {
  const ipList = toIpArray(allowedIps);
  if (!clientIp || ipList.length === 0) {
    return false;
  }

  const normalizedClientIp = normalizeIp(clientIp);
  if (!normalizedClientIp) return false;

  for (const allowedIp of ipList) {
    const trimmedAllowedIp = String(allowedIp || "").trim();
    if (!trimmedAllowedIp) continue;

    if (isIpInCidr(normalizedClientIp, trimmedAllowedIp)) {
      return true;
    }
  }

  return false;
};

/**
 * Verify that the current request reached the server through an approved
 * office IP. Always resolves the client IP itself via getClientIp(req) —
 * callers must never pass a client-supplied IP in here.
 */
const verifyOfficeNetwork = (req, companySettings = {}) => {
  const clientIp = getClientIp(req);
  const allowedIps = toIpArray(
    companySettings.wifi_allowed_ips ?? companySettings.wifiAllowedIps,
  );

  const result = {
    allowed: false,
    clientIp: normalizeIp(clientIp) || clientIp,
  };

  const wifiEnabled = Boolean(
    companySettings.wifi_enabled ?? companySettings.wifiEnabled,
  );

  if (!wifiEnabled) {
    result.allowed = true;
    result.reason = "Wi-Fi attendance not enabled";
    return result;
  }

  if (allowedIps.length === 0) {
    result.reason = "No office IPs configured";
  } else if (isIpAllowed(clientIp, allowedIps)) {
    result.allowed = true;
  } else {
    result.reason = "Employee is not connected to the approved office network";
  }

  // Temporary diagnostic logging (server-side only) to confirm real-world
  // detected IPs while rolling out office Wi-Fi verification.
  console.log(
    `[OFFICE-NETWORK-CHECK] expected=[${allowedIps.join(", ")}] actual=${result.clientIp} allowed=${result.allowed}`,
  );

  return result;
};

export {
  getClientIp,
  getNetworkDebugInfo,
  normalizeIp,
  isValidIpAddress,
  isPrivateOrLoopback,
  isIpInCidr,
  isIpAllowed,
  verifyOfficeNetwork,
};