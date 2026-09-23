import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { sendEmployeeEmailOTP, verifyEmployeeEmailOTP, resendOTP } from '../../../api/emailVerificationApi';
import { inputClassName, labelClassName } from '../constants/employee.constants';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

export default function EmailVerificationField({
  email,
  isVerified,
  onEmailChange,
  onVerificationChange,
  error: externalError = '',
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(isVerified);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setOtpVerified(isVerified);
  }, [isVerified]);

  const resetVerification = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setError('');
    setSuccess('');
    onVerificationChange(false);
  };

  const handleEmailChange = (event) => {
    onEmailChange(event.target.value);
    resetVerification();
  };

  const handleSendOTP = async () => {
    const trimmedEmail = String(email || '').trim();

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendEmployeeEmailOTP(trimmedEmail);
      setOtpSent(true);
      setSuccess('OTP sent. Please check the employee email for the code.');
      setOtp('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (String(err.message || '').toLowerCase().includes('already verified')) {
        setOtpVerified(true);
        setSuccess('Email is already verified.');
        onVerificationChange(true);
        return;
      }

      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyEmployeeEmailOTP(String(email || '').trim(), otp);
      setOtpVerified(true);
      setSuccess('Email verified successfully.');
      onVerificationChange(true);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await resendOTP(String(email || '').trim(), 'employee_email');
      setSuccess('New OTP sent. Please check the employee email.');
      setOtp('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <label className={labelClassName}>
            Email ID <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            className={`${inputClassName} ${externalError ? 'border-red-500' : ''}`}
          />
        </div>

        {!otpVerified && email && (
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={loading || otpSent}
            className={`px-4 py-2 text-sm font-medium transition ${
              otpSent
                ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                : loading
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Sending...' : otpSent ? 'OTP Sent' : 'Send OTP'}
          </button>
        )}

        {otpVerified && (
          <div className="flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-2">
            <Check size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">Verified</span>
          </div>
        )}
      </div>

      {otpSent && !otpVerified && (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              className={`${inputClassName} flex-1`}
            />
            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className={`px-4 py-2 text-sm font-medium transition ${
                otp.length === 6 && !loading
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-slate-300 text-slate-600 cursor-not-allowed'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Resend OTP
          </button>
        </div>
      )}

      {externalError && <p className="text-xs text-red-500">{externalError}</p>}

      {error && (
        <div className="border border-red-200 bg-red-50 p-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="border border-green-200 bg-green-50 p-2">
          <p className="text-xs text-green-600">{success}</p>
        </div>
      )}
    </div>
  );
}
