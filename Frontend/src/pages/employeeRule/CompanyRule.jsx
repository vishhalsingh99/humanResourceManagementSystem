import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api/axios';

const defaultInformation = {
  settings: {},
  policies: [],
  rules: [],
};

const formatValue = (value, fallback = 'Not set') => {
  if (value === undefined || value === null || value === '') return fallback;
  return value;
};

export default function CompanyRule() {
  const [companyInformation, setCompanyInformation] = useState(defaultInformation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCompanyInformation() {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/employee/company-information');
        if (!active) return;
        setCompanyInformation({
          settings: response.data?.settings || {},
          policies: Array.isArray(response.data?.policies) ? response.data.policies : [],
          rules: Array.isArray(response.data?.rules) ? response.data.rules : [],
        });
      } catch (requestError) {
        if (!active) return;
        setError(requestError.response?.data?.error || 'Unable to load company information.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCompanyInformation();

    return () => {
      active = false;
    };
  }, []);

  const scheduleItems = useMemo(() => {
    const settings = companyInformation.settings || {};

    return [
      { label: 'Office Start Time', value: formatValue(settings.office_start_time), icon: Clock3 },
      { label: 'Office End Time', value: formatValue(settings.office_end_time), icon: Clock3 },
      {
        label: 'Lunch Break',
        value:
          settings.break_start || settings.break_end
            ? `${formatValue(settings.break_start)} - ${formatValue(settings.break_end)}`
            : 'Not set',
        icon: Clock3,
      },
      { label: 'Grace Time', value: `${formatValue(settings.grace_time, 0)} minutes`, icon: ShieldCheck },
      { label: 'Half Day After', value: formatValue(settings.half_day_after), icon: Clock3 },
      {
        label: 'Minimum Working Hours',
        value: `${formatValue(settings.minimum_working_hours, 0)} hours`,
        icon: CheckCircle2,
      },
      { label: 'Week Off', value: formatValue(settings.week_off), icon: CalendarDays },
      { label: 'Attendance Type', value: formatValue(settings.attendance_type), icon: Building2 },
      ...(settings.short_leave_enabled
        ? [
          {
            label: 'Short Leave Duration',
            value: `${Number(settings.short_leave_duration_hours ?? 0)} hours`,
            icon: Clock3,
          },
          {
            label: 'Monthly Short Leave Limit',
            value: `${Number(settings.monthly_short_leave_limit ?? settings.short_leaves_for_half_day ?? 0)} (${formatValue(settings.short_leave_reset_period)})`,
            icon: Clock3,
          },
        ]
        : []),
    ];
  }, [companyInformation.settings]);

  if (loading) {
    return (
      <div className="mt-18 flex min-h-[60vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
          <div>
            <p className="text-base font-semibold text-slate-900">Loading company information</p>
            <p className="mt-1 text-sm text-slate-500">Fetching your office schedule, policies, and rules.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-18 min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Company Information</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            View your office schedule, published company policies, and active workplace rules.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.95fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Office Schedule</h2>
              <p className="text-sm text-slate-500">Current attendance and timing settings.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {scheduleItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                    <Icon className="h-4 w-4 text-blue-600" />
                    <span>{item.label}</span>
                  </div>
                  <p className="mt-2 text-base font-bold text-slate-950">{item.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Company Policies</h2>
              <p className="text-sm text-slate-500">Published policies for employees.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {companyInformation.policies.map((policy) => (
              <article key={policy.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <FileText className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <h3 className=" wrap-break-word text-base font-bold text-slate-950">{policy.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap  wrap-break-word text-sm leading-6 text-slate-600">{policy.details}</p>
                  </div>
                </div>
              </article>
            ))}

            {!companyInformation.policies.length && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No policies available.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Company Rules</h2>
              <p className="text-sm text-slate-500">Active workplace rules and expectations.</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {companyInformation.rules.map((rule) => (
              <article key={rule.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <h3 className=" wrap-break-word text-base font-bold text-slate-950">{rule.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap  wrap-break-word text-sm leading-6 text-slate-600">{rule.details}</p>
                  </div>
                </div>
              </article>
            ))}

            {!companyInformation.rules.length && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center lg:col-span-2">
                <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No rules available.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
