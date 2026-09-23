import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import vivahr from '../../assets/images/AdoneeLogo2.png';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import EyeIcon from '../../components/common/EyeIcon';
import api from '../../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { showToast } = useApp();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/send-otp', { email });
      setStep(2);
      showToast('OTP sent to your email!', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-otp', { email, otp: otpString });
      setResetToken(response.data.resetToken);
      setStep(3);
      showToast('OTP verified successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      showToast('Password reset successfully!', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/send-otp', { email });
      showToast('OTP resent to your email!', 'success');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-10 py-16">
        <div className="w-full max-w-sm">

          {/* Step 1 - Email */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Forgot Password?</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your registered email to receive an OTP.</p>
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <InputField
                  type="email"
                  label="Email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded py-2.5 transition-all duration-700 ease-in-out"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </form>
            </>
          )}

          {/* Step 2 - OTP */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Enter OTP</h2>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit OTP to <span className="font-medium text-gray-700">{email}</span>
              </p>
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded py-2.5 transition-all duration-700 ease-in-out"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <p className="text-sm text-center text-gray-500">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    onClick={resendOTP}
                    disabled={loading}
                    className="text-blue-600 hover:underline cursor-pointer disabled:text-blue-300"
                  >
                    Resend OTP
                  </button>
                </p>
              </form>
            </>
          )}

          {/* Step 3 - New Password */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Set New Password</h2>
              <p className="text-sm text-gray-500 mb-6">Create a new password for your account.</p>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <InputField
                  type={showNew ? 'text' : 'password'}
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
                  rightElement={
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <EyeIcon visible={showNew} />
                    </button>
                  }
                />
                <InputField
                  type={showConfirm ? 'text' : 'password'}
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
                  rightElement={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <EyeIcon visible={showConfirm} />
                    </button>
                  }
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded py-2.5 transition-all duration-700 ease-in-out"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-sm text-gray-600 text-center">
            {"Remember your passwords? "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>

      {/* Right - Image */}
      <div className="hidden lg:flex w-1/2 items-center justify-center" style={{ backgroundColor: '#0f1f4b' }}>
        <img src={vivahr} alt="hr Management" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
