# Office Wi-Fi/Network Attendance Implementation

## Overview
Implemented production-ready office public IP verification for attendance tracking. Employees can check in/out when connected through the company's approved office network via IP verification.

**Key Implementation**: This is **office public IP verification**, NOT Wi-Fi SSID detection. The backend verifies the client's IP address against configured allowed office IPs.

---

## Files Created

### Backend Services
1. **`Backend/services/attendanceNetworkService.js`** (NEW)
   - `getClientIp(req)` - Extract client IP from request, handling reverse proxies and IPv4-mapped IPv6
   - `normalizeIp(ip)` - Normalize IPv4 and IPv6 addresses
   - `isValidIpAddress(ip)` - Validate IP address format
   - `isIpInCidr(clientIp, cidr)` - Check if IP matches CIDR range (supports both exact IP and CIDR notation)
   - `isIpAllowed(clientIp, allowedIps)` - Check if client IP is in allowed list
   - `verifyOfficeNetwork(clientIp, companySettings)` - Main verification function

### Frontend Components
1. **`Frontend/src/api/attendanceApi.js`** (NEW)
   - `getNetworkInfo()` - GET /api/attendance/network-info
   - `employeeCheckIn()` - POST /api/attendance/check-in
   - `employeeCheckOut()` - POST /api/attendance/check-out

2. **`Frontend/src/features/attendance/components/EmployeeAttendanceCard.jsx`** (NEW)
   - Employee-facing attendance card
   - Displays today's attendance status
   - Shows office network connectivity (Wi-Fi icon)
   - Check In/Check Out buttons
   - Displays working hours when checked out
   - Network verification before check-in/out

### Database Migrations
1. **`Backend/migrations/sql/20260911_wifi_attendance_network.sql`** (NEW)
   - Adds `source` column to attendance (VARCHAR(50), default 'manual')
   - Adds `network_ip` column to attendance (VARCHAR(45))
   - Adds `device_info` column to attendance (TEXT)
   - Adds `wifi_allowed_ips` column to company_settings (JSON)
   - Creates indexes on source and network_ip for performance

---

## Files Modified

### Backend

1. **`Backend/package.json`**
   - Added `ipaddr.js@^2.2.0` dependency for IP address parsing and CIDR matching

2. **`Backend/server.js`**
   - Added `app.set('trust proxy', ...)` configuration for correct IP detection behind reverse proxies
   - Supports `TRUST_PROXY` env var and automatically enabled in production

3. **`Backend/db.js`**
   - Added column creation for attendance: `source`, `network_ip`, `device_info`
   - Added column creation for company_settings: `wifi_allowed_ips`
   - Uses idempotent `ALTER TABLE ... IF NOT EXISTS` for multi-tenant safety

4. **`Backend/models/companySettings.js`**
   - Added `wifi_allowed_ips: []` to DEFAULT_SETTINGS
   - Added `normalizeWifiAllowedIps(ips)` function to parse and deduplicate IPs
   - Extended `normalizePayload()` to include wifi_allowed_ips processing
   - Extended `toApiSettings()` to include wifiAllowedIps in API response
   - Updated SQL UPDATE query to include wifi_allowed_ips as JSON

5. **`Backend/controllers/settings.js`**
   - Imported `isValidIpAddress` from attendanceNetworkService
   - Extended `validateCompanySettings()` to validate wifi_allowed_ips:
     - Checks for duplicate IPs
     - Validates each IP using ipaddr.js
     - Supports IPv4, IPv6, and CIDR ranges

6. **`Backend/controllers/attendance.js`**
   - Imported IP verification service and utilities
   - Added `getNetworkInfo()` endpoint - returns current client IP observed by server
   - Added `employeeCheckIn()` endpoint - creates attendance with Wi-Fi verification
   - Added `employeeCheckOut()` endpoint - updates attendance with Wi-Fi verification
   - Modified `createAttendance()` (admin) to always set source='manual' for backward compatibility
   - All new endpoints return proper HTTP status codes (201 for creation, 403 for network denial, 409 for conflicts)

7. **`Backend/routes/attendance.js`**
   - Added GET `/network-info` route (no auth required, using middleware from routes.js)
   - Added POST `/check-in` route (auth required)
   - Added POST `/check-out` route (auth required)
   - Routes placed before parameterized routes to avoid conflicts

### Frontend

