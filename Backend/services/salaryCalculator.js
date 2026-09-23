import { pool } from '../config/databases.js';
import CompanySettings from '../repositories/companySettings.repository.js';
import {
  calculateLeaveBalance,
  persistMonthlyBalance,
} from './leaveBalanceService.js';

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const money = (value) => Number(numberValue(value).toFixed(2));

const dateOnly = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const inclusiveDays = (start, end) => {
  if (!start || !end || start > end) return 0;
  const milliseconds =
    new Date(`${end}T00:00:00`).getTime() -
    new Date(`${start}T00:00:00`).getTime();
  return Math.round(milliseconds / (24 * 60 * 60 * 1000)) + 1;
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateOnly(date);
};

const eachDate = (start, end) => {
  const dates = [];
  if (!start || !end || start > end) return dates;

  for (let current = start; current <= end; current = addDays(current, 1)) {
    dates.push(current);
  }

  return dates;
};

const isWeekend = (dateString) => {
  const day = new Date(`${dateString}T00:00:00`).getDay();
  return day === 0;
  // || day === 6; // Consider only Sunday as weekend for payroll purposes
};

const normalizeMonth = (value) => {
  if (!value) return MONTHS[new Date().getMonth()];
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return MONTHS[numeric - 1];
  }

  const found = MONTHS.find(
    (month) => month.toLowerCase() === String(value).trim().toLowerCase(),
  );
  return found || MONTHS[new Date().getMonth()];
};

const allocatePaidLeave = ({
  availablePaidLeave = 0,
  approvedPaidLeaveDays = 0,
  absentDays = 0,
  halfDays = 0,
  enablePaidLeave = true,
  absentCanUsePaidLeave = false,
  paidLeaveCanCoverHalfDay = true,
  halfDayEnabled = true,
  onePaidLeaveCoversHalfDays = 2,
  dailySalary = 0,
  halfDayDeductionPercent = 50,
  absentDeductionPercent = 100,
}) => {
  const available = Math.max(0, numberValue(availablePaidLeave));
  const approved = Math.min(
    available,
    Math.max(0, numberValue(approvedPaidLeaveDays)),
  );
  let remaining = available - approved;
  const absent =
    absentCanUsePaidLeave && enablePaidLeave
      ? Math.min(remaining, Math.max(0, numberValue(absentDays)))
      : 0;
  remaining -= absent;
  const halfDayUnit = Math.max(
    0.01,
    numberValue(onePaidLeaveCoversHalfDays, 2),
  );
  const coveredHalfDays =
    halfDayEnabled && paidLeaveCanCoverHalfDay && enablePaidLeave
      ? Math.min(Math.max(0, numberValue(halfDays)), remaining * halfDayUnit)
      : 0;
  const usedForHalfDays = coveredHalfDays / halfDayUnit;
  const unpaidHalfDays = Math.max(0, numberValue(halfDays) - coveredHalfDays);
  const unpaidAbsentDays = Math.max(0, numberValue(absentDays) - absent);
  const halfDayRate =
    Math.max(0, Math.min(100, numberValue(halfDayDeductionPercent, 50))) / 100;
  const absentRate =
    Math.max(0, Math.min(100, numberValue(absentDeductionPercent, 100))) / 100;

  return {
    paidLeaveUsedForApprovedLeave: money(approved),
    paidLeaveUsedForAbsent: money(absent),
    paidLeaveUsedForHalfDays: money(usedForHalfDays),
    totalPaidLeaveUsed: money(approved + absent + usedForHalfDays),
    coveredHalfDays: money(coveredHalfDays),
    unpaidHalfDays: money(unpaidHalfDays),
    unpaidAbsentDays: money(unpaidAbsentDays),
    remainingPaidLeave: money(remaining - usedForHalfDays),
    absentDeduction: money(
      unpaidAbsentDays * numberValue(dailySalary) * absentRate,
    ),
    halfDayDeduction: money(
      unpaidHalfDays * 0.5 * numberValue(dailySalary) * (halfDayRate / 0.5),
    ),
  };
};

