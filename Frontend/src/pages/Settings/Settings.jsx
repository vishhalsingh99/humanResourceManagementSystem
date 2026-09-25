import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes.constants';
import { X } from 'lucide-react';
import {
  createCompanyPolicy,
  createCompanyRule,
  deleteCompanyPolicy,
  deleteCompanyRule,
  getCompanyPolicies,
  getCompanyRules,
  getCompanySettings,
  updateCompanyPolicy,
  updateCompanyRule,
  updateCompanySettings,
} from '../../api/settingsApi';
import { getNetworkInfo } from '../../api/attendanceApi';

const roleOptions = ['admin', 'manager', 'employee'];
const weekOffOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const attendanceTypeOptions = ['Wi-Fi', 'Fingerprint', 'Camera', 'Multiple'];

const defaultSettings = {
  officeStartTime: '09:30',
  officeEndTime: '18:30',
  graceTime: 10,
  halfDayAfter: '13:30',
  minimumWorkHours: 8,
  weekOff: 'Sunday',
  breakStart: '13:00',
  breakEnd: '14:00',
  shortLeaveEnabled: false,
  shortLeaveDurationHours: 1,
  monthlyShortLeaveLimit: 3,
  shortLeavesForHalfDay: 3,
  shortLeaveResetPeriod: 'Monthly',
  paidLeaveDays: 1,
  enablePaidLeave: true,
  absentCanUsePaidLeave: false,
  monthlyPaidLeaveCredit: 1,
  carryForwardEnabled: true,
  maximumCarryForwardDays: null,
  paidLeaveExpiry: 'NEVER',
  approvedLeaveIsPaid: true,
  paidLeaveCanCoverHalfDay: true,
  halfDayDeductionPercent: 50,
  unpaidLeaveDeductionPercent: 100,
  absentDeductionPercent: 100,
  halfDayEnabled: true,
  halfDayPaidPercentage: 50,
  onePaidLeaveCoversHalfDays: 2,
  attendanceType: 'Multiple',
  wifiEnabled: false,
  wifiAllowedIps: [],
  fingerprintEnabled: false,
  cameraEnabled: false,
  sandwichLeaveEnabled: false,
};

const emptyPolicy = { id: null, title: '', content: '', isPublished: false };
const emptyRule = { id: null, title: '', description: '', isActive: true };

