import { pool } from '../config/databases.js';
import CompanySettings from '../repositories/companySettings.repository.js';

const toNumber = (value) => Number(Number(value || 0).toFixed(2));
const getMonthlyLeaveCredit = async () => {
  const settings = await CompanySettings.get();
  return toNumber(settings.monthlyPaidLeaveCredit ?? settings.paidLeaveDays);
};
const dateOnly = (value) => String(value || '').slice(0, 10);
const monthStart = (year, month) => `${year}-${String(month).padStart(2, '0')}-01`;
const monthEnd = (year, month) => `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
const addMonth = (year, month) => month === 12 ? [year + 1, 1] : [year, month + 1];
const currentMonthStart = () => {
  const now = new Date();
  return monthStart(now.getFullYear(), now.getMonth() + 1);
};

const eachDate = (start, end) => {
  const dates = [];
  for (let current = start; current && current <= end;) {
    dates.push(current);
    const next = new Date(`${current}T00:00:00`);
    next.setDate(next.getDate() + 1);
    current = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  }
  return dates;
};

async function getEmployeeStart(employeeId) {
  const [rows] = await pool.execute('SELECT join_date FROM employees WHERE id = ? LIMIT 1', [employeeId]);
  if (!rows[0]) throw new Error('Employee not found');
  const date = dateOnly(rows[0].join_date) || monthStart(new Date().getFullYear(), new Date().getMonth() + 1);
  return [Number(date.slice(0, 4)), Number(date.slice(5, 7))];
}

async function getManualBalanceRows(employeeId, endDate) {
  const [rows] = await pool.execute(
    `SELECT balance_month, opening_balance, source
       FROM leave_balance_history
      WHERE employee_id = ? AND balance_month <= ? AND source = 'MANUAL'
      ORDER BY balance_month ASC`,
    [employeeId, endDate]
  );
  return rows.map((row) => ({
    balanceMonth: dateOnly(row.balance_month),
    openingBalance: toNumber(row.opening_balance),
    source: row.source,
  }));
}

async function getApprovedLeaves(employeeId, endDate) {
  const [rows] = await pool.execute(
    `SELECT id, leave_type, start_date, end_date
       FROM leaves
      WHERE employee_id = ? AND status = 'Approved' AND start_date <= ?`,
    [employeeId, endDate]
  );
  return rows;
}

async function getAbsences(employeeId, startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT date FROM attendance WHERE employee_id = ? AND status = 'Absent' AND date BETWEEN ? AND ?`,
    [employeeId, startDate, endDate]
  );
  return rows.map((row) => dateOnly(row.date));
}

