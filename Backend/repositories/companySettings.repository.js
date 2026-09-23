import { pool } from '../config/databases.js';

const DEFAULT_SETTINGS = {
  office_start_time: '09:30:00',
  office_end_time: '18:30:00',
  grace_time: 10,
  half_day_after: '13:30:00',
  minimum_work_hours: 8,
  week_off: 'Sunday',
  break_start: '13:00:00',
  break_end: '14:00:00',
  short_leave_time: 2,
  short_leave_enabled: false,
  short_leave_duration_hours: 1,
  short_leaves_for_half_day: 3,
  short_leave_reset_period: 'Monthly',
  paid_leave_days: 1,
  enable_paid_leave: true,
  monthly_paid_leave_credit: 1,
  absent_can_use_paid_leave: false,
  carry_forward_enabled: true,
  maximum_carry_forward_days: null,
  paid_leave_expiry: 'NEVER',
  approved_leave_is_paid: true,
  paid_leave_can_cover_half_day: true,
  half_day_deduction_percent: 50,
  unpaid_leave_deduction_percent: 100,
  absent_deduction_percent: 100,
  half_day_enabled: true,
  half_day_paid_percentage: 50,
  one_paid_leave_covers_half_days: 2,
  attendance_type: 'Multiple',
  wifi_enabled: false,
  wifi_allowed_ips: [],
  fingerprint_enabled: false,
  camera_enabled: false,
  sandwich_leave_enabled: false,
};

const toTime = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim();
  return normalized.length === 5 ? `${normalized}:00` : normalized;
};

const toApiTime = (value) => (value ? String(value).slice(0, 5) : '');

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  return Boolean(value);
};

const normalizeWifiAllowedIps = (ips) => {
  if (!ips) return [];
  const parsed = Array.isArray(ips) ? ips : (typeof ips === 'string' ? JSON.parse(ips) : []);
  return parsed
    .map((ip) => String(ip || '').trim())
    .filter((ip) => ip.length > 0)
    .filter((ip, idx, arr) => arr.indexOf(ip) === idx);
};