1. **`Frontend/src/pages/Settings/Settings.jsx`**
   - Imported `X` icon and `getNetworkInfo` API function
   - Added `wifiAllowedIps: []` to defaultSettings
   - Added state variables: `newIp`, `detectingIp`
   - Added handler functions:
     - `handleDetectCurrentIp()` - Calls getNetworkInfo to detect server-side IP
     - `handleAddIp()` - Validates and adds IP to allowed list
     - `handleRemoveIp(ip)` - Removes IP from allowed list
   - Added Wi-Fi configuration UI section (shows when wifiEnabled is true):
     - Input field for entering IPs
     - "Detect IP" button
     - "Add IP" button
     - Display of configured IPs as removable chips

---

## Database Changes

### Attendance Table (all tenant databases)
```sql
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS network_ip VARCHAR(45);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_info TEXT;
CREATE INDEX idx_attendance_source ON attendance(source);
CREATE INDEX idx_attendance_network_ip ON attendance(network_ip);
```

### Company Settings Table (all tenant databases)
```sql
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS wifi_allowed_ips JSON DEFAULT NULL;
```

---

## API Endpoints

### Network Information
**GET** `/api/attendance/network-info`
- Authentication: Required
- Returns: `{ success: true, ip: "103.120.45.10" }`
- Purpose: Frontend uses this to detect current office IP for configuration

### Employee Check-In
**POST** `/api/attendance/check-in`
- Authentication: Required (from JWT token)
- Body: None required
- Returns (201): 
  ```json
  {
    "success": true,
    "message": "Attendance checked in successfully",
    "attendance": { ... }
  }
  ```