const calculateHalfDayBreakdown = ({
  totalHalfDays = 0,
  paidLeaveBalance = 0,
  paidLeaveUsedForFullDays = 0,
  onePaidLeaveCoversHalfDays = 2,
  halfDayDeductionPercent = 50,
  halfDayEnabled = true,
  paidLeaveCanCoverHalfDay = true,
  enablePaidLeave = true,
  dailySalary = 0,
}) => {
  const safeTotalHalfDays = Number(totalHalfDays || 0);
  const safeBalance = Number(paidLeaveBalance || 0);
  const safeCover = Number(onePaidLeaveCoversHalfDays || 2);
  const remainingPaidLeave = Math.max(
    0,
    safeBalance - Number(paidLeaveUsedForFullDays || 0),
  );
  const coveredHalfDays =
    halfDayEnabled && paidLeaveCanCoverHalfDay && enablePaidLeave
      ? Math.min(safeTotalHalfDays, remainingPaidLeave * safeCover)
      : 0;
  const unpaidHalfDays = Math.max(0, safeTotalHalfDays - coveredHalfDays);
  const deductionRate =
    Math.max(0, Math.min(100, Number(halfDayDeductionPercent || 50))) / 50;
  const halfDayDeduction = halfDayEnabled
    ? unpaidHalfDays * 0.5 * Number(dailySalary || 0) * deductionRate
    : 0;

  return {
    totalHalfDays: safeTotalHalfDays,
    coveredHalfDays,
    unpaidHalfDays,
    paidLeaveUsedForHalfDays: Math.min(
      safeTotalHalfDays,
      Math.ceil(coveredHalfDays / safeCover) || 0,
    ),
    halfDayDeduction: money(halfDayDeduction),
  };
};

const monthNumber = (monthName) =>
  MONTHS.indexOf(normalizeMonth(monthName)) + 1;

const getMonthRange = (month, year) => {
  const normalizedMonth = normalizeMonth(month);
  const selectedYear = Number(year) || new Date().getFullYear();
  const selectedMonth = monthNumber(normalizedMonth);
  const start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
  const endDate = new Date(selectedYear, selectedMonth, 0).getDate();
  const end = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  return {
    month: normalizedMonth,
    year: selectedYear,
    monthNumber: selectedMonth,
    start,
    end,
    daysInMonth: endDate,
  };
};

const todayOnly = () => dateOnly(new Date());

const getCalculationEndDate = (range) => {
  const today = todayOnly();
  if (range.start > today) return null;
  return range.end < today ? range.end : today;
};

const getEligiblePeriod = (employee, range) => {
  const joinDate = dateOnly(employee.join_date);
  const calculationEndDate = getCalculationEndDate(range);

  if (!calculationEndDate || (joinDate && joinDate > calculationEndDate)) {
    return {
      start: null,
      end: null,
      eligibleDays: 0,
      workingDays: 0,
      eligible: false,
      joinDate,
      calculationEndDate,
    };
  }

  const start = joinDate && joinDate > range.start ? joinDate : range.start;
  const eligibleDays = inclusiveDays(start, calculationEndDate);

  return {
    start,
    end: calculationEndDate,
    eligibleDays,
    workingDays: eligibleDays,
    eligible: true,
    joinDate,
    calculationEndDate,
  };
};

const getEmployeeForUser = async (user) => {
  if (!user) return null;
  const [rows] = await pool.execute(
    "SELECT * FROM employees WHERE email = ? OR id = ? LIMIT 1",
    [user.email || "", user.employeeId || 0],
  );
  return rows[0] || null;
};

const getEmployeeById = async (employeeId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM employees WHERE id = ? LIMIT 1",
    [employeeId],
  );
  return rows[0] || null;
};