function buildMonthBalance({
  start,
  end,
  openingBalance,
  monthlyLeaveCredit,
  paidLeaveDates,
  unpaidLeaveDates,
  approvedLeaveDates,
  absences,
  sandwichLeaveDays,
  halfDays = 0,
  settings = {},
}) {
  const dates = eachDate(start, end);
  const approvedLeaveIsPaid = settings.approvedLeaveIsPaid ?? settings.approved_leave_is_paid ?? true;
  const approvedPaidDays = approvedLeaveIsPaid ? dates.filter((date) => paidLeaveDates.has(date)).length : 0;
  const explicitlyUnpaidDays = dates.filter((date) => unpaidLeaveDates.has(date)).length;
  const absentDays = absences.filter((date) => date >= start && date <= end && !approvedLeaveDates.has(date)).length;
  const enabled = settings.enablePaidLeave ?? settings.enable_paid_leave ?? true;
  const absentCanUse = settings.absentCanUsePaidLeave ?? settings.absent_can_use_paid_leave ?? false;
  const coverHalfDays = settings.paidLeaveCanCoverHalfDay ?? settings.paid_leave_can_cover_half_day ?? true;
  const halfDayEnabled = settings.halfDayEnabled ?? settings.half_day_enabled ?? true;
  const oneLeaveCovers = Number(settings.onePaidLeaveCoversHalfDays ?? settings.one_paid_leave_covers_half_days ?? 2);
  const credit = enabled ? Number(monthlyLeaveCredit || 0) : 0;
  const totalAvailableLeave = toNumber(openingBalance + credit);
  const approvedUsage = Math.min(totalAvailableLeave, approvedPaidDays + Number(sandwichLeaveDays || 0));
  let remaining = totalAvailableLeave - approvedUsage;
  const absentUsage = enabled && absentCanUse ? Math.min(remaining, absentDays) : 0;
  remaining -= absentUsage;
  const coveredHalfDays = enabled && halfDayEnabled && coverHalfDays
    ? Math.min(Number(halfDays || 0), remaining * Math.max(0.01, oneLeaveCovers))
    : 0;
  const halfDayUsage = coveredHalfDays / Math.max(0.01, oneLeaveCovers);
  const paidLeaveUsed = toNumber(approvedUsage + absentUsage + halfDayUsage);
  const unpaidLeaveDays = toNumber(explicitlyUnpaidDays + Math.max(0, approvedPaidDays - approvedUsage) + Math.max(0, absentDays - absentUsage));
  const unpaidHalfDays = toNumber(Math.max(0, Number(halfDays || 0) - coveredHalfDays));
  const maximumCarryForward = settings.maximumCarryForwardDays ?? settings.maximum_carry_forward_days;
  const carryForwardEnabled = settings.carryForwardEnabled ?? settings.carry_forward_enabled ?? true;
  const closingBalance = toNumber(Math.max(0, remaining - halfDayUsage));
  const cappedClosingBalance = !carryForwardEnabled
    ? 0
    : maximumCarryForward !== null && maximumCarryForward !== undefined && maximumCarryForward !== ''
      ? Math.min(closingBalance, Math.max(0, Number(maximumCarryForward)))
      : closingBalance;

  return {
    balanceMonth: start,
    openingBalance,
    monthlyLeaveCredit: credit,
    paidLeaveUsed: toNumber(paidLeaveUsed),
    paidLeaveUsedForApprovedLeave: toNumber(approvedUsage),
    paidLeaveUsedForAbsent: toNumber(absentUsage),
    paidLeaveUsedForHalfDays: toNumber(halfDayUsage),
    unpaidLeaveDays,
    unpaidHalfDays,
    unpaidAbsentDays: toNumber(Math.max(0, absentDays - absentUsage)),
    remainingAbsentDays: toNumber(Math.max(0, absentDays - absentUsage)),
    remainingPaidLeave: toNumber(Math.max(0, remaining - halfDayUsage)),
    carryForwardBalance: openingBalance,
    totalAvailableLeave,
    paidLeaveBalance: cappedClosingBalance,
    closingBalance: cappedClosingBalance,
  };
}

/** Pure projection: safe for dashboard reads. It does not mutate balance history. */
async function calculateLeaveBalance({ employeeId, year, month, sandwichLeaveDays = 0, halfDays = 0, calculationEndDate = null, settings: providedSettings = {} }) {
  const settings = Object.keys(providedSettings).length ? providedSettings : await CompanySettings.get();
  const [joinYear, joinMonth] = await getEmployeeStart(employeeId);
  const monthlyLeaveCredit = await getMonthlyLeaveCredit();
  const monthEndDate = monthEnd(year, month);
  const endDate = calculationEndDate && calculationEndDate < monthEndDate ? calculationEndDate : monthEndDate;
  const [leaves, absences, manualRows] = await Promise.all([
    getApprovedLeaves(employeeId, endDate),
    getAbsences(employeeId, monthStart(joinYear, joinMonth), endDate),
    getManualBalanceRows(employeeId, endDate),
  ]);
  const manualByMonth = new Map(manualRows.map((row) => [row.balanceMonth, row]));
  const manualCutoffMonth = manualRows.length
    ? manualRows[manualRows.length - 1].balanceMonth
    : currentMonthStart();
  const paidLeaveDates = new Set();
  const unpaidLeaveDates = new Set();
  const approvedLeaveDates = new Set();
  leaves.forEach((leave) => eachDate(dateOnly(leave.start_date), dateOnly(leave.end_date)).forEach((date) => {
    approvedLeaveDates.add(date);
    (leave.leave_type === 'Unpaid Leave' ? unpaidLeaveDates : paidLeaveDates).add(date);
  }));
  let openingBalance = 0;
  let cursorYear = joinYear;
  let cursorMonth = joinMonth;
  let result = {
    balanceMonth: monthStart(year, month),
    openingBalance: 0,
    monthlyLeaveCredit,
    paidLeaveUsed: 0,
    unpaidLeaveDays: 0,
    carryForwardBalance: 0,
    totalAvailableLeave: monthlyLeaveCredit,
    paidLeaveBalance: monthlyLeaveCredit,
    closingBalance: monthlyLeaveCredit,
    source: 'AUTO',
  };

  while (cursorYear < year || (cursorYear === year && cursorMonth <= month)) {
    const start = monthStart(cursorYear, cursorMonth);
    const end = cursorYear === year && cursorMonth === month ? endDate : monthEnd(cursorYear, cursorMonth);
    if (end < start) break;
    const manualRow = manualByMonth.get(start);
    const isManualPeriod = start <= manualCutoffMonth;
    const carryForwardBalance = isManualPeriod ? toNumber(manualRow?.openingBalance) : openingBalance;

    result = {
      ...buildMonthBalance({
        start,
        end,
        openingBalance: carryForwardBalance,
        monthlyLeaveCredit,
        paidLeaveDates,
        unpaidLeaveDates,
        approvedLeaveDates,
        absences,
        sandwichLeaveDays: cursorYear === year && cursorMonth === month ? sandwichLeaveDays : 0,
        halfDays: cursorYear === year && cursorMonth === month ? halfDays : 0,
        settings,
      }),
      source: manualRow ? 'MANUAL' : (isManualPeriod ? 'ADMIN_PENDING' : 'AUTO'),
      requiresManualCarryForward: isManualPeriod && !manualRow,
    };
    openingBalance = result.closingBalance;
    [cursorYear, cursorMonth] = addMonth(cursorYear, cursorMonth);
  }
  return result;
}