- Error (403): Network verification failed
- Error (409): Already checked in today
- Stores: check_in time, source='wifi', network_ip (client's IP from server perspective)

### Employee Check-Out
**POST** `/api/attendance/check-out`
- Authentication: Required (from JWT token)
- Body: None required
- Returns (200):
  ```json
  {
    "success": true,
    "message": "Attendance checked out successfully",
    "attendance": { ... }
  }
  ```
- Error (400): No check-in found for today
- Error (403): Network verification failed
- Error (409): Already checked out today
- Stores: check_out time, updates network_ip

---

## Configuration

### Environment Variables
```
TRUST_PROXY=true           # Enable in production (auto-enabled)
```

### Nginx Configuration Example (if using reverse proxy)
```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
```

### AWS Load Balancer
Express automatically trusts the load balancer when `app.set('trust proxy', 1)` is set in production.

---

## Security Features

1. **Server-Side IP Verification Only**
   - Client cannot manipulate or spoof the verified IP
   - IP is detected by Express from actual request

2. **Reverse Proxy Support**
   - Correctly handles X-Forwarded-For headers
   - Won't accept arbitrary X-Forwarded-For from public internet
   - Uses `trust proxy` to safely extract IP

3. **Tenant Isolation**
   - Each company has separate allowed IPs via company_settings
   - No cross-tenant data access
   - Employee ID comes from authenticated JWT, not user input

4. **IP Validation**
   - Uses ipaddr.js library for proper IP parsing
   - Supports IPv4, IPv6, and CIDR ranges
   - Deduplicates configured IPs
   - Rejects invalid IP formats

5. **Rate Limiting**
   - Existing rateLimiter middleware applies to all routes
   - Attendance endpoints subject to same limits as other API routes

---

## Attendance Record Structure

When employee checks in/out via Wi-Fi:
```sql
INSERT INTO attendance (
  employee_id,
  date,
  check_in,        -- HH:MM:SS format
  check_out,       -- NULL until checkout
  status,          -- Calculated based on times
  source,          -- 'wifi' for network attendance, 'manual' for admin
  network_ip,      -- Normalized IP address
  device_info,     -- NULL (future expansion)
  created_at,
  updated_at
) VALUES (...)
```

---

## Multi-Tenant Deployment

### Migration Execution
1. Migrations run automatically on server startup via `db.js` for all active tenant databases
2. Migration runner (`Backend/migrations/sql/migrationRunner.js`) fetches list of tenant databases
3. Each migration is tracked in the `migrations` table per database
4. Migrations are idempotent (safe to run multiple times)

### Tenant Configuration
Each company has independent `wifi_allowed_ips` configuration stored in their company_settings:
```json
{
  "wifi_enabled": true,
  "wifi_allowed_ips": [
    "103.120.45.10",
    "103.120.45.11",
    "203.0.113.0/24"  // CIDR range supported
  ]
}
```

---

## IP Address Support

### IPv4
- Exact match: `192.168.1.100`
- CIDR range: `192.168.1.0/24`

### IPv6
- Full address: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
- CIDR range: `2001:db8:85a3::/48`

### IPv4-Mapped IPv6
- Format: `::ffff:192.168.1.100`
- Automatically normalized to `192.168.1.100`

---

## Payroll Compatibility

✅ **Fully Compatible**
- Wi-Fi attendance creates same attendance records as other methods
- Payroll system queries attendance table without filtering by source
- Salary calculations work identically regardless of attendance source
- Existing payroll, leave, and attendance reports unaffected

---

## Feature Flags and Backward Compatibility

### Existing Attendance Methods
- Fingerprint attendance: No changes, continues to work
- Camera attendance: No changes, continues to work
- Manual admin attendance: Continues to work, sets source='manual'

### Behavior
- If `wifi_enabled = false`: No IP verification required
- If `wifi_enabled = true` AND employee checks in: IP must match configured IPs
- If `wifi_enabled = true` AND admin manually marks: No IP verification (admin can override)

---

## Testing Checklist

### Backend Tests
- [x] ipaddr.js library handles IPv4, IPv6, CIDR
- [x] getClientIp() works with direct and proxied requests
- [x] verifyOfficeNetwork() returns correct allowed/denied
- [x] Duplicate attendance prevention (409)
- [x] Network verification failure (403)
- [x] Checkout without check-in (400)

### Frontend Tests
- [x] Settings page loads wifi configuration
- [x] Add IP validates and deduplicates
- [x] Detect IP button calls API and displays result
- [x] Remove IP button deletes from list
- [x] Attendance card shows network status
- [x] Check In button calls API
- [x] Check Out button calls API
- [x] Proper error messages on network failure

### Database Tests
- [x] Migration creates new columns
- [x] Migration handles multiple runs (idempotent)
- [x] Existing attendance records unaffected
- [x] Payroll calculations work correctly

---

## Deployment Steps

### 1. Pre-Deployment (Optional)
```bash
npm install --save ipaddr.js   # Already included in package.json
```

### 2. Deploy Code
- Deploy backend changes (new endpoints, new controller functions)
- Deploy frontend changes (new component, updated settings page)
- Deploy new service file: `attendanceNetworkService.js`

### 3. Database Migration
- Automatic: Migrations run on server startup for all tenant databases
- Manual (if needed): `node Backend/migrations/sql/migrationRunner.js`

### 4. Configuration
- Enable Wi-Fi attendance in company settings (if desired)
- Configure office IP addresses via settings page or API

### 5. Verification
- Test `/api/attendance/network-info` endpoint
- Test check-in from office network
- Test check-in from outside office network (should fail)
- Verify attendance records have source='wifi' and network_ip set

---

## Monitoring & Logging

### What to Monitor
- Check logs for IP detection issues
- Monitor attendance creation rate
- Track network verification failures (403 responses)

### Audit Trail
- Each attendance record stores:
  - `source`: 'wifi' or 'manual'
  - `network_ip`: Client IP that was verified
  - `created_at`: When attendance was recorded
  - `updated_at`: Last modification time

---

## Known Limitations

1. **IP Ranges**: Public dynamic IPs from ISPs may change. Use CIDR ranges or have employees update settings if IP changes.

2. **VPN/Proxy**: If office network is accessed via VPN, the VPN's exit IP must be configured, not the employee's home ISP IP.

3. **Multiple Offices**: To support multiple office locations, add all office public IPs to the allowed list.

4. **Network Changes**: If office ISP changes the public IP, update the configuration before attendance stops working.

---

## Future Enhancements

- [ ] Geofencing as additional verification layer
- [ ] Device fingerprinting (user-agent, device ID)
- [ ] Network quality metrics (latency, jitter)
- [ ] Time-based restrictions (office hours only)
- [ ] Audit log dashboard with IP access history

---

## Support & Troubleshooting

### Employee Cannot Check In (403 Error)
**Cause**: Employee is not on configured office network
**Solution**: 
1. Have employee contact IT to get office public IP
2. Configure the IP in company settings
3. Employee can use VPN to office network if allowed

### Incorrect IP Detected
**Cause**: Reverse proxy not configured correctly
**Solution**:
1. Check `TRUST_PROXY` environment variable
2. Ensure Nginx/Load Balancer is sending X-Forwarded-For header
3. Verify reverse proxy configuration

### "Attendance already marked" Error
**Cause**: Employee already checked in today
**Solution**: Employee must check out first, or admin can edit/delete the record

### IPv6 Not Working
**Cause**: IPv6 address format not normalized
**Solution**: System automatically normalizes IPv4-mapped IPv6 (::ffff:x.x.x.x to x.x.x.x)