const getAttendanceSummary = async (employeeId, range) => {
  if (!range.start || !range.end) {
    return {
      presentDays: 0,
      absentDays: 0,
      halfDays: 0,
      shortLeaveDays: 0,
      lateCount: 0,
      holidays: 0,
      overtimeHours: 0,
      records: [],
    };
  }

  const [rows] = await pool.execute(
    `SELECT status, overtime, check_in, check_out, date
     FROM attendance
     WHERE employee_id = ? AND date BETWEEN ? AND ?`,
    [employeeId, range.start, range.end],
  );

  return rows.reduce(
    (summary, record) => {
      const status = record.status || "Present";
      if (status === "Absent") summary.absentDays += 1;
      if (status === "Half Day") summary.halfDays += 1;
      if (status === "Short Leave") summary.shortLeaveDays += 1;
      if (status === "Late") summary.lateCount += 1;
      // Short Leave has no standalone deduction in the current company policy,
      // so it remains a payable full day. Half Day is handled separately.
      if (status === "Present" || status === "Late" || status === "Short Leave")
        summary.presentDays += 1;
      if (status === "Holiday") summary.holidays += 1;

      summary.overtimeHours += numberValue(record.overtime);
      summary.records.push(record);
      return summary;
    },
    {
      presentDays: 0,
      absentDays: 0,
      halfDays: 0,
      shortLeaveDays: 0,
      lateCount: 0,
      holidays: 0,
      overtimeHours: 0,
      records: [],
    },
  );
};

const getLeaveSummary = async (employeeId, range, settings = {}) => {
  if (!range.start || !range.end) {
    return {
      leaveDays: 0,
      sandwichLeaveDays: 0,
      totalLeaveDays: 0,
      dates: [],
      sandwichDates: [],
      records: [],
    };
  }

  const [leaveRows] = await pool.execute(
    `SELECT id, leave_type, start_date, end_date, status
     FROM leaves
     WHERE employee_id = ?
       AND status = 'Approved'
       AND start_date <= ?
       AND end_date >= ?`,
    [employeeId, range.end, range.start],
  );

  const [holidayRows] = await pool.execute(
    `SELECT date
     FROM attendance
     WHERE employee_id = ? AND status = 'Holiday'
       AND date BETWEEN ? AND ?`,
    [employeeId, range.start, range.end],
  );

  const leaveDateSet = new Set();
  const leaveBoundaryDateSet = new Set();
  const holidayDateSet = new Set(
    holidayRows.map((row) => dateOnly(row.date)).filter(Boolean),
  );

  leaveRows.forEach((leave) => {
    const start = dateOnly(leave.start_date);
    const end = dateOnly(leave.end_date);
    const overlapStart = start && start > range.start ? start : range.start;
    const overlapEnd = end && end < range.end ? end : range.end;

    if (overlapStart) leaveBoundaryDateSet.add(overlapStart);
    if (overlapEnd) leaveBoundaryDateSet.add(overlapEnd);
    eachDate(overlapStart, overlapEnd).forEach((date) =>
      leaveDateSet.add(date),
    );
  });

  const sandwichDateSet = new Set();
  if (settings.sandwichLeaveEnabled) {
    const dates = eachDate(range.start, range.end);

    for (let index = 0; index < dates.length; index += 1) {
      const date = dates[index];
      if (
        leaveBoundaryDateSet.has(date) ||
        (!isWeekend(date) && !holidayDateSet.has(date))
      )
        continue;

      const run = [];
      let cursor = index;

      while (cursor < dates.length) {
        const runDate = dates[cursor];
        if (
          leaveBoundaryDateSet.has(runDate) ||
          (!isWeekend(runDate) && !holidayDateSet.has(runDate))
        )
          break;
        run.push(runDate);
        cursor += 1;
      }

      const before = dates[index - 1];
      const after = dates[cursor];
      if (
        before &&
        after &&
        leaveDateSet.has(before) &&
        leaveDateSet.has(after)
      ) {
        run.forEach((runDate) => {
          const day = new Date(`${runDate}T00:00:00`).getDay();

          // Only Sunday
          if (day === 0) {
            sandwichDateSet.add(runDate);
          }
        });
      }

      index = cursor - 1;
    }

    sandwichDateSet.forEach((date) => leaveDateSet.delete(date));
  }

  const leaveSundayCount = Array.from(leaveDateSet).filter(
    (date) => new Date(`${date}T00:00:00`).getDay() === 0,
  ).length;

  const leaveHolidayCount = Array.from(leaveDateSet).filter((date) =>
    holidayDateSet.has(date),
  ).length;

  return {
    leaveDays: leaveDateSet.size,
    sandwichLeaveDays: sandwichDateSet.size,
    totalLeaveDays: leaveDateSet.size + sandwichDateSet.size,
    leaveSundayCount,
    leaveHolidayCount,
    dates: Array.from(leaveDateSet).sort(),
    sandwichDates: Array.from(sandwichDateSet).sort(),
    records: leaveRows,
  };
};
// Helper function to count Sundays in a date range
const getSundayCount = (start, end) => {
  let count = 0;

  eachDate(start, end).forEach((date) => {
    const day = new Date(`${date}T00:00:00`).getDay();

    if (day === 0) {
      count++;
    }
  });

  return count;
};

const settingNumber = (settings, snakeName, camelName, fallback) =>
  numberValue(settings[snakeName] ?? settings[camelName], fallback);

const settingBoolean = (settings, snakeName, camelName, fallback) => {
  const value = settings[snakeName] ?? settings[camelName];
  return value === undefined
    ? fallback
    : value === true || value === 1 || value === "1" || value === "true";
};

const buildDailyPayrollResults = ({
  period,
  attendanceRecords = [],
  leaveRecords = [],
  settings = {},
  availablePaidLeave = 0,
}) => {
  const attendanceByDate = new Map(
    attendanceRecords.map((record) => [dateOnly(record.date), record]),
  );
  const paidLeaveDates = new Set();
  const unpaidLeaveDates = new Set();

  leaveRecords.forEach((leave) => {
    const start = dateOnly(leave.start_date);
    const end = dateOnly(leave.end_date);
    const overlapStart = start > period.start ? start : period.start;
    const overlapEnd = end < period.end ? end : period.end;
    eachDate(overlapStart, overlapEnd).forEach((date) => {
      if (
        leave.leave_type === "Unpaid Leave" ||
        !settingBoolean(
          settings,
          "approved_leave_is_paid",
          "approvedLeaveIsPaid",
          true,
        )
      ) {
        unpaidLeaveDates.add(date);
      } else {
        paidLeaveDates.add(date);
      }
    });
  });

  const results = eachDate(period.start, period.end).map((date) => {
    const record = attendanceByDate.get(date);
    const status = record?.status || (isWeekend(date) ? "Sunday" : "Absent");
    const isHoliday = status === "Holiday";
    const isSunday = status === "Sunday" || isWeekend(date);
    const isApprovedPaidLeave = paidLeaveDates.has(date);
    const isApprovedUnpaidLeave =
      unpaidLeaveDates.has(date) && !isApprovedPaidLeave;
    const isHalfDay =
      status === "Half Day" && !isApprovedPaidLeave && !isApprovedUnpaidLeave;
    const isAbsent =
      status === "Absent" && !isApprovedPaidLeave && !isApprovedUnpaidLeave;
    const isFullPaidAttendance = ["Present", "Late", "Short Leave"].includes(
      status,
    );

    return {
      date,
      attendanceStatus: status,
      payrollStatus: isApprovedPaidLeave
        ? "Paid Leave"
        : isApprovedUnpaidLeave
          ? "Unpaid Leave"
          : status,
      isPaid:
        isApprovedPaidLeave || isHoliday || isSunday || isFullPaidAttendance,
      paidLeaveUsed: 0,
      paidLeaveUsedFor: null,
      halfDayEquivalent: isHalfDay
        ? 0.5
        : isApprovedPaidLeave || isHoliday || isSunday || isFullPaidAttendance
          ? 1
          : 0,
      deduction: 0,
      bonus: 0,
      overtimeHours: numberValue(record?.overtime),
      late: status === "Late",
      isHalfDay,
      isAbsent,
      isApprovedPaidLeave,
      isApprovedUnpaidLeave,
    };
  });

  const enablePaidLeave = settingBoolean(
    settings,
    "enable_paid_leave",
    "enablePaidLeave",
    true,
  );
  const absentCanUsePaidLeave = settingBoolean(
    settings,
    "absent_can_use_paid_leave",
    "absentCanUsePaidLeave",
    false,
  );
  const paidLeaveCanCoverHalfDay = settingBoolean(
    settings,
    "paid_leave_can_cover_half_day",
    "paidLeaveCanCoverHalfDay",
    true,
  );
  const halfDayEnabled = settingBoolean(
    settings,
    "half_day_enabled",
    "halfDayEnabled",
    true,
  );
  const halfDaysPerLeave = Math.max(
    0.01,
    settingNumber(
      settings,
      "one_paid_leave_covers_half_days",
      "onePaidLeaveCoversHalfDays",
      2,
    ),
  );
  let remainingLeave = enablePaidLeave
    ? Math.max(0, numberValue(availablePaidLeave))
    : 0;

  const consume = (result, amount, reason) => {
    const used = Math.min(remainingLeave, amount);
    result.paidLeaveUsed = money(used);
    result.paidLeaveUsedFor = reason;
    result.isPaid = used > 0;
    result.payrollStatus = used > 0 ? "Paid Leave" : result.payrollStatus;
    if (used === 0 && reason === "approved-leave") {
      result.isHalfDay = false;
      result.isAbsent = false;
      result.isApprovedPaidLeave = false;
      result.isApprovedUnpaidLeave = true;
      result.isPaid = false;
      result.payrollStatus = "Unpaid Leave";
      result.halfDayEquivalent = 0;
    }
    remainingLeave -= used;
    return used;
  };

  results
    .filter((result) => result.isApprovedPaidLeave)
    .forEach((result) => consume(result, 1, "approved-leave"));
  results
    .filter((result) => result.isAbsent && absentCanUsePaidLeave)
    .forEach((result) => consume(result, 1, "absent"));
  if (halfDayEnabled && paidLeaveCanCoverHalfDay) {
    results
      .filter((result) => result.isHalfDay)
      .forEach((result) => consume(result, 1 / halfDaysPerLeave, "half-day"));
  }

  return results;
};
const calculateSalary = async ({ employeeId, month, year }) => {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    const error = new Error("Employee not found");
    error.status = 404;
    throw error;
  }

  const range = getMonthRange(month, year);
  const period = getEligiblePeriod(employee, range);
  const [attendance, settings] = await Promise.all([
    getAttendanceSummary(employeeId, period),
    CompanySettings.get(),
  ]);
  const leave = await getLeaveSummary(employeeId, period, settings);
  const leaveBalance = await calculateLeaveBalance({
    employeeId,
    year: range.year,
    month: range.monthNumber,
    sandwichLeaveDays: leave.sandwichLeaveDays,
    halfDays: 0,
    calculationEndDate: period.end,
    settings,
  });
  const dailyResults = buildDailyPayrollResults({
    period,
    attendanceRecords: attendance.records,
    leaveRecords: leave.records,
    settings,
    availablePaidLeave: leaveBalance.totalAvailableLeave,
  });
  const monthlySalary = money(employee.salary);
  const daysInMonth = range.daysInMonth;
  const dailySalary = daysInMonth > 0 ? monthlySalary / daysInMonth : 0;
  const perHourSalary =
    dailySalary / numberValue(process.env.SALARY_STANDARD_HOURS, 8);
  const latePenaltyRate = numberValue(process.env.SALARY_LATE_PENALTY, 0);
  const overtimeMultiplier = numberValue(
    process.env.SALARY_OVERTIME_MULTIPLIER,
    1.25,
  );
  const actualAbsentDays = dailyResults.filter(
    (result) => result.isAbsent,
  ).length;
  const unpaidLeaveDays = dailyResults.filter(
    (result) => result.isApprovedUnpaidLeave,
  ).length;
  const unpaidAbsentDays = dailyResults.filter(
    (result) => result.isAbsent && result.paidLeaveUsed === 0,
  ).length;
  const unpaidHalfDays = dailyResults.filter(
    (result) => result.isHalfDay && result.paidLeaveUsed === 0,
  ).length;
  const effectiveHalfDays = dailyResults.filter(
    (result) => result.isHalfDay,
  ).length;
  const paidLeaveUsedForApprovedLeave = dailyResults
    .filter((result) => result.paidLeaveUsedFor === "approved-leave")
    .reduce((total, result) => total + result.paidLeaveUsed, 0);
  const paidLeaveUsedForAbsent = dailyResults
    .filter((result) => result.paidLeaveUsedFor === "absent")
    .reduce((total, result) => total + result.paidLeaveUsed, 0);
  const paidLeaveUsedForHalfDays = dailyResults
    .filter((result) => result.paidLeaveUsedFor === "half-day")
    .reduce((total, result) => total + result.paidLeaveUsed, 0);
  const totalPaidLeaveUsed = money(
    paidLeaveUsedForApprovedLeave +
      paidLeaveUsedForAbsent +
      paidLeaveUsedForHalfDays,
  );
  const payableDays = money(
    dailyResults.reduce((total, result) => total + result.halfDayEquivalent, 0),
  );
  const leaveDeduction =
    unpaidLeaveDays *
    dailySalary *
    (settingNumber(
      settings,
      "unpaid_leave_deduction_percent",
      "unpaidLeaveDeductionPercent",
      100,
    ) /
      100);
  const absentDeduction =
    unpaidAbsentDays *
    dailySalary *
    (settingNumber(
      settings,
      "absent_deduction_percent",
      "absentDeductionPercent",
      100,
    ) /
      100);
  const sandwichDeduction = 0;

  const halfDayBreakdown = {
    totalHalfDays: effectiveHalfDays,
    coveredHalfDays: dailyResults.filter(
      (result) => result.isHalfDay && result.paidLeaveUsed > 0,
    ).length,
    unpaidHalfDays,
    paidLeaveUsedForHalfDays: money(paidLeaveUsedForHalfDays),
    halfDayDeduction: money(
      unpaidHalfDays *
        0.5 *
        dailySalary *
        (settingNumber(
          settings,
          "half_day_deduction_percent",
          "halfDayDeductionPercent",
          50,
        ) /
          50),
    ),
  };

  const halfDayDeduction = halfDayBreakdown.halfDayDeduction;
  const lateDeduction = attendance.lateCount * latePenaltyRate;
  const bonus = money(
    attendance.overtimeHours * perHourSalary * overtimeMultiplier,
  );
  dailyResults.forEach((result) => {
    result.bonus = money(
      result.overtimeHours * perHourSalary * overtimeMultiplier,
    );
    if (result.isApprovedUnpaidLeave) {
      result.deduction = money(
        dailySalary *
          (settingNumber(
            settings,
            "unpaid_leave_deduction_percent",
            "unpaidLeaveDeductionPercent",
            100,
          ) /
            100),
      );
    } else if (result.isAbsent && result.paidLeaveUsed === 0) {
      result.deduction = money(
        dailySalary *
          (settingNumber(
            settings,
            "absent_deduction_percent",
            "absentDeductionPercent",
            100,
          ) /
            100),
      );
    } else if (result.isHalfDay && result.paidLeaveUsed === 0) {
      result.deduction = money(
        0.5 *
          dailySalary *
          (settingNumber(
            settings,
            "half_day_deduction_percent",
            "halfDayDeductionPercent",
            50,
          ) /
            50),
      );
    }
    if (result.late)
      result.deduction = money(result.deduction + latePenaltyRate);
  });
  const salaryDeductions = money(
    leaveDeduction +
      sandwichDeduction +
      absentDeduction +
      halfDayDeduction +
      lateDeduction,
  );
  const payableSalary = money(period.eligibleDays * dailySalary);
  const earnedBeforeBonus = money(
    Math.max(0, payableSalary - salaryDeductions),
  );
  const finalEstimatedSalary = money(Math.max(0, earnedBeforeBonus + bonus));
  const salaryProgress =
    monthlySalary > 0
      ? Math.min(100, Math.round((earnedBeforeBonus / monthlySalary) * 100))
      : 0;

  const [payrollRows] = await pool.execute(
    "SELECT * FROM payroll WHERE employee_id = ? AND month = ? AND year = ? LIMIT 1",
    [employeeId, range.month, range.year],
  );
  const payroll = payrollRows[0] || null;

  return {
    employee: {
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      joinDate: period.joinDate,
      salary: monthlySalary,
    },
    month: range.month,
    year: range.year,
    period: { ...period, totalDays: period.eligibleDays, daysInMonth },
    attendance: {
      ...attendance,
      absentDays: actualAbsentDays,
      halfDays: effectiveHalfDays,
      overtimeHours: money(attendance.overtimeHours),
    },
    dailyPayroll: dailyResults,
    leave: {
      ...leave,
      sandwichLeaveEnabled: settings.sandwichLeaveEnabled,
      ...leaveBalance,
      paidLeaveBalance: money(
        Math.max(
          0,
          numberValue(leaveBalance.totalAvailableLeave) - totalPaidLeaveUsed,
        ),
      ),
      paidLeaveUsed: totalPaidLeaveUsed,
      paidLeaveUsedForHalfDays: halfDayBreakdown.paidLeaveUsedForHalfDays,
      paidLeaveUsedForAbsent: money(paidLeaveUsedForAbsent),
      paidLeaveUsedForApprovedLeave: money(paidLeaveUsedForApprovedLeave),
      unpaidHalfDays: halfDayBreakdown.unpaidHalfDays,
      coveredHalfDays: halfDayBreakdown.coveredHalfDays,
      unpaidLeaveDays,
      unpaidAbsentDays,
      remainingPaidLeave: money(
        Math.max(
          0,
          numberValue(leaveBalance.totalAvailableLeave) - totalPaidLeaveUsed,
        ),
      ),
    },
    salary: {
      monthlySalary,
      basicSalary: monthlySalary,
      payableSalary,
      dailySalary: money(dailySalary),
      perDaySalary: money(dailySalary),
      payableDays,
      absentDeduction: money(absentDeduction),
      leaveDeduction: money(leaveDeduction),
      halfDayDeduction: money(halfDayDeduction),
      paidLeaveBalance: money(
        Math.max(
          0,
          numberValue(leaveBalance.totalAvailableLeave) - totalPaidLeaveUsed,
        ),
      ),
      paidLeaveUsed: totalPaidLeaveUsed,
      paidLeaveUsedForFullDays: money(
        paidLeaveUsedForApprovedLeave + paidLeaveUsedForAbsent,
      ),
      paidLeaveUsedForHalfDays: halfDayBreakdown.paidLeaveUsedForHalfDays,
      paidLeaveUsedForAbsent: money(paidLeaveUsedForAbsent),
      paidLeaveUsedForApprovedLeave: money(paidLeaveUsedForApprovedLeave),
      remainingPaidLeave: money(
        Math.max(
          0,
          numberValue(leaveBalance.totalAvailableLeave) - totalPaidLeaveUsed,
        ),
      ),
      unpaidLeaveDays,
      unpaidHalfDays: halfDayBreakdown.unpaidHalfDays,
      unpaidAbsentDays,
      monthlyLeaveCredit: leaveBalance.monthlyLeaveCredit,
      carryForwardBalance: leaveBalance.carryForwardBalance,
      lateDeduction: money(lateDeduction),
      salaryDeductions,
      totalDeductions: salaryDeductions,
      otherDeductions: 0,
      bonus,
      overtimeBonus: bonus,
      otherBonus: 0,
      totalBonus: bonus,
      finalEstimatedSalary,
      netSalary: finalEstimatedSalary,
      salaryProgress,
    },
    leaveDays: leave.totalLeaveDays,
    sandwichLeaveDays: leave.sandwichLeaveDays,
    netSalary: finalEstimatedSalary,
    payrollStatus: payroll?.status || "Not Generated",
    payroll,
  };
};