export default function Settings() {
  const {
  user,
  defaultRole,
  setDefaultRole,
  showToast,
  hasPermission,
} = useApp();
  const [role, setRole] = useState(defaultRole);
  const [settings, setSettings] = useState(defaultSettings);
  const [policies, setPolicies] = useState([]);
  const [rules, setRules] = useState([]);
  const [policyForm, setPolicyForm] = useState(emptyPolicy);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [detectingIp, setDetectingIp] = useState(false);

  const canEdit = hasPermission('settings.edit');

  const attendanceMethodEnabled = useMemo(
    () => settings.wifiEnabled || settings.fingerprintEnabled || settings.cameraEnabled,
    [settings.cameraEnabled, settings.fingerprintEnabled, settings.wifiEnabled]
  );

  useEffect(() => {
    let active = true;

    async function loadSettingsPage() {
      setLoading(true);
      try {
        const [settingsResponse, policiesResponse, rulesResponse] = await Promise.all([
          getCompanySettings(),
          getCompanyPolicies(),
          getCompanyRules(),
        ]);

        if (!active) return;
        setSettings({ ...defaultSettings, ...settingsResponse.data });
        setPolicies(policiesResponse.data || []);
        setRules(rulesResponse.data || []);
      } catch (error) {
        showToast(error.response?.data?.error || 'Unable to load settings', 'error');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettingsPage();
    return () => {
      active = false;
    };
  }, [showToast]);

  const reloadPolicies = async () => {
    const response = await getCompanyPolicies();
    setPolicies(response.data || []);
  };

  const reloadRules = async () => {
    const response = await getCompanyRules();
    setRules(response.data || []);
  };

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSaveCompanySettings = async (event) => {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      const payload = { ...settings };
      if (!payload.shortLeaveEnabled) {
        delete payload.shortLeaveDurationHours;
        delete payload.monthlyShortLeaveLimit;
        delete payload.shortLeavesForHalfDay;
        delete payload.shortLeaveResetPeriod;
      }
      const response = await updateCompanySettings(payload);
      setSettings({ ...defaultSettings, ...response.data });
      showToast('Company settings saved', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to save company settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicy = async (event) => {
    event.preventDefault();
    if (!canEdit) return;

    try {
      const payload = {
        title: policyForm.title,
        content: policyForm.content,
        isPublished: policyForm.isPublished,
      };
      if (policyForm.id) await updateCompanyPolicy(policyForm.id, payload);
      else await createCompanyPolicy(payload);
      setPolicyForm(emptyPolicy);
      await reloadPolicies();
      showToast('Policy saved', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to save policy', 'error');
    }
  };

  const handleSaveRule = async (event) => {
    event.preventDefault();
    if (!canEdit) return;

    try {
      const payload = {
        title: ruleForm.title,
        description: ruleForm.description,
        isActive: ruleForm.isActive,
      };
      if (ruleForm.id) await updateCompanyRule(ruleForm.id, payload);
      else await createCompanyRule(payload);
      setRuleForm(emptyRule);
      await reloadRules();
      showToast('Rule saved', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to save rule', 'error');
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!canEdit) return;
    await deleteCompanyPolicy(policyId);
    await reloadPolicies();
    showToast('Policy deleted', 'success');
  };

  const handleDeleteRule = async (ruleId) => {
    if (!canEdit) return;
    await deleteCompanyRule(ruleId);
    await reloadRules();
    showToast('Rule deleted', 'success');
  };

  const handleSaveRole = (event) => {
    event.preventDefault();
    setDefaultRole(role);
    showToast(`Default sign-up role set to ${role}`, 'success');
  };

  const handleDetectCurrentIp = async () => {
    setDetectingIp(true);
    try {
      const response = await getNetworkInfo();
      setNewIp(response.data.ip);
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to detect IP address', 'error');
    } finally {
      setDetectingIp(false);
    }
  };

  const handleAddIp = () => {
    const trimmedIp = newIp.trim();
    if (!trimmedIp) {
      showToast('Please enter an IP address', 'error');
      return;
    }

    if (settings.wifiAllowedIps.includes(trimmedIp)) {
      showToast('This IP is already added', 'error');
      return;
    }

    updateSetting('wifiAllowedIps', [...settings.wifiAllowedIps, trimmedIp]);
    setNewIp('');
    showToast('IP address added', 'success');
  };

  const handleRemoveIp = (ip) => {
    updateSetting('wifiAllowedIps', settings.wifiAllowedIps.filter((item) => item !== ip));
    showToast('IP address removed', 'success');
  };

  return (
    <div className="p-4 sm:p-6 mt-18 lg:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold t-text-heading">Settings</h1>
          <p className="mt-2 text-sm t-text-muted">Manage office timings, attendance methods, policies, and rules.</p>
        </div>
        {loading && <span className="text-sm font-semibold t-text-subtle">Loading...</span>}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Link to={ROUTES.SETTINGS_ROLES_PERMISSIONS} className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 no-underline shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md transition hover:scale-[1.01] hover:border-red-500/40">
          <h2 className="text-lg font-bold t-text-heading">Roles &amp; Permissions</h2>
          <p className="mt-2 text-sm t-text-muted">Create custom roles and manage inherited employee access.</p>
        </Link>

        <Link to={ROUTES.SETTINGS_COMPANY} className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 no-underline shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md transition hover:scale-[1.01] hover:border-red-500/40">
          <h2 className="text-lg font-bold t-text-heading">Company Details</h2>
          <p className="mt-2 text-sm t-text-muted">Edit company master details, address, contact info, and logo.</p>
        </Link>

        <Link to={ROUTES.SETTINGS_SUBSCRIPTION} className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 no-underline shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md transition hover:scale-[1.01] hover:border-red-500/40">
          <h2 className="text-lg font-bold t-text-heading">Subscription Plan</h2>
          <p className="mt-2 text-sm t-text-muted">Review or change the plan selected during onboarding.</p>
        </Link>
      </div>

      <form onSubmit={handleSaveCompanySettings} className="rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
        <div className="flex flex-col gap-2 border-b t-divider pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold t-text-heading">Office Timing</h2>
            <p className="mt-1 text-sm t-text-muted">These values drive attendance late, half-day, and work-hour calculations.</p>
          </div>
          {!canEdit && <span className="text-sm font-semibold t-text-subtle">Read-only</span>}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field id="office-start-time" label="Office Start Time" type="time" value={settings.officeStartTime} disabled={!canEdit} onChange={(value) => updateSetting('officeStartTime', value)} />
          <Field id="office-end-time" label="Office End Time" type="time" value={settings.officeEndTime} disabled={!canEdit} onChange={(value) => updateSetting('officeEndTime', value)} />
          <Field id="grace-time" label="Grace Time" type="number" min="0" value={settings.graceTime} disabled={!canEdit} onChange={(value) => updateSetting('graceTime', Number(value))} suffix="minutes" />
          <Field id="break-start" label="Break Start" type="time" value={settings.breakStart} disabled={!canEdit} onChange={(value) => updateSetting('breakStart', value)} />
          <Field id="break-end" label="Break End" type="time" value={settings.breakEnd} disabled={!canEdit} onChange={(value) => updateSetting('breakEnd', value)} />
          <Field id="half-day-after" label="Half Day After" type="time" value={settings.halfDayAfter} disabled={!canEdit} onChange={(value) => updateSetting('halfDayAfter', value)} />
          <Field id="minimum-working-hours" label="Minimum Working Hours" type="number" min="1" step="0.25" value={settings.minimumWorkHours} disabled={!canEdit} onChange={(value) => updateSetting('minimumWorkHours', Number(value))} />
          <Field id="paid-leave-days" label="Paid Leave Days" type="number" min="0" value={settings.paidLeaveDays} disabled={!canEdit} onChange={(value) => updateSetting('paidLeaveDays', Number(value))} />
          <div>
            <label htmlFor="week-off" className="mb-2 block text-sm font-semibold t-text-secondary">Week Off</label>
            <select id="week-off" value={settings.weekOff} disabled={!canEdit} onChange={(event) => updateSetting('weekOff', event.target.value)} className="w-full rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] disabled:opacity-50">
              {weekOffOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="attendance-type" className="mb-2 block text-sm font-semibold t-text-secondary">Attendance Type</label>
            <select id="attendance-type" value={settings.attendanceType} disabled={!canEdit} onChange={(event) => updateSetting('attendanceType', event.target.value)} className="w-full rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] disabled:opacity-50">
              {attendanceTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>

        <h2 className="mt-8 border-t t-divider pt-6 text-2xl font-semibold t-text-heading">Attendance</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Toggle label="Enable Wi-Fi Attendance" checked={settings.wifiEnabled} disabled={!canEdit} onChange={(checked) => updateSetting('wifiEnabled', checked)} />
          <Toggle label="Enable Fingerprint Attendance" checked={settings.fingerprintEnabled} disabled={!canEdit} onChange={(checked) => updateSetting('fingerprintEnabled', checked)} />
          <Toggle label="Enable Camera Attendance" checked={settings.cameraEnabled} disabled={!canEdit} onChange={(checked) => updateSetting('cameraEnabled', checked)} />
        </div>
        {!attendanceMethodEnabled && <p className="mt-3 text-sm font-medium text-amber-400">At least one attendance method should be enabled before rollout.</p>}

        {settings.wifiEnabled && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-[var(--bg-input)] p-5">
            <h3 className="font-semibold t-text-heading">Office Network Configuration</h3>
            <p className="mt-1 text-sm t-text-muted">Configure allowed office public IP addresses for Wi-Fi attendance verification.</p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="e.g., 103.120.45.10 or 103.120.45.0/24"
                disabled={!canEdit || detectingIp}
                className="flex-1 rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-2 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleDetectCurrentIp}
                disabled={!canEdit || detectingIp}
                className="cursor-pointer rounded-xl border t-border bg-[var(--bg-input)] px-4 py-2 text-sm font-semibold t-text-secondary transition hover:border-red-500/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {detectingIp ? 'Detecting...' : 'Detect IP'}
              </button>
              <button
                type="button"
                onClick={handleAddIp}
                disabled={!canEdit || !newIp.trim()}
                className="cursor-pointer rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add IP
              </button>
            </div>

            {settings.wifiAllowedIps.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold t-text-secondary">Allowed Office IPs</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {settings.wifiAllowedIps.map((ip) => (
                    <div key={ip} className="flex items-center gap-2 rounded-full border t-border bg-[var(--bg-input)] px-3 py-1 text-sm">
                      <span className="t-text-secondary">{ip}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIp(ip)}
                          className="cursor-pointer t-text-subtle transition hover:text-rose-400"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 border-t t-divider pt-5">
          <h2 className="text-2xl font-semibold t-text-heading">Leave &amp; Salary Policy</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Toggle label="Enable Paid Leave" checked={settings.enablePaidLeave} disabled={!canEdit} onChange={(checked) => updateSetting('enablePaidLeave', checked)} />
            <Toggle label="Absent Can Use Paid Leave" checked={settings.absentCanUsePaidLeave} disabled={!canEdit} onChange={(checked) => updateSetting('absentCanUsePaidLeave', checked)} />
            <Field id="monthly-paid-leave-credit" label="Monthly Paid Leave" type="number" min="0" step="0.5" value={settings.monthlyPaidLeaveCredit} disabled={!canEdit} onChange={(value) => updateSetting('monthlyPaidLeaveCredit', Number(value))} />
            <Toggle label="Carry Forward" checked={settings.carryForwardEnabled} disabled={!canEdit} onChange={(checked) => updateSetting('carryForwardEnabled', checked)} />
            <Field id="maximum-carry-forward-days" label="Maximum Carry Forward" type="number" min="0" step="0.5" value={settings.maximumCarryForwardDays ?? ''} disabled={!canEdit} onChange={(value) => updateSetting('maximumCarryForwardDays', value === '' ? null : Number(value))} />
            <div>
              <label htmlFor="paid-leave-expiry" className="mb-2 block text-sm font-semibold t-text-secondary">Paid Leave Expiry</label>
              <select id="paid-leave-expiry" value={settings.paidLeaveExpiry ?? 'NEVER'} disabled={!canEdit} onChange={(event) => updateSetting('paidLeaveExpiry', event.target.value)} className="w-full rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] disabled:opacity-50">
                {['NEVER', 'MONTHLY', 'FINANCIAL_YEAR', 'CUSTOM'].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <Toggle label="Paid Leave Can Cover Half Day" checked={settings.paidLeaveCanCoverHalfDay} disabled={!canEdit} onChange={(checked) => updateSetting('paidLeaveCanCoverHalfDay', checked)} />
            <Field id="half-day-deduction-percent" label="Half Day Deduction" type="number" min="0" max="100" step="1" value={settings.halfDayDeductionPercent} disabled={!canEdit} onChange={(value) => updateSetting('halfDayDeductionPercent', Number(value))} suffix="%" />
            <Field id="unpaid-leave-deduction-percent" label="Unpaid Leave Deduction" type="number" min="0" max="100" step="1" value={settings.unpaidLeaveDeductionPercent} disabled={!canEdit} onChange={(value) => updateSetting('unpaidLeaveDeductionPercent', Number(value))} suffix="%" />
            <Field id="absent-deduction-percent" label="Absent Deduction" type="number" min="0" max="100" step="1" value={settings.absentDeductionPercent} disabled={!canEdit} onChange={(value) => updateSetting('absentDeductionPercent', Number(value))} suffix="%" />
            <Toggle label="Half Day Enabled" checked={settings.halfDayEnabled} disabled={!canEdit} onChange={(checked) => updateSetting('halfDayEnabled', checked)} />
            <Field id="one-paid-leave-covers-half-days" label="One Paid Leave Covers" type="number" min="1" step="1" value={settings.onePaidLeaveCoversHalfDays} disabled={!canEdit} onChange={(value) => updateSetting('onePaidLeaveCoversHalfDays', Number(value))} suffix="Half Days" />
          </div>
        </div>

        <div className="mt-6 border-t t-divider pt-5">
          <Toggle label="Sandwich leave policy" checked={settings.sandwichLeaveEnabled} disabled={!canEdit} onChange={(checked) => updateSetting('sandwichLeaveEnabled', checked)} />
        </div>

        <div className="mt-6 border-t t-divider pt-5">
          <Toggle label="Enable Short Leave" checked={settings.shortLeaveEnabled} disabled={!canEdit} onChange={(checked) => updateSetting('shortLeaveEnabled', checked)} />
          {settings.shortLeaveEnabled && (
            <div className="mt-4">
              <p className="mb-4 rounded-xl border border-red-500/20 bg-[var(--bg-input)] p-3 text-sm t-text-secondary">
                Employees arriving after the grace period can receive short leave within the configured duration. Once the monthly limit is reached, every later arrival after grace is automatically marked as Half Day.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <Field id="short-leave-duration" label="Short Leave Duration" type="number" min="0.25" step="0.25" required value={settings.shortLeaveDurationHours} disabled={!canEdit} onChange={(value) => updateSetting('shortLeaveDurationHours', Number(value))} suffix="hours" />
                <Field id="monthly-short-leave-limit" label="Monthly Short Leave Limit" type="number" min="1" step="1" required value={settings.monthlyShortLeaveLimit ?? settings.shortLeavesForHalfDay} disabled={!canEdit} onChange={(value) => {
                  const numericValue = Number(value);
                  updateSetting('monthlyShortLeaveLimit', numericValue);
                  updateSetting('shortLeavesForHalfDay', numericValue);
                }} suffix="days" />
                <div>
                  <label htmlFor="short-leave-reset-period" className="mb-2 block text-sm font-semibold t-text-secondary">Short Leave Reset Period</label>
                  <select id="short-leave-reset-period" required value={settings.shortLeaveResetPeriod} disabled={!canEdit} onChange={(event) => updateSetting('shortLeaveResetPeriod', event.target.value)} className="w-full rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] disabled:opacity-50">
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {canEdit && (
          <button type="submit" disabled={saving || loading} className="mt-6 cursor-pointer rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving...' : 'Save company settings'}
          </button>
        )}
      </form>

      <section className="mt-6 rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
        <h2 className="text-2xl font-semibold t-text-heading">Company Policies &amp; Rules</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <PolicyPanel canEdit={canEdit} policies={policies} form={policyForm} setForm={setPolicyForm} onSubmit={handleSavePolicy} onDelete={handleDeletePolicy} />
          <RulePanel canEdit={canEdit} rules={rules} form={ruleForm} setForm={setRuleForm} onSubmit={handleSaveRule} onDelete={handleDeleteRule} />
        </div>
      </section>

      {canEdit && (
        <section className="mt-6 rounded-2xl border t-border bg-[var(--bg-surface)] p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7">
          <h2 className="text-2xl font-semibold t-text-heading">Default Role for Sign Ups</h2>
          <form onSubmit={handleSaveRole} className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border t-divider bg-[var(--bg-input)] p-4 text-sm t-text-secondary">
              <p className="font-semibold t-text-heading">{user?.name || 'Unknown User'}</p>
              <p className="mt-1">Email: {user?.email || 'N/A'}</p>
              <p className="mt-1">Role: {user?.role || 'N/A'}</p>
            </div>
            <div>
              <label htmlFor="default-role" className="mb-2 block text-sm font-semibold t-text-secondary">Default role for new signups</label>
              <select id="default-role" value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-xl border t-border-in bg-[var(--bg-input)] px-4 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]">
                {roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="cursor-pointer rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400">Save settings</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

function Field({ id, label, suffix, onChange, ...props }) {
  const inputId = id || `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-field`;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold t-text-secondary">{label}</label>
      <div className="flex overflow-hidden rounded-xl border t-border-in bg-[var(--bg-input)] transition focus-within:border-red-500/70 focus-within:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]">
        <input id={inputId} {...props} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm t-text-primary outline-none disabled:opacity-50" />
        {suffix && <span className="border-l t-divider bg-[var(--bg-input)] px-3 py-3 text-sm t-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

function Toggle({ id, label, checked, disabled, onChange }) {
  const inputId = id || `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-toggle`;

  return (
    <label htmlFor={inputId} className="flex items-center justify-between gap-3 rounded-xl border t-divider bg-[var(--bg-input)] px-4 py-3">
      <span className="text-sm font-semibold t-text-secondary">{label}</span>
      <input id={inputId} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-red-500" />
    </label>
  );
}

function PolicyPanel({ canEdit, policies, form, setForm, onSubmit, onDelete }) {
  return (
    <div>
      <h3 className="text-base font-bold t-text-heading">Policies</h3>
      {canEdit && (
        <form onSubmit={onSubmit} className="mt-3 grid gap-3">
          <div className="grid gap-2">
            <label htmlFor="policy-title" className="text-sm font-semibold t-text-secondary">Policy title</label>
            <input id="policy-title" aria-label="Policy title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Policy title" className="rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="policy-details" className="text-sm font-semibold t-text-secondary">Policy details</label>
            <textarea id="policy-details" aria-label="Policy details" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Policy details" rows={4} className="rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
          </div>
          <Toggle label="Published" checked={form.isPublished} onChange={(checked) => setForm({ ...form, isPublished: checked })} />
          <button type="submit" className="cursor-pointer rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400">{form.id ? 'Update policy' : 'Create policy'}</button>
        </form>
      )}
      <div className="mt-4 grid gap-3">
        {policies.map((policy) => (
          <article key={policy.id} className="rounded-xl border t-divider bg-[var(--bg-input)] p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-semibold t-text-heading">{policy.title}</h4>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${policy.isPublished ? 'bg-emerald-500/15 text-emerald-300' : 'bg-neutral-800 t-text-muted'}`}>{policy.isPublished ? 'Published' : 'Draft'}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm t-text-muted">{policy.content}</p>
            {canEdit && (
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setForm(policy)} className="cursor-pointer rounded-xl border t-border bg-[var(--bg-input)] px-3 py-2 text-sm font-semibold t-text-secondary transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300">Edit</button>
                <button type="button" onClick={() => onDelete(policy.id)} className="cursor-pointer rounded-xl border t-border bg-[var(--bg-input)] px-3 py-2 text-sm font-semibold text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10">Delete</button>
              </div>
            )}
          </article>
        ))}
        {!policies.length && <p className="text-sm t-text-subtle">No policies available.</p>}
      </div>
    </div>
  );
}

function RulePanel({ canEdit, rules, form, setForm, onSubmit, onDelete }) {
  return (
    <div>
      <h3 className="text-base font-bold t-text-heading">Rules</h3>
      {canEdit && (
        <form onSubmit={onSubmit} className="mt-3 grid gap-3">
          <div className="grid gap-2">
            <label htmlFor="rule-title" className="text-sm font-semibold t-text-secondary">Rule title</label>
            <input id="rule-title" aria-label="Rule title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Rule title" className="rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="rule-details" className="text-sm font-semibold t-text-secondary">Rule details</label>
            <textarea id="rule-details" aria-label="Rule details" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Rule details" rows={4} className="rounded-xl border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm t-text-primary outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
          </div>
          <Toggle label="Active" checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })} />
          <button type="submit" className="cursor-pointer rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400">{form.id ? 'Update rule' : 'Create rule'}</button>
        </form>
      )}
      <div className="mt-4 grid gap-3">
        {rules.map((rule) => (
          <article key={rule.id} className="rounded-xl border t-divider bg-[var(--bg-input)] p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-semibold t-text-heading">{rule.title}</h4>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${rule.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-neutral-800 t-text-muted'}`}>{rule.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm t-text-muted">{rule.description}</p>
            {canEdit && (
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setForm(rule)} className="cursor-pointer rounded-xl border t-border bg-[var(--bg-input)] px-3 py-2 text-sm font-semibold t-text-secondary transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300">Edit</button>
                <button type="button" onClick={() => onDelete(rule.id)} className="cursor-pointer rounded-xl border t-border bg-[var(--bg-input)] px-3 py-2 text-sm font-semibold text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10">Delete</button>
              </div>
            )}
          </article>
        ))}
        {!rules.length && <p className="text-sm t-text-subtle">No rules available.</p>}
      </div>
    </div>
  );
}