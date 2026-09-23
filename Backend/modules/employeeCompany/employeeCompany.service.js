import CompanySettings from '../../repositories/companySettings.repository.js';
import { ApiError } from '../../utils/ApiError.js';

const formatTime = (value) => (value ? String(value).slice(0, 5) : '');

const toEmployeeSettings = (settings = {}) => ({
  office_start_time: formatTime(settings.officeStartTime),
  office_end_time: formatTime(settings.officeEndTime),
  grace_time: Number(settings.graceTime ?? 0),
  break_start: formatTime(settings.breakStart),
  break_end: formatTime(settings.breakEnd),
  half_day_after: formatTime(settings.halfDayAfter),
  minimum_working_hours: Number(settings.minimumWorkHours ?? 0),
  week_off: settings.weekOff || '',
  attendance_type: settings.attendanceType || '',
  short_leave_time: formatTime(settings.shortLeaveTime),
  short_leave_enabled: Boolean(settings.shortLeaveEnabled),
  short_leave_duration_hours: Number(settings.shortLeaveDurationHours ?? 0),
  short_leaves_for_half_day: Number(settings.monthlyShortLeaveLimit ?? settings.shortLeavesForHalfDay ?? 0),
  monthly_short_leave_limit: Number(settings.monthlyShortLeaveLimit ?? settings.shortLeavesForHalfDay ?? 0),
  short_leave_reset_period: settings.shortLeaveResetPeriod || 'Monthly',
  paid_leave_days: Number(settings.paidLeaveDays ?? 0),
});

const toEmployeePolicy = (policy = {}) => ({
  id: policy.id,
  title: policy.title,
  details: policy.content || '',
  published: Boolean(policy.isPublished),
});

const toEmployeeRule = (rule = {}) => ({
  id: rule.id,
  title: rule.title,
  details: rule.description || '',
  active: Boolean(rule.isActive),
});

export const getCompanyInformationService = async () => {
  try {
    const [settings, policies, rules] = await Promise.all([
      CompanySettings.get(),
      CompanySettings.listPolicies({ publicOnly: true }),
      CompanySettings.listRules({ activeOnly: true }),
    ]);

    return {
      settings: toEmployeeSettings(settings),
      policies: (policies || []).map(toEmployeePolicy),
      rules: (rules || []).map(toEmployeeRule),
    };
  } catch {
    throw new ApiError(500, 'Unable to load company information');
  }
};