const normalizePayload = (settings = {}) => ({
  office_start_time: toTime(settings.office_start_time ?? settings.officeStartTime, DEFAULT_SETTINGS.office_start_time),
  office_end_time: toTime(settings.office_end_time ?? settings.officeEndTime, DEFAULT_SETTINGS.office_end_time),
  grace_time: Number(settings.grace_time ?? settings.graceTime ?? DEFAULT_SETTINGS.grace_time),
  half_day_after: toTime(settings.half_day_after ?? settings.halfDayAfter, DEFAULT_SETTINGS.half_day_after),
  minimum_work_hours: Number(settings.minimum_work_hours ?? settings.minimumWorkHours ?? DEFAULT_SETTINGS.minimum_work_hours),
  week_off: settings.week_off ?? settings.weekOff ?? DEFAULT_SETTINGS.week_off,
  break_start: toTime(settings.break_start ?? settings.breakStart, DEFAULT_SETTINGS.break_start),
  break_end: toTime(settings.break_end ?? settings.breakEnd, DEFAULT_SETTINGS.break_end),
  short_leave_time: Number(settings.short_leave_time ?? settings.shortLeaveTime ?? DEFAULT_SETTINGS.short_leave_time),
  short_leave_enabled: toBoolean(settings.short_leave_enabled ?? settings.shortLeaveEnabled ?? DEFAULT_SETTINGS.short_leave_enabled),
  short_leave_duration_hours: Number(settings.short_leave_duration_hours ?? settings.shortLeaveDurationHours ?? DEFAULT_SETTINGS.short_leave_duration_hours),
  short_leaves_for_half_day: Number(settings.short_leave_limit ?? settings.monthly_short_leave_limit ?? settings.monthlyShortLeaveLimit ?? settings.short_leaves_for_half_day ?? settings.shortLeavesForHalfDay ?? DEFAULT_SETTINGS.short_leaves_for_half_day),
  short_leave_reset_period: settings.short_leave_reset_period ?? settings.shortLeaveResetPeriod ?? DEFAULT_SETTINGS.short_leave_reset_period,
  paid_leave_days: Number(settings.paid_leave_days ?? settings.paidLeaveDays ?? DEFAULT_SETTINGS.paid_leave_days),
  enable_paid_leave: toBoolean(settings.enable_paid_leave ?? settings.enablePaidLeave ?? DEFAULT_SETTINGS.enable_paid_leave),
  monthly_paid_leave_credit: Number(settings.monthly_paid_leave_credit ?? settings.monthlyPaidLeaveCredit ?? settings.paid_leave_days ?? DEFAULT_SETTINGS.monthly_paid_leave_credit),
  absent_can_use_paid_leave: toBoolean(settings.absent_can_use_paid_leave ?? settings.absentCanUsePaidLeave ?? DEFAULT_SETTINGS.absent_can_use_paid_leave),
  carry_forward_enabled: toBoolean(settings.carry_forward_enabled ?? settings.carryForwardEnabled ?? DEFAULT_SETTINGS.carry_forward_enabled),
  maximum_carry_forward_days: settings.maximum_carry_forward_days ?? settings.maximumCarryForwardDays ?? DEFAULT_SETTINGS.maximum_carry_forward_days,
  paid_leave_expiry: settings.paid_leave_expiry ?? settings.paidLeaveExpiry ?? DEFAULT_SETTINGS.paid_leave_expiry,
  approved_leave_is_paid: toBoolean(settings.approved_leave_is_paid ?? settings.approvedLeaveIsPaid ?? DEFAULT_SETTINGS.approved_leave_is_paid),
  paid_leave_can_cover_half_day: toBoolean(settings.paid_leave_can_cover_half_day ?? settings.paidLeaveCanCoverHalfDay ?? DEFAULT_SETTINGS.paid_leave_can_cover_half_day),
  half_day_deduction_percent: Number(settings.half_day_deduction_percent ?? settings.halfDayDeductionPercent ?? DEFAULT_SETTINGS.half_day_deduction_percent),
  unpaid_leave_deduction_percent: Number(settings.unpaid_leave_deduction_percent ?? settings.unpaidLeaveDeductionPercent ?? DEFAULT_SETTINGS.unpaid_leave_deduction_percent),
  absent_deduction_percent: Number(settings.absent_deduction_percent ?? settings.absentDeductionPercent ?? DEFAULT_SETTINGS.absent_deduction_percent),
  half_day_enabled: toBoolean(settings.half_day_enabled ?? settings.halfDayEnabled ?? DEFAULT_SETTINGS.half_day_enabled),
  half_day_paid_percentage: Number(settings.half_day_paid_percentage ?? settings.halfDayPaidPercentage ?? DEFAULT_SETTINGS.half_day_paid_percentage),
  one_paid_leave_covers_half_days: Number(settings.one_paid_leave_covers_half_days ?? settings.onePaidLeaveCoversHalfDays ?? DEFAULT_SETTINGS.one_paid_leave_covers_half_days),
  attendance_type: settings.attendance_type ?? settings.attendanceType ?? DEFAULT_SETTINGS.attendance_type,
  wifi_enabled: toBoolean(settings.wifi_enabled ?? settings.wifiEnabled ?? DEFAULT_SETTINGS.wifi_enabled),
  wifi_allowed_ips: normalizeWifiAllowedIps(settings.wifi_allowed_ips ?? settings.wifiAllowedIps),
  fingerprint_enabled: toBoolean(settings.fingerprint_enabled ?? settings.fingerprintEnabled ?? DEFAULT_SETTINGS.fingerprint_enabled),
  camera_enabled: toBoolean(settings.camera_enabled ?? settings.cameraEnabled ?? DEFAULT_SETTINGS.camera_enabled),
  sandwich_leave_enabled: toBoolean(settings.sandwich_leave_enabled ?? settings.sandwichLeaveEnabled ?? DEFAULT_SETTINGS.sandwich_leave_enabled),
});

const getMonthlyShortLeaveLimit = (settings = {}) => Number(
  settings.monthly_short_leave_limit
  ?? settings.monthlyShortLeaveLimit
  ?? settings.short_leave_limit
  ?? settings.short_leaves_for_half_day
  ?? settings.shortLeavesForHalfDay
  ?? 0
);

const toApiSettings = (settings = {}) => ({
  id: settings.id,
  officeStartTime: toApiTime(settings.office_start_time),
  officeEndTime: toApiTime(settings.office_end_time),
  graceTime: Number(settings.grace_time ?? 0),
  halfDayAfter: toApiTime(settings.half_day_after),
  minimumWorkHours: Number(settings.minimum_work_hours ?? 0),
  weekOff: settings.week_off || '',
  breakStart: toApiTime(settings.break_start),
  breakEnd: toApiTime(settings.break_end),
  shortLeaveTime: Number(settings.short_leave_time ?? 0),
  shortLeaveEnabled: Boolean(settings.short_leave_enabled),
  shortLeaveDurationHours: Number(settings.short_leave_duration_hours ?? 0),
  shortLeavesForHalfDay: getMonthlyShortLeaveLimit(settings),
  monthlyShortLeaveLimit: getMonthlyShortLeaveLimit(settings),
  shortLeaveResetPeriod: settings.short_leave_reset_period || 'Monthly',
  paidLeaveDays: Number(settings.paid_leave_days ?? 0),
  enablePaidLeave: toBoolean(settings.enable_paid_leave ?? settings.enablePaidLeave ?? true),
  monthlyPaidLeaveCredit: Number(settings.monthly_paid_leave_credit ?? settings.monthlyPaidLeaveCredit ?? settings.paid_leave_days ?? 1),
  absentCanUsePaidLeave: toBoolean(settings.absent_can_use_paid_leave ?? settings.absentCanUsePaidLeave ?? false),
  carryForwardEnabled: toBoolean(settings.carry_forward_enabled ?? settings.carryForwardEnabled ?? true),
  maximumCarryForwardDays: settings.maximum_carry_forward_days ?? settings.maximumCarryForwardDays ?? null,
  paidLeaveExpiry: settings.paid_leave_expiry ?? settings.paidLeaveExpiry ?? 'NEVER',
  approvedLeaveIsPaid: toBoolean(settings.approved_leave_is_paid ?? settings.approvedLeaveIsPaid ?? true),
  paidLeaveCanCoverHalfDay: toBoolean(settings.paid_leave_can_cover_half_day ?? settings.paidLeaveCanCoverHalfDay ?? true),
  halfDayDeductionPercent: Number(settings.half_day_deduction_percent ?? settings.halfDayDeductionPercent ?? 50),
  unpaidLeaveDeductionPercent: Number(settings.unpaid_leave_deduction_percent ?? settings.unpaidLeaveDeductionPercent ?? 100),
  absentDeductionPercent: Number(settings.absent_deduction_percent ?? settings.absentDeductionPercent ?? 100),
  halfDayEnabled: toBoolean(settings.half_day_enabled ?? settings.halfDayEnabled ?? true),
  halfDayPaidPercentage: Number(settings.half_day_paid_percentage ?? settings.halfDayPaidPercentage ?? 50),
  onePaidLeaveCoversHalfDays: Number(settings.one_paid_leave_covers_half_days ?? settings.onePaidLeaveCoversHalfDays ?? 2),
  attendanceType: settings.attendance_type || 'Multiple',
  wifiEnabled: Boolean(settings.wifi_enabled),
  wifiAllowedIps: normalizeWifiAllowedIps(settings.wifi_allowed_ips),
  fingerprintEnabled: Boolean(settings.fingerprint_enabled),
  cameraEnabled: Boolean(settings.camera_enabled),
  sandwichLeaveEnabled: Boolean(settings.sandwich_leave_enabled),
  createdAt: settings.created_at,
  updatedAt: settings.updated_at,
});

const toPolicy = (row = {}) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  isPublished: Boolean(row.is_published),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRule = (row = {}) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class CompanySettings {
  static async addColumnIfMissing(tableName, columnName, definition) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE()
         AND table_name = ?
         AND column_name = ?`,
      [tableName, columnName]
    );

    if (Number(rows[0]?.count || 0) === 0) {
      await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
    }
  }

  static async ensureDefault() {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS company_settings (
        id INT PRIMARY KEY DEFAULT 1,
        office_start_time TIME NOT NULL DEFAULT '09:30:00',
        office_end_time TIME NOT NULL DEFAULT '18:30:00',
        grace_time INT NOT NULL DEFAULT 10,
        half_day_after TIME NOT NULL DEFAULT '13:30:00',
        minimum_work_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
        week_off VARCHAR(50) NOT NULL DEFAULT 'Sunday',
        break_start TIME NULL DEFAULT '13:00:00',
        break_end TIME NULL DEFAULT '14:00:00',
        short_leave_time INT NULL DEFAULT 2,
        short_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        short_leave_duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.00,
        short_leaves_for_half_day INT NOT NULL DEFAULT 3,
        short_leave_reset_period ENUM('Monthly', 'Yearly') NOT NULL DEFAULT 'Monthly',
        paid_leave_days INT NULL DEFAULT 1,
        attendance_type ENUM('Wi-Fi', 'Fingerprint', 'Camera', 'Multiple') NOT NULL DEFAULT 'Multiple',
        wifi_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        fingerprint_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        camera_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        sandwich_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    await this.addColumnIfMissing('company_settings', 'office_start_time', "office_start_time TIME NOT NULL DEFAULT '09:30:00'");
    await this.addColumnIfMissing('company_settings', 'office_end_time', "office_end_time TIME NOT NULL DEFAULT '18:30:00'");
    await this.addColumnIfMissing('company_settings', 'grace_time', 'grace_time INT NOT NULL DEFAULT 10');
    await this.addColumnIfMissing('company_settings', 'half_day_after', "half_day_after TIME NOT NULL DEFAULT '13:30:00'");
    await this.addColumnIfMissing('company_settings', 'minimum_work_hours', 'minimum_work_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00');
    await this.addColumnIfMissing('company_settings', 'week_off', "week_off VARCHAR(50) NOT NULL DEFAULT 'Sunday'");
    await this.addColumnIfMissing('company_settings', 'break_start', "break_start TIME NULL DEFAULT '13:00:00'");
    await this.addColumnIfMissing('company_settings', 'break_end', "break_end TIME NULL DEFAULT '14:00:00'");
    await this.addColumnIfMissing('company_settings', 'short_leave_time', 'short_leave_time INT NULL DEFAULT 2');
    await this.addColumnIfMissing('company_settings', 'short_leave_enabled', 'short_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    await this.addColumnIfMissing('company_settings', 'short_leave_duration_hours', 'short_leave_duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.00');
    await this.addColumnIfMissing('company_settings', 'short_leaves_for_half_day', 'short_leaves_for_half_day INT NOT NULL DEFAULT 3');
    await this.addColumnIfMissing('company_settings', 'short_leave_reset_period', "short_leave_reset_period ENUM('Monthly', 'Yearly') NOT NULL DEFAULT 'Monthly'");
    await this.addColumnIfMissing('company_settings', 'paid_leave_days', 'paid_leave_days INT NULL DEFAULT 1');
    await this.addColumnIfMissing('company_settings', 'enable_paid_leave', 'enable_paid_leave BOOLEAN NOT NULL DEFAULT TRUE');
    await this.addColumnIfMissing('company_settings', 'absent_can_use_paid_leave', 'absent_can_use_paid_leave BOOLEAN NOT NULL DEFAULT FALSE');
    await this.addColumnIfMissing('company_settings', 'monthly_paid_leave_credit', 'monthly_paid_leave_credit DECIMAL(8,2) NOT NULL DEFAULT 1');
    await this.addColumnIfMissing('company_settings', 'carry_forward_enabled', 'carry_forward_enabled BOOLEAN NOT NULL DEFAULT TRUE');
    await this.addColumnIfMissing('company_settings', 'maximum_carry_forward_days', 'maximum_carry_forward_days DECIMAL(8,2) NULL');
    await this.addColumnIfMissing('company_settings', 'paid_leave_expiry', "paid_leave_expiry ENUM('NEVER', 'MONTHLY', 'FINANCIAL_YEAR', 'CUSTOM') NOT NULL DEFAULT 'NEVER'");
    await this.addColumnIfMissing('company_settings', 'approved_leave_is_paid', 'approved_leave_is_paid BOOLEAN NOT NULL DEFAULT TRUE');
    await this.addColumnIfMissing('company_settings', 'paid_leave_can_cover_half_day', 'paid_leave_can_cover_half_day BOOLEAN NOT NULL DEFAULT TRUE');
    await this.addColumnIfMissing('company_settings', 'half_day_deduction_percent', 'half_day_deduction_percent DECIMAL(5,2) NOT NULL DEFAULT 50');
    await this.addColumnIfMissing('company_settings', 'unpaid_leave_deduction_percent', 'unpaid_leave_deduction_percent DECIMAL(5,2) NOT NULL DEFAULT 100');
    await this.addColumnIfMissing('company_settings', 'absent_deduction_percent', 'absent_deduction_percent DECIMAL(5,2) NOT NULL DEFAULT 100');
    await this.addColumnIfMissing('company_settings', 'half_day_enabled', 'half_day_enabled BOOLEAN NOT NULL DEFAULT TRUE');
    await this.addColumnIfMissing('company_settings', 'half_day_paid_percentage', 'half_day_paid_percentage DECIMAL(5,2) NOT NULL DEFAULT 50');
    await this.addColumnIfMissing('company_settings', 'one_paid_leave_covers_half_days', 'one_paid_leave_covers_half_days DECIMAL(5,2) NOT NULL DEFAULT 2');
    await this.addColumnIfMissing('company_settings', 'attendance_type', "attendance_type ENUM('Wi-Fi', 'Fingerprint', 'Camera', 'Multiple') NOT NULL DEFAULT 'Multiple'");
    await this.addColumnIfMissing('company_settings', 'wifi_enabled', 'wifi_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    await this.addColumnIfMissing('company_settings', 'fingerprint_enabled', 'fingerprint_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    await this.addColumnIfMissing('company_settings', 'camera_enabled', 'camera_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    await this.addColumnIfMissing('company_settings', 'sandwich_leave_enabled', 'sandwich_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    await this.addColumnIfMissing('company_settings', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await this.addColumnIfMissing('company_settings', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

   await pool.execute(
  `INSERT INTO company_settings (
    id,
    office_start_time,
    office_end_time,
    grace_time,
    half_day_after,
    minimum_work_hours,
    week_off,
    break_start,
    break_end,
    short_leave_time,
    short_leave_enabled,
    short_leave_duration_hours,
    short_leaves_for_half_day,
    short_leave_reset_period,
    paid_leave_days,
    enable_paid_leave,
    absent_can_use_paid_leave,
    monthly_paid_leave_credit,
    carry_forward_enabled,
    maximum_carry_forward_days,
    paid_leave_expiry,
    approved_leave_is_paid,
    paid_leave_can_cover_half_day,
    half_day_deduction_percent,
    unpaid_leave_deduction_percent,
    absent_deduction_percent,
    half_day_enabled,
    half_day_paid_percentage,
    one_paid_leave_covers_half_days,
    attendance_type,
    wifi_enabled,
    fingerprint_enabled,
    camera_enabled,
    sandwich_leave_enabled,
    created_at,
    updated_at
  )
  VALUES (
    1,
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, NOW(), NOW()
  )
  ON DUPLICATE KEY UPDATE id = id`,
  [
    DEFAULT_SETTINGS.office_start_time,
    DEFAULT_SETTINGS.office_end_time,
    DEFAULT_SETTINGS.grace_time,
    DEFAULT_SETTINGS.half_day_after,
    DEFAULT_SETTINGS.minimum_work_hours,
    DEFAULT_SETTINGS.week_off,
    DEFAULT_SETTINGS.break_start,
    DEFAULT_SETTINGS.break_end,
    DEFAULT_SETTINGS.short_leave_time,
    DEFAULT_SETTINGS.short_leave_enabled,
    DEFAULT_SETTINGS.short_leave_duration_hours,
    DEFAULT_SETTINGS.short_leaves_for_half_day,
    DEFAULT_SETTINGS.short_leave_reset_period,
    DEFAULT_SETTINGS.paid_leave_days,
    DEFAULT_SETTINGS.enable_paid_leave,
    DEFAULT_SETTINGS.absent_can_use_paid_leave,
    DEFAULT_SETTINGS.monthly_paid_leave_credit,
    DEFAULT_SETTINGS.carry_forward_enabled,
    DEFAULT_SETTINGS.maximum_carry_forward_days,
    DEFAULT_SETTINGS.paid_leave_expiry,
    DEFAULT_SETTINGS.approved_leave_is_paid,
    DEFAULT_SETTINGS.paid_leave_can_cover_half_day,
    DEFAULT_SETTINGS.half_day_deduction_percent,
    DEFAULT_SETTINGS.unpaid_leave_deduction_percent,
    DEFAULT_SETTINGS.absent_deduction_percent,
    DEFAULT_SETTINGS.half_day_enabled,
    DEFAULT_SETTINGS.half_day_paid_percentage,
    DEFAULT_SETTINGS.one_paid_leave_covers_half_days,
    DEFAULT_SETTINGS.attendance_type,
    DEFAULT_SETTINGS.wifi_enabled,
    DEFAULT_SETTINGS.fingerprint_enabled,
    DEFAULT_SETTINGS.camera_enabled,
    DEFAULT_SETTINGS.sandwich_leave_enabled,
  ]
);

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS company_policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS company_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );
  }

  static async getRaw() {
    await this.ensureDefault();
    const [rows] = await pool.execute('SELECT * FROM company_settings WHERE id = 1 LIMIT 1');
    return rows[0] || DEFAULT_SETTINGS;
  }

  static async get() {
    return toApiSettings(await this.getRaw());
  }

  static async update(settings = {}) {
    await this.ensureDefault();
    const existing = await this.getRaw();
    const normalized = normalizePayload({ ...toApiSettings(existing), ...settings });
    const isShortLeaveEnabled = normalized.short_leave_enabled;
    if (!isShortLeaveEnabled) {
      normalized.short_leave_duration_hours = Number(existing.short_leave_duration_hours ?? DEFAULT_SETTINGS.short_leave_duration_hours);
      normalized.short_leaves_for_half_day = Number(existing.short_leaves_for_half_day ?? DEFAULT_SETTINGS.short_leaves_for_half_day);
      normalized.short_leave_reset_period = existing.short_leave_reset_period ?? DEFAULT_SETTINGS.short_leave_reset_period;
    }

    await pool.execute(
      `UPDATE company_settings
       SET office_start_time = ?,
           office_end_time = ?,
           grace_time = ?,
           half_day_after = ?,
           minimum_work_hours = ?,
           week_off = ?,
           break_start = ?,
           break_end = ?,
           short_leave_time = ?,
           short_leave_enabled = ?,
           short_leave_duration_hours = ?,
           short_leaves_for_half_day = ?,
           short_leave_reset_period = ?,
           paid_leave_days = ?,
           enable_paid_leave = ?,
           absent_can_use_paid_leave = ?,
           monthly_paid_leave_credit = ?,
           carry_forward_enabled = ?,
           maximum_carry_forward_days = ?,
           paid_leave_expiry = ?,
           approved_leave_is_paid = ?,
           paid_leave_can_cover_half_day = ?,
           half_day_deduction_percent = ?,
           unpaid_leave_deduction_percent = ?,
           absent_deduction_percent = ?,
           half_day_enabled = ?,
           half_day_paid_percentage = ?,
           one_paid_leave_covers_half_days = ?,
           attendance_type = ?,
           wifi_enabled = ?,
           wifi_allowed_ips = ?,
           fingerprint_enabled = ?,
           camera_enabled = ?,
           sandwich_leave_enabled = ?,
           updated_at = NOW()
       WHERE id = 1`,
      [
        normalized.office_start_time,
        normalized.office_end_time,
        normalized.grace_time,
        normalized.half_day_after,
        normalized.minimum_work_hours,
        normalized.week_off,
        normalized.break_start,
        normalized.break_end,
        normalized.short_leave_time,
        normalized.short_leave_enabled,
        normalized.short_leave_duration_hours,
        normalized.short_leaves_for_half_day,
        normalized.short_leave_reset_period,
        normalized.paid_leave_days,
        normalized.enable_paid_leave,
        normalized.absent_can_use_paid_leave,
        normalized.monthly_paid_leave_credit,
        normalized.carry_forward_enabled,
        normalized.maximum_carry_forward_days,
        normalized.paid_leave_expiry,
        normalized.approved_leave_is_paid,
        normalized.paid_leave_can_cover_half_day,
        normalized.half_day_deduction_percent,
        normalized.unpaid_leave_deduction_percent,
        normalized.absent_deduction_percent,
        normalized.half_day_enabled,
        normalized.half_day_paid_percentage,
        normalized.one_paid_leave_covers_half_days,
        normalized.attendance_type,
        normalized.wifi_enabled,
        JSON.stringify(normalized.wifi_allowed_ips),
        normalized.fingerprint_enabled,
        normalized.camera_enabled,
        normalized.sandwich_leave_enabled,
      ]
    );

    return this.get();
  }

  static async listPolicies({ publicOnly = false } = {}) {
    await this.ensureDefault();
    const [rows] = await pool.execute(
      `SELECT * FROM company_policies
       ${publicOnly ? 'WHERE is_published = TRUE' : ''}
       ORDER BY updated_at DESC, id DESC`
    );
    return rows.map(toPolicy);
  }

  static async createPolicy({ title, content, isPublished = false }) {
    await this.ensureDefault();
    const [result] = await pool.execute(
      'INSERT INTO company_policies (title, content, is_published, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [title, content, toBoolean(isPublished)]
    );
    return this.findPolicyById(result.insertId);
  }

  static async findPolicyById(id) {
    const [rows] = await pool.execute('SELECT * FROM company_policies WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? toPolicy(rows[0]) : null;
  }

  static async updatePolicy(id, { title, content, isPublished }) {
    await pool.execute(
      `UPDATE company_policies
       SET title = ?,
           content = ?,
           is_published = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [title, content, toBoolean(isPublished), id]
    );
    return this.findPolicyById(id);
  }

  static async deletePolicy(id) {
    const [result] = await pool.execute('DELETE FROM company_policies WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async listRules({ activeOnly = false } = {}) {
    await this.ensureDefault();
    const [rows] = await pool.execute(
      `SELECT * FROM company_rules
       ${activeOnly ? 'WHERE is_active = TRUE' : ''}
       ORDER BY updated_at DESC, id DESC`
    );
    return rows.map(toRule);
  }

  static async createRule({ title, description, isActive = true }) {
    await this.ensureDefault();
    const [result] = await pool.execute(
      'INSERT INTO company_rules (title, description, is_active, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [title, description, toBoolean(isActive)]
    );
    return this.findRuleById(result.insertId);
  }

  static async findRuleById(id) {
    const [rows] = await pool.execute('SELECT * FROM company_rules WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? toRule(rows[0]) : null;
  }

  static async updateRule(id, { title, description, isActive }) {
    await pool.execute(
      `UPDATE company_rules
       SET title = ?,
           description = ?,
           is_active = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [title, description, toBoolean(isActive), id]
    );
    return this.findRuleById(id);
  }

  static async deleteRule(id) {
    const [result] = await pool.execute('DELETE FROM company_rules WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default CompanySettings;