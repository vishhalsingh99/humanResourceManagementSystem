import { z } from 'zod';
import { isValidIpAddress } from '../../services/attendanceNetworkService.js';

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return Boolean(value);
};

const validateTime = (value, label, ctx) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(value || ''))) {
    ctx.addIssue({ code: 'custom', message: `${label} must be in HH:mm format` });
  }
};

export const companySettingsSchema = z.object({}).passthrough().superRefine((payload, ctx) => {
  const timeFields = [
    ['officeStartTime', 'office start time'],
    ['officeEndTime', 'office end time'],
    ['halfDayAfter', 'half day after'],
    ['breakStart', 'break start'],
    ['breakEnd', 'break end'],
  ];

  timeFields.forEach(([field, label]) => {
    const value = payload[field] ?? payload[field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)];
    if (value !== undefined && value !== null && value !== '') validateTime(value, label, ctx);
  });

  const graceValue = payload.graceTime ?? payload.grace_time;
  const graceTime = Number(graceValue);
  if (graceValue !== undefined && (!Number.isFinite(graceTime) || graceTime < 0 || graceTime > 240)) {
    ctx.addIssue({ code: 'custom', message: 'Grace time must be between 0 and 240 minutes' });
  }

  const minimumValue = payload.minimumWorkHours ?? payload.minimum_work_hours;
  const minimumWorkHours = Number(minimumValue);
  if (minimumValue !== undefined && (!Number.isFinite(minimumWorkHours) || minimumWorkHours <= 0 || minimumWorkHours > 24)) {
    ctx.addIssue({ code: 'custom', message: 'Minimum work hours must be between 1 and 24' });
  }

  const attendanceType = payload.attendanceType ?? payload.attendance_type;
  if (attendanceType !== undefined && !['Wi-Fi', 'Fingerprint', 'Camera', 'Multiple'].includes(attendanceType)) {
    ctx.addIssue({ code: 'custom', message: 'Attendance type must be Wi-Fi, Fingerprint, Camera, or Multiple' });
  }

  const weekOff = payload.weekOff ?? payload.week_off;
  if (weekOff !== undefined && !String(weekOff).trim()) {
    ctx.addIssue({ code: 'custom', message: 'Week off is required' });
  }

  const shortLeaveEnabledValue = payload.shortLeaveEnabled ?? payload.short_leave_enabled;
  if (parseBoolean(shortLeaveEnabledValue)) {
    const durationValue = payload.shortLeaveDurationHours ?? payload.short_leave_duration_hours;
    const thresholdValue = payload.monthlyShortLeaveLimit ?? payload.monthly_short_leave_limit ?? payload.shortLeaveLimit ?? payload.short_leave_limit ?? payload.shortLeavesForHalfDay ?? payload.short_leaves_for_half_day;
    const resetPeriod = payload.shortLeaveResetPeriod ?? payload.short_leave_reset_period;
    const duration = Number(durationValue);
    const threshold = Number(thresholdValue);

    if (durationValue === undefined || durationValue === null || durationValue === '' || !Number.isFinite(duration) || duration <= 0 || duration > 24) {
      ctx.addIssue({ code: 'custom', message: 'Short leave duration must be a positive value up to 24 hours' });
    }
    if (thresholdValue === undefined || thresholdValue === null || thresholdValue === '' || !Number.isInteger(threshold) || threshold <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Monthly short leave limit must be a positive whole number' });
    }
    if (!['Monthly', 'Yearly'].includes(resetPeriod)) {
      ctx.addIssue({ code: 'custom', message: 'Short leave reset period must be Monthly or Yearly' });
    }
  }

  const paidLeaveCredit = Number(payload.monthlyPaidLeaveCredit ?? payload.monthly_paid_leave_credit ?? payload.paidLeaveDays ?? 1);
  if (!Number.isFinite(paidLeaveCredit) || paidLeaveCredit < 0) {
    ctx.addIssue({ code: 'custom', message: 'Monthly paid leave credit must be a non-negative number' });
  }

  const absentCanUsePaidLeave = payload.absentCanUsePaidLeave ?? payload.absent_can_use_paid_leave;
  if (absentCanUsePaidLeave !== undefined && typeof absentCanUsePaidLeave !== 'boolean' && !['true', 'false', '0', '1', 0, 1].includes(absentCanUsePaidLeave)) {
    ctx.addIssue({ code: 'custom', message: 'Absent can use paid leave must be a boolean' });
  }

  const maxCarryForward = payload.maximumCarryForwardDays ?? payload.maximum_carry_forward_days;
  if (maxCarryForward !== undefined && maxCarryForward !== null && maxCarryForward !== '' && (!Number.isFinite(Number(maxCarryForward)) || Number(maxCarryForward) < 0)) {
    ctx.addIssue({ code: 'custom', message: 'Maximum carry forward days must be a non-negative number when specified' });
  }

  const halfDayDeductionPercent = Number(payload.halfDayDeductionPercent ?? payload.half_day_deduction_percent ?? 50);
  if (!Number.isFinite(halfDayDeductionPercent) || halfDayDeductionPercent < 0 || halfDayDeductionPercent > 100) {
    ctx.addIssue({ code: 'custom', message: 'Half day deduction percent must be between 0 and 100' });
  }

  const unpaidLeaveDeductionPercent = Number(payload.unpaidLeaveDeductionPercent ?? payload.unpaid_leave_deduction_percent ?? 100);
  if (!Number.isFinite(unpaidLeaveDeductionPercent) || unpaidLeaveDeductionPercent < 0 || unpaidLeaveDeductionPercent > 100) {
    ctx.addIssue({ code: 'custom', message: 'Unpaid leave deduction percent must be between 0 and 100' });
  }

  const absentDeductionPercent = Number(payload.absentDeductionPercent ?? payload.absent_deduction_percent ?? 100);
  if (!Number.isFinite(absentDeductionPercent) || absentDeductionPercent < 0 || absentDeductionPercent > 100) {
    ctx.addIssue({ code: 'custom', message: 'Absent deduction percent must be between 0 and 100' });
  }

  const onePaidLeaveCovers = Number(payload.onePaidLeaveCoversHalfDays ?? payload.one_paid_leave_covers_half_days ?? 2);
  if (!Number.isFinite(onePaidLeaveCovers) || onePaidLeaveCovers <= 0) {
    ctx.addIssue({ code: 'custom', message: 'One paid leave must cover a positive number of half days' });
  }

  const wifiAllowedIps = payload.wifiAllowedIps ?? payload.wifi_allowed_ips;
  if (wifiAllowedIps !== undefined && Array.isArray(wifiAllowedIps)) {
    const seenIps = new Set();
    for (const ip of wifiAllowedIps) {
      const trimmedIp = String(ip || '').trim();
      if (!trimmedIp) continue;

      if (seenIps.has(trimmedIp)) {
        ctx.addIssue({ code: 'custom', message: `Duplicate IP address: ${trimmedIp}` });
        continue;
      }

      if (!isValidIpAddress(trimmedIp)) {
        ctx.addIssue({ code: 'custom', message: `Invalid IP address: ${trimmedIp}` });
      }

      seenIps.add(trimmedIp);
    }
  }
});

export const policySchema = z.object({
  title: z.string().trim().optional(),
  content: z.string().trim().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.title?.trim() || !data.content?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Policy title and content are required' });
  }
});

export const ruleSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.title?.trim() || !data.description?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Rule title and description are required' });
  }
});
