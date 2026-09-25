import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes.constants';
import { validatePhoneNumber, getPhoneErrorMessage } from '../../utils/phoneValidation';
import { getPincodeErrorMessage, validatePincode } from '../../utils/formValidation';
import { useLocationOptions } from '../../hooks/useLocationOptions';
import EmployeeAttendanceCard from '../../features/attendance/components/EmployeeAttendanceCard';

const splitName = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const buildProfileForm = ({ savedProfile = {}, user, employeeProfile } = {}) => {
  const sourceName = employeeProfile?.name || user?.name || '';
  const nameParts = splitName(sourceName);

  return {
    firstName: savedProfile.firstName || nameParts.firstName,
    lastName: savedProfile.lastName || nameParts.lastName,
    email: employeeProfile?.email || savedProfile.email || user?.email || '',
    mobile: employeeProfile?.phone || savedProfile.mobile || '',
    address: employeeProfile?.currentAddress || savedProfile.address || '-',
    city: savedProfile.city || '',
    state_id: savedProfile.state_id || '',
    district_id: savedProfile.district_id || '',
    pincode: savedProfile.pincode || '',
  };
};

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold t-text-heading">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function inputClass(readOnly = false) {
  return `h-11 w-full rounded border border-[var(--border-input)] px-3 text-sm t-text-primary outline-none transition focus:border-blue-500 ${readOnly ? 'bg-[var(--bg-input)]' : 'bg-[var(--bg-surface)]'
    }`;
}

function Profile({ mode = 'profile' }) {
  const navigate = useNavigate();
  const { user, onboarding, completeOnboardingStep, updateProfileOnboarding, showToast } = useApp();
  const savedProfile = onboarding.profile || {};
  const isOnboarding = mode === 'onboarding';
  const isEmployee = user?.role === 'employee';
  const roleLabel = user?.roleName || user?.role || 'Employee';
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [editing, setEditing] = useState(!isEmployee && (isOnboarding || !onboarding.profile_completed));
  const [phoneError, setPhoneError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [form, setForm] = useState(() => buildProfileForm({ savedProfile, user }));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { states, districts } = useLocationOptions(form.state_id);

  useEffect(() => {
    if (!isEmployee) return;

    axios.get('/api/employees/me')
      .then((response) => {
        setEmployeeProfile(response.data);
        setForm(buildProfileForm({ user, employeeProfile: response.data }));
      })
      .catch((error) => {
        showToast(error.response?.data?.error || 'Unable to load employee profile', 'error');
        setForm(buildProfileForm({ user }));
      });
  }, [isEmployee, showToast, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'state_id' ? { district_id: '' } : {}),
    }));

    // Validate phone field
    if (name === 'mobile' && value) {
      const error = getPhoneErrorMessage(value);
      setPhoneError(error || '');
    } else if (name === 'mobile') {
      setPhoneError('');
    }

    if (name === 'pincode') {
      setPincodeError(getPincodeErrorMessage(value));
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast('New password must be different from the current password', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await axios.put('/api/employees/change-password', passwordForm);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showToast(response.data?.message || 'Password changed successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate phone if provided
    if (form.mobile && !validatePhoneNumber(form.mobile)) {
      const error = getPhoneErrorMessage(form.mobile);
      setPhoneError(error || 'Invalid phone number');
      showToast(error || 'Invalid phone number', 'error');
      return;
    }

    if (form.pincode && !validatePincode(form.pincode)) {
      const error = getPincodeErrorMessage(form.pincode);
      setPincodeError(error);
      showToast(error, 'error');
      return;
    }

    if (isEmployee) {
      return;
    }

    if (isOnboarding) {
      completeOnboardingStep('profile', form);
      showToast('Profile setup saved', 'success');
      navigate(ROUTES.ONBOARDING_COMPANY);
      return;
    }

    try {
      await updateProfileOnboarding(form);
      setEditing(false);
      showToast('Profile updated', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to update profile', 'error');
    }
  };

  const fullName = `${form.firstName} ${form.lastName}`.trim() || user?.name || 'User';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <div className={isOnboarding ? 'min-h-screen bg-[var(--bg-panel)] p-6 sm:p-8 mt-18' : ' p-4 sm:p-6  mt-18 lg:p-10'}>
      <div className="mx-auto max-w-6xl bg-[var(--bg-surface)] p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold t-text-heading">
                {isOnboarding ? 'Profile Setup' : 'Profile'}
              </h1>
              {isOnboarding && (
                <p className="mt-2 text-sm t-text-secondary">Complete your personal information to continue onboarding.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded border t-border px-4 py-2 text-sm hover:bg-[var(--bg-row-hover)]"
            >
              ← Back
            </button>
          </div>

          <div className="grid gap-6 border-b t-divider pb-7 md:grid-cols-[220px_1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold t-text-heading">Profile Photo</p>
              <div className="rounded border t-border bg-[var(--bg-input)] p-4">
                <div className="flex aspect-square items-center justify-center rounded border t-border bg-[var(--bg-badge-neutral)] text-4xl font-bold t-text-subtle">
                  {initial}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold t-text-heading">Profile Details</h2>
              <div className="mt-6 border-t t-divider pt-5">
                <p className="text-lg font-bold t-text-heading">{fullName}</p>
                <p className="mt-2 text-sm t-text-secondary">{form.email || user?.email}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <span className="rounded border t-border bg-[var(--bg-badge-neutral)] px-4 py-2 t-text-secondary">
                    Role: {String(roleLabel).charAt(0).toUpperCase() + String(roleLabel).slice(1)}
                  </span>

                  <span className="rounded border t-border bg-[var(--bg-badge-neutral)] px-4 py-2 t-text-secondary">
                    Status: {isEmployee ? 'Employee Profile' : onboarding.profile_completed ? 'Profile Completed' : 'Pending'}
                  </span>

                  {user?.role !== 'employee' && (
                    <span className="rounded border t-border bg-[var(--bg-badge-neutral)] px-4 py-2 t-text-secondary">
                      Subscription: {onboarding.subscription || 'None'}
                    </span>
                  )}

                  {isEmployee && employeeProfile?.employeeId && (
                    <span className="rounded border t-border bg-[var(--bg-badge-neutral)] px-4 py-2 t-text-secondary">
                      Employee ID: {employeeProfile.employeeId}
                    </span>
                  )}

                  {isEmployee && employeeProfile?.department && (
                    <span className="rounded border t-border bg-[var(--bg-badge-neutral)] px-4 py-2 t-text-secondary">
                      Department: {employeeProfile.department}
                    </span>
                  )}

                  {isEmployee && employeeProfile?.designation && (
                    <span className="rounded border t-border bg-[var(--bg-badge-neutral)] px-4 py-2 t-text-secondary">
                      Designation: {employeeProfile.designation}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isEmployee && !isOnboarding && (
            <div className="mt-8">
              <EmployeeAttendanceCard />
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-bold t-text-heading">Personal Information</h2>
            <div className="mt-6 grid gap-5 border-t t-divider pt-5 md:grid-cols-3">
              <Field label="First Name" required>
                <input name="firstName" value={form.firstName} onChange={handleChange} readOnly={!editing} required className={inputClass(!editing)} />
              </Field>
              <Field label="Last Name" required>
                <input name="lastName" value={form.lastName} onChange={handleChange} readOnly={!editing} required className={inputClass(!editing)} />
              </Field>

              <Field label="Email Address">
                <input name="email" value={form.email} onChange={handleChange} readOnly={!editing} disabled
                  className={`${inputClass(true)} bg-[var(--bg-input)] cursor-not-allowed`} />
              </Field>

              <Field label="Mobile No" required>
                <input name="mobile" required type="tel" maxLength="10" value={form.mobile} onChange={handleChange} readOnly={!editing} className={`${inputClass(!editing)} ${phoneError ? 'border-red-500' : ''}`} />
                {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
              </Field>
              <Field label="Address">
                <input name="address" value={form.address} onChange={handleChange} readOnly={!editing} className={inputClass(!editing)} />
              </Field>
              <Field label="City">
                <input name="city" value={form.city} onChange={handleChange} readOnly={!editing} className={inputClass(!editing)} />
              </Field>
              <Field label="State">
                <select name="state_id" value={form.state_id} onChange={handleChange} disabled={!editing} className={inputClass(!editing)}>
                  <option value="">Select state</option>
                  {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
                </select>
              </Field>
              <Field label="District">
                <select name="district_id" value={form.district_id} onChange={handleChange} disabled={!editing || !form.state_id} className={inputClass(!editing)}>
                  <option value="">Select district</option>
                  {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
                </select>
              </Field>
              <Field label="Pincode">
                <input name="pincode" maxLength="6" inputMode="numeric" value={form.pincode} onChange={handleChange} readOnly={!editing} className={`${inputClass(!editing)} ${pincodeError ? 'border-red-500' : ''}`} />
                {pincodeError && <p className="mt-1 text-xs text-red-500">{pincodeError}</p>}
              </Field>
            </div>
          </div>

          {isEmployee && (
            <div className="mt-8 border-t t-divider pt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold t-text-heading">Security</h2>
                  <p className="mt-1 text-sm t-text-muted">Change your employee login password.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <Field label="Current Password" required>
                  <input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={inputClass(false)}
                  />
                </Field>
                <Field label="New Password" required>
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className={inputClass(false)}
                  />
                </Field>
                <Field label="Confirm Password" required>
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={inputClass(false)}
                  />
                </Field>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3 border-t t-divider pt-5">

            {isOnboarding ? (
              <button
                type="submit"
                className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Next
              </button>
            ) : !isEmployee && (
              !editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Update Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(buildProfileForm({ savedProfile, user, employeeProfile }));
                      setEditing(false);
                    }}
                    className="rounded border t-border bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--bg-row-hover)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Save Profile
                  </button>
                </>
              )
            )}

          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile
