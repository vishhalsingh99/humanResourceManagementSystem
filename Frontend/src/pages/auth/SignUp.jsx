import { useState } from 'react';
import { Link } from 'react-router-dom';
import signupImage from '../../assets/images/AdoneeLogo2.png';
import LegalModal from '../../components/ui/LegalModal';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import EyeIcon from '../../components/common/EyeIcon';

export default function Signup() {
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '' 
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalModal, setLegalModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('details');
  const [otp, setOtp] = useState('');
  const { requestSignupOTP, verifySignupOTP, defaultRole, showToast } = useApp();
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

   
  const handleSubmit = async (e) => {
  e.preventDefault();

  // Terms check
  if (!acceptedTerms) {
    showToast(
      'Please accept Terms and Conditions',
      'error'
    );
    return;
  }

  // Confirm password check
  if (form.password !== form.confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  // Password validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(form.password)) {
    showToast(
      'Password must contain uppercase, lowercase, number, special character and 8+ characters',
      'error'
    );
    return;
  }

  setLoading(true);

  try {
    const name =
      `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    await requestSignupOTP(
      name,
      form.email.trim(),
      form.password,
      defaultRole
    );

    showToast(
      'OTP sent to your email',
      'success'
    );
    setStep('otp');
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.message ||
      'Unable to send OTP';

    showToast(message, 'error');
  } finally {
    setLoading(false);
  }
};

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.trim().length !== 6) {
      showToast('Please enter the 6 digit OTP', 'error');
      return;
    }

    setLoading(true);

    try {
      await verifySignupOTP(form.email.trim(), otp.trim());
      showToast('Account created successfully!', 'success');
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'Unable to verify OTP';

      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    setLoading(true);

    try {
      await requestSignupOTP(name, form.email.trim(), form.password, defaultRole);
      setOtp('');
      showToast('OTP sent again to your email', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to resend OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-10 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Sign Up</h2>
<p className="text-sm text-gray-500 mb-6">
  {step === 'details'
    ? <>Enter your details to receive an email OTP. The default role is <strong>{defaultRole}</strong>.</>
    : <>Enter the OTP sent to <strong>{form.email}</strong> to create your account.</>}
</p>

          {step === 'details' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name */}
            <div className="flex gap-3">
              <InputField
                type="text"
                name="firstName"
                label="First Name"
                placeholder="Enter your first name"
                value={form.firstName}
                onChange={handle}
                required
                className="flex-1"
                inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
              />
              <InputField
                type="text"
                name="lastName"
                label="Last Name"
                placeholder="Enter your last name"
                value={form.lastName}
                onChange={handle}
                required
                className="flex-1"
                inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>

            <InputField
              type="email"
              name="email"
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handle}
              required
              inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
            />

            <InputField
              type={showPassword ? 'text' : 'password'}
              name="password"
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handle}
              required
              inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon visible={showPassword} />
                </button>
              }
            />

            <InputField
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handle}
              required
              inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
              rightElement={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon visible={showConfirm} />
                </button>
              }
            />

            <div className="flex items-start gap-3">
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-5 w-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  By creating an account means you agree to the{' '}
                  <button type="button" onClick={() => setLegalModal('terms')} className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer text-sm">Terms and Conditions</button>
                  , and our{' '}
                  <button type="button" onClick={() => setLegalModal('privacy')} className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer text-sm">Privacy Policy</button>
                </span>
              </label>
            </div>

            <Button type="submit"
              disabled={!acceptedTerms || loading}
              className="w-full rounded py-2.5 transition-all duration-700 ease-in-out"
              variant={acceptedTerms && !loading ? 'primary' : 'secondary'}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
          ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <InputField
              type="text"
              inputMode="numeric"
              label="Email OTP"
              placeholder="Enter 6 digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              inputClassName="rounded px-4 py-2.5 text-center text-lg tracking-[0.35em] placeholder:tracking-normal"
            />

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded py-2.5 transition-all duration-700 ease-in-out"
              variant={!loading && otp.length === 6 ? 'primary' : 'secondary'}
            >
              {loading ? 'Verifying...' : 'Verify OTP & Create Account'}
            </Button>

            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-gray-600 hover:text-gray-900 hover:underline"
                disabled={loading}
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-blue-600 hover:underline"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
          )}

          <p className="mt-5 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600  hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>

      {/* Right - Image */}
      <div className="hidden lg:flex w-1/2 items-center justify-center" style={{ backgroundColor: '#0f1f4b' }}>
        <img src={signupImage} alt="hr Management" className="w-full h-full object-cover" />
      </div>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  );
}