const generatePayroll = async ({
  employeeId,
  month,
  year,
  status = "Pending",
}) => {
  const dashboard = await calculateSalary({ employeeId, month, year });
  const { salary } = dashboard;
  const leaveBalance = await persistMonthlyBalance({
    employeeId,
    year: dashboard.year,
    month: monthNumber(dashboard.month),
    sandwichLeaveDays: dashboard.leave.sandwichLeaveDays,
    halfDays: dashboard.attendance.halfDays,
    calculationEndDate: dashboard.period.calculationEndDate,
  });

  await pool.execute(
    `INSERT INTO payroll
      (employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
      basic_salary = VALUES(basic_salary),
      allowances = VALUES(allowances),
      deductions = VALUES(deductions),
      net_salary = VALUES(net_salary),
      payment_date = COALESCE(payment_date, CURDATE()),
      status = VALUES(status),
      updated_at = NOW()`,
    [
      employeeId,
      dashboard.month,
      dashboard.year,
      salary.basicSalary,
      salary.bonus,
      salary.salaryDeductions,
      salary.finalEstimatedSalary,
      status,
    ],
  );

  await pool.execute(
    `INSERT INTO salary
      (employee_id, month, year, monthly_salary, total_days, daily_salary, present_days, absent_days, half_days, leave_days, sandwich_leave_days, late_count,
       overtime_hours, salary_deductions, bonus, final_salary, payroll_status, paid_leave_balance, paid_leave_used, paid_leave_used_for_absent, paid_leave_used_for_half_days, unpaid_leave_days, unpaid_half_days, monthly_leave_credit, carry_forward_balance, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
      monthly_salary = VALUES(monthly_salary),
      total_days = VALUES(total_days),
      daily_salary = VALUES(daily_salary),
      present_days = VALUES(present_days),
      absent_days = VALUES(absent_days),
      half_days = VALUES(half_days),
      leave_days = VALUES(leave_days),
      sandwich_leave_days = VALUES(sandwich_leave_days),
      late_count = VALUES(late_count),
      overtime_hours = VALUES(overtime_hours),
      salary_deductions = VALUES(salary_deductions),
      bonus = VALUES(bonus),
      final_salary = VALUES(final_salary),
      payroll_status = VALUES(payroll_status),
      paid_leave_balance = VALUES(paid_leave_balance),
      paid_leave_used = VALUES(paid_leave_used),
      paid_leave_used_for_absent = VALUES(paid_leave_used_for_absent),
      paid_leave_used_for_half_days = VALUES(paid_leave_used_for_half_days),
      unpaid_leave_days = VALUES(unpaid_leave_days),
      unpaid_half_days = VALUES(unpaid_half_days),
      monthly_leave_credit = VALUES(monthly_leave_credit),
      carry_forward_balance = VALUES(carry_forward_balance),
      updated_at = NOW()`,
    [
      employeeId,
      dashboard.month,
      dashboard.year,
      salary.monthlySalary,
      dashboard.period.totalDays,
      salary.dailySalary,
      dashboard.attendance.presentDays,
      dashboard.attendance.absentDays,
      dashboard.attendance.halfDays,
      dashboard.leave.leaveDays,
      dashboard.leave.sandwichLeaveDays,
      dashboard.attendance.lateCount,
      dashboard.attendance.overtimeHours,
      salary.salaryDeductions,
      salary.bonus,
      salary.finalEstimatedSalary,
      status,
      leaveBalance.paidLeaveBalance,
      leaveBalance.paidLeaveUsed,
      leaveBalance.paidLeaveUsedForAbsent,
      leaveBalance.paidLeaveUsedForHalfDays,
      leaveBalance.unpaidLeaveDays,
      leaveBalance.unpaidHalfDays,
      leaveBalance.monthlyLeaveCredit,
      leaveBalance.carryForwardBalance,
    ],
  );

  return calculateSalary({
    employeeId,
    month: dashboard.month,
    year: dashboard.year,
  });
};

const getMonthlyReport = async ({ month, year }) => {
  const range = getMonthRange(month, year);
  const [employees] = await pool.execute(
    "SELECT id FROM employees WHERE status = 'active' ORDER BY name ASC",
  );
  const reports = await Promise.all(
    employees.map((employee) =>
      calculateSalary({
        employeeId: employee.id,
        month: range.month,
        year: range.year,
      }),
    ),
  );

  return { month: range.month, year: range.year, reports };
};

export {
  MONTHS,
  allocatePaidLeave,
  calculateHalfDayBreakdown,
  buildDailyPayrollResults,
  calculateSalary,
  generatePayroll,
  getEmployeeForUser,
  getMonthlyReport,
  normalizeMonth,
};