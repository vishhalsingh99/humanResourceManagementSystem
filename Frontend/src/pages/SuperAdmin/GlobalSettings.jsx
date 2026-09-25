import { useEffect, useState } from 'react';
import { getGlobalSettings, updateGlobalSettings } from '../../api/superAdminApi';
import { useApp } from '../../context/AppContext';

const emptySettings = {
  applicationName: 'HRMS',
  applicationLogo: '',
  smtpSettings: { host: '', port: '', user: '', from: '' },
  storageSettings: { provider: '', bucket: '', region: '' },
  jwtExpiry: '7d',
  maintenanceMode: false,
  trialDays: 14,
};

export default function SuperAdminGlobalSettings() {
  const { showToast } = useApp();
  const [settings, setSettings] = useState(emptySettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGlobalSettings().then((response) => {
      setSettings({
        ...emptySettings,
        ...response.data,
        smtpSettings: { ...emptySettings.smtpSettings, ...(response.data.smtpSettings || {}) },
        storageSettings: { ...emptySettings.storageSettings, ...(response.data.storageSettings || {}) },
      });
    });
  }, []);

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const updateNested = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    await updateGlobalSettings(settings);
    setSaving(false);
    showToast('Global settings updated', 'success');
  };

  return (
    <div className="p-10 mt-18">
      <div className="mb-7">
        <h2 className="m-0 text-2xl font-semibold t-text-heading">Global Settings</h2>
        <p className="mt-1 text-sm t-text-subtle">Application-wide configuration for the HRMS platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <section className="bg-[var(--bg-surface)] p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold t-text-heading">Application</h3>
          <label className="mb-4 block text-sm font-semibold t-text-secondary">
            Application Name
            <input value={settings.applicationName} onChange={(event) => updateField('applicationName', event.target.value)} className="mt-2 w-full border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm" />
          </label>
          <label className="mb-4 block text-sm font-semibold t-text-secondary">
            Application Logo
            <input value={settings.applicationLogo} onChange={(event) => updateField('applicationLogo', event.target.value)} className="mt-2 w-full border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm" />
          </label>
          <label className="mb-4 block text-sm font-semibold t-text-secondary">
            JWT Expiry
            <input value={settings.jwtExpiry} onChange={(event) => updateField('jwtExpiry', event.target.value)} className="mt-2 w-full border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm" />
          </label>
          <label className="mb-4 block text-sm font-semibold t-text-secondary">
            Trial Days
            <input type="number" min="0" value={settings.trialDays} onChange={(event) => updateField('trialDays', Number(event.target.value))} className="mt-2 w-full border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm" />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold t-text-secondary">
            <input type="checkbox" checked={settings.maintenanceMode} onChange={(event) => updateField('maintenanceMode', event.target.checked)} />
            Maintenance Mode
          </label>
        </section>

        <section className="bg-[var(--bg-surface)] p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold t-text-heading">SMTP Settings</h3>
          {['host', 'port', 'user', 'from'].map((field) => (
            <label key={field} className="mb-4 block text-sm font-semibold capitalize t-text-secondary">
              {field}
              <input value={settings.smtpSettings[field] || ''} onChange={(event) => updateNested('smtpSettings', field, event.target.value)} className="mt-2 w-full border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm" />
            </label>
          ))}
        </section>

        <section className="bg-[var(--bg-surface)] p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-5 text-lg font-semibold t-text-heading">Storage Settings</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            {['provider', 'bucket', 'region'].map((field) => (
              <label key={field} className="block text-sm font-semibold capitalize t-text-secondary">
                {field}
                <input value={settings.storageSettings[field] || ''} onChange={(event) => updateNested('storageSettings', field, event.target.value)} className="mt-2 w-full border t-border-in bg-[var(--bg-input)] px-3 py-3 text-sm" />
              </label>
            ))}
          </div>
        </section>

        <div className="lg:col-span-2">
          <button type="submit" disabled={saving} className="bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