async function persistMonthlyBalance({ employeeId, year, month, sandwichLeaveDays, halfDays = 0, calculationEndDate = null, actorId = null }) {
  const balance = await calculateLeaveBalance({ employeeId, year, month, sandwichLeaveDays, halfDays, calculationEndDate });
  await pool.execute(
    `INSERT INTO leave_balance_history (employee_id, balance_month, opening_balance, monthly_leave_credit, paid_leave_used, paid_leave_used_for_absent, paid_leave_used_for_half_days, unpaid_leave_days, unpaid_half_days, carry_forward_balance, closing_balance, source, calculated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAYROLL', ?)
    ON DUPLICATE KEY UPDATE opening_balance = VALUES(opening_balance), monthly_leave_credit = VALUES(monthly_leave_credit), paid_leave_used = VALUES(paid_leave_used), paid_leave_used_for_absent = VALUES(paid_leave_used_for_absent), paid_leave_used_for_half_days = VALUES(paid_leave_used_for_half_days), unpaid_leave_days = VALUES(unpaid_leave_days), unpaid_half_days = VALUES(unpaid_half_days), carry_forward_balance = VALUES(carry_forward_balance), closing_balance = VALUES(closing_balance), calculated_by = VALUES(calculated_by)`,
    [employeeId, balance.balanceMonth, balance.openingBalance, balance.monthlyLeaveCredit, balance.paidLeaveUsed, balance.paidLeaveUsedForAbsent, balance.paidLeaveUsedForHalfDays, balance.unpaidLeaveDays, balance.unpaidHalfDays, balance.carryForwardBalance, balance.closingBalance, actorId]
  );
  const auditRows = [
    ['MONTHLY_CREDIT', balance.monthlyLeaveCredit, 'MONTHLY_POLICY', `credit:${employeeId}:${balance.balanceMonth}`],
    ['PAID_LEAVE_USAGE', -balance.paidLeaveUsed, 'PAYROLL', `usage:${employeeId}:${balance.balanceMonth}`],
  ];
  await Promise.all(auditRows.map(([transactionType, quantity, referenceType, idempotencyKey]) => pool.execute(
    `INSERT INTO leave_balance_transactions (employee_id, balance_month, transaction_type, quantity, reference_type, idempotency_key, metadata, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), metadata = VALUES(metadata), created_by = VALUES(created_by)`,
    [employeeId, balance.balanceMonth, transactionType, quantity, referenceType, idempotencyKey, JSON.stringify(balance), actorId]
  )));
  return balance;
}

async function upsertManualCarryForward({ employeeId, year, month, carryForwardBalance, actorId = null }) {
  const [joinYear, joinMonth] = await getEmployeeStart(employeeId);
  const balanceMonth = monthStart(year, month);
  const joinMonthStart = monthStart(joinYear, joinMonth);
  if (balanceMonth < joinMonthStart) {
    const error = new Error('Carry-forward month cannot be before employee joining month');
    error.status = 400;
    throw error;
  }
  if (balanceMonth > currentMonthStart()) {
    const error = new Error('Manual carry-forward can only be entered up to the current month');
    error.status = 400;
    throw error;
  }

  const manualCarryForward = toNumber(carryForwardBalance);
  const monthlyLeaveCredit = await getMonthlyLeaveCredit();
  await pool.execute(
    `INSERT INTO leave_balance_history (employee_id, balance_month, opening_balance, monthly_leave_credit, paid_leave_used, unpaid_leave_days, carry_forward_balance, closing_balance, source, calculated_by)
     VALUES (?, ?, ?, ?, 0, 0, ?, ?, 'MANUAL', ?)
     ON DUPLICATE KEY UPDATE opening_balance = VALUES(opening_balance), monthly_leave_credit = VALUES(monthly_leave_credit), carry_forward_balance = VALUES(carry_forward_balance), closing_balance = VALUES(closing_balance), source = 'MANUAL', calculated_by = VALUES(calculated_by)`,
    [employeeId, balanceMonth, manualCarryForward, monthlyLeaveCredit, manualCarryForward, manualCarryForward, actorId]
  );

  const balance = await calculateLeaveBalance({ employeeId, year, month, sandwichLeaveDays: 0 });
  await pool.execute(
    `UPDATE leave_balance_history
        SET paid_leave_used = ?, unpaid_leave_days = ?, carry_forward_balance = ?, closing_balance = ?, updated_at = NOW()
      WHERE employee_id = ? AND balance_month = ?`,
    [balance.paidLeaveUsed, balance.unpaidLeaveDays, balance.carryForwardBalance, balance.closingBalance, employeeId, balanceMonth]
  );
  await pool.execute(
    `INSERT INTO leave_balance_transactions (employee_id, balance_month, transaction_type, quantity, reference_type, idempotency_key, metadata, created_by)
     VALUES (?, ?, 'ADJUSTMENT', ?, 'MANUAL_CARRY_FORWARD', ?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), metadata = VALUES(metadata), created_by = VALUES(created_by)`,
    [employeeId, balanceMonth, manualCarryForward, `manual-carry-forward:${employeeId}:${balanceMonth}`, JSON.stringify(balance), actorId]
  );
  return { ...balance, source: 'MANUAL', requiresManualCarryForward: false };
}

async function getCarryForwardHistory({ employeeId, throughYear, throughMonth }) {
  const [joinYear, joinMonth] = await getEmployeeStart(employeeId);
  const end = throughYear && throughMonth ? monthStart(throughYear, throughMonth) : currentMonthStart();
  const [rows] = await pool.execute(
    `SELECT balance_month, opening_balance, monthly_leave_credit, paid_leave_used, unpaid_leave_days, carry_forward_balance, closing_balance, source
       FROM leave_balance_history
      WHERE employee_id = ? AND balance_month BETWEEN ? AND ?
      ORDER BY balance_month ASC`,
    [employeeId, monthStart(joinYear, joinMonth), end]
  );
  const rowByMonth = new Map(rows.map((row) => [dateOnly(row.balance_month), row]));
  const history = [];
  let cursorYear = joinYear;
  let cursorMonth = joinMonth;

  while (monthStart(cursorYear, cursorMonth) <= end) {
    const balanceMonth = monthStart(cursorYear, cursorMonth);
    const row = rowByMonth.get(balanceMonth);
    const projected = await calculateLeaveBalance({ employeeId, year: cursorYear, month: cursorMonth });
    history.push({
      ...projected,
      balanceMonth,
      manualCarryForwardBalance: row?.source === 'MANUAL' ? toNumber(row.opening_balance) : null,
      source: row?.source === 'MANUAL' ? 'MANUAL' : projected.source,
      requiresManualCarryForward: projected.requiresManualCarryForward,
    });
    [cursorYear, cursorMonth] = addMonth(cursorYear, cursorMonth);
  }

  return history;
}

async function materializeMonthlyCredits({ year = new Date().getFullYear(), month = new Date().getMonth() + 1, actorId = null } = {}) {
  const [employees] = await pool.execute('SELECT id FROM employees WHERE join_date IS NULL OR join_date <= ?', [monthEnd(year, month)]);
  return Promise.all(employees.map(({ id }) => persistMonthlyBalance({ employeeId: id, year, month, sandwichLeaveDays: 0, actorId })));
}

export {
  calculateLeaveBalance,
  persistMonthlyBalance,
  upsertManualCarryForward,
  getCarryForwardHistory,
  materializeMonthlyCredits,
};