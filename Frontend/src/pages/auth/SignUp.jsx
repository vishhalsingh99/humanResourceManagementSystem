import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const { register, defaultRole, showToast } = useApp();
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

    await register(name, form.email.trim(), form.password, defaultRole);
    showToast('Account created successfully!', 'success');
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.message ||
      'Unable to create account';

    showToast(message, 'error');
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
  Enter your details to create an account. The default role is <strong>{defaultRole}</strong>.
</p>

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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600  hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 items-center justify-center bg-[#0f1f4b]">
        <div className="text-center text-white">
          <p className="text-6xl font-semibold tracking-tight">NexaHR</p>
          <p className="mt-4 text-lg text-blue-100">A calmer way to run your people operations.</p>
        </div>
      </div>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  );
}
