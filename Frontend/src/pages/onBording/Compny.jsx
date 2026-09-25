import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes.constants';
import { validatePhoneNumber, getPhoneErrorMessage } from '../../utils/phoneValidation';
import { getPincodeErrorMessage, validatePincode } from '../../utils/formValidation';
import { useLocationOptions } from '../../hooks/useLocationOptions';
import { buildUploadedFileUrl } from '../../utils';
import api from '../../services/api';

function Field({ label, required, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-neutral-200">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass = 'h-11 w-full rounded-xl border border-neutral-700/90 bg-neutral-950/65 px-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]';

function Compny({ mode = 'settings' }) {
  const navigate = useNavigate();
  const { user, onboarding, completeOnboardingStep, uploadCompanyLogo, updateCompanyOnboarding, showToast } = useApp();
  const isOnboarding = mode === 'onboarding';
  const savedCompany = onboarding.company || {};
  const [logoPreview, setLogoPreview] = useState(savedCompany.logoPreview || '');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(buildUploadedFileUrl(savedCompany.logoPreview));
  const [logoFile, setLogoFile] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [form, setForm] = useState({
    companyName: savedCompany.companyName || '',
    email: savedCompany.email || user?.email || '',
    mobile: savedCompany.mobile || '',
    pincode: savedCompany.pincode || '',
    website: savedCompany.website || '',
    state_id: savedCompany.state_id || '',
    district_id: savedCompany.district_id || '',
    address: savedCompany.address || '',
  });
  const { states, districts } = useLocationOptions(form.state_id);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    if (logoFile) return;
    setLogoPreview(savedCompany.logoPreview || '');
    setLogoPreviewUrl(buildUploadedFileUrl(savedCompany.logoPreview));
  }, [logoFile, savedCompany.logoPreview]);

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

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (logoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    // Preview the local image before upload without converting it to Base64.
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const clearLogoSelection = () => {
    if (logoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(null);
    setLogoPreview(savedCompany.logoPreview || '');
    setLogoPreviewUrl(buildUploadedFileUrl(savedCompany.logoPreview));
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

    let nextLogoPreview = logoPreview;

    if (isOnboarding && logoFile) {
      try {
        const response = await uploadCompanyLogo(logoFile);
        nextLogoPreview = response.data.logoPreview;
        setLogoPreview(nextLogoPreview);
        setLogoFile(null);
      } catch (error) {
        showToast(error.response?.data?.error || 'Unable to upload company logo', 'error');
        return;
      }
    }

    const payload = { ...form, logoPreview: nextLogoPreview };

    if (isOnboarding) {
      completeOnboardingStep('company', payload);
      showToast('Company setup saved', 'success');
      navigate(ROUTES.ONBOARDING_SUBSCRIPTION);
      return;
    }

    try {
      const response = await updateCompanyOnboarding(payload, logoFile);
      const savedLogoPath = response.onboarding?.company?.logoPreview || nextLogoPreview;
      if (logoPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      setLogoPreview(savedLogoPath);
      setLogoPreviewUrl(buildUploadedFileUrl(savedLogoPath));
      setLogoFile(null);
      showToast('Company details updated', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to update company details', 'error');
    }
  };

  const handleBack = () => {
    navigate(ROUTES.ONBOARDING_PROFILE);
  };

  return (
    <div className={isOnboarding ? 'min-h-screen bg-neutral-950 p-5 sm:p-8' : 'mt-18 p-4 sm:p-6 lg:p-8'}>
      <div className="mx-auto max-w-6xl rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
        {isOnboarding && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 cursor-pointer rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-2.5 text-sm font-semibold text-neutral-300 transition hover:border-red-500/40 hover:bg-red-500/10"
          >
            ← Back
          </button>
        )}
        <form onSubmit={handleSubmit}>
          <div>
            <h1 className="text-2xl font-bold text-neutral-50">Company Master</h1>
            <p className="mt-3 text-sm text-neutral-400">Manage company details that will be used in invoices, reports, and branding.</p>
          </div>

          <div className="mt-7">
            <h2 className="text-lg font-bold text-neutral-50">Company Details</h2>
            <div className="mt-6 grid gap-5 border-t border-neutral-800 pt-5 md:grid-cols-2">
              <Field label="Company Name" required className="md:col-span-2">
                <input name="companyName" value={form.companyName} onChange={handleChange} required className={inputClass} />
              </Field>

              <div>
                <Field label="Email" required>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
                </Field>
              </div>

              <Field label="Mobile No." required>
                <input name="mobile" type='tel' maxLength="10" value={form.mobile} onChange={handleChange} placeholder="Enter mobile number" className={`${inputClass} ${phoneError ? 'border-rose-500' : ''}`} />
                {phoneError && <p className="mt-1 text-xs text-rose-400">{phoneError}</p>}
              </Field>

              <Field label="Pincode">
                <input name="pincode" inputMode="numeric" value={form.pincode} onChange={handleChange} placeholder="Enter pincode" className={`${inputClass} ${pincodeError ? 'border-rose-500' : ''}`} />
                {pincodeError && <p className="mt-1 text-xs text-rose-400">{pincodeError}</p>}
              </Field>

              <Field label="Website">
                <input name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://example.com" className={inputClass} />
              </Field>


              <Field label="State" required>
                <select name="state_id" value={form.state_id} onChange={handleChange} required className={inputClass}>
                  <option value="">Select state</option>
                  {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
                </select>
              </Field>

              <Field label="District" required>
                <select name="district_id" value={form.district_id} onChange={handleChange} required disabled={!form.state_id} className={inputClass}>
                  <option value="">Select district</option>
                  {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
                </select>
              </Field>
              <Field label="GSTIN">
                <input name="gstin" type="text" value={form.gstin} onChange={handleChange} placeholder="Enter GSTIN" className={inputClass} />
              </Field>

              <Field label="Address" className="md:col-span-2">
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter company address"
                  rows={4}
                  className="w-full rounded-xl border border-neutral-700/90 bg-neutral-950/65 px-3 py-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
                />
              </Field>

              <div className="md:col-span-2">
                <p className="mb-3 text-sm font-semibold text-neutral-200">Company Logo</p>
                <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-950/40 p-5">
                  {logoPreviewUrl && (
                    <div className="relative mb-3 overflow-hidden rounded-xl bg-neutral-900">
                      <img src={logoPreviewUrl} alt="Company logo preview" className="h-32 w-full object-cover" />
                      <button
                        type="button"
                        onClick={clearLogoSelection}
                        className="absolute cursor-pointer right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 text-neutral-100 shadow"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm cursor-pointer text-neutral-300" />
                  {logoPreviewUrl && <p className="mt-2 cursor-pointer text-xs text-neutral-500">{logoFile ? 'New logo selected' : 'Current logo saved'}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t border-neutral-800 pt-5">
            <button type="submit" className="cursor-pointer rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400">
              {isOnboarding ? 'Save & Continue' : 'Save Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Compny;