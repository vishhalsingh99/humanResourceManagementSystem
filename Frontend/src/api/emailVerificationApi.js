import api from './axios';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error || error.message || fallback;

export async function sendEmployeeEmailOTP(email) {
  try {
    const response = await api.post('/email-verification/employee/send-otp', { email });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to send OTP'));
  }
}

export async function verifyEmployeeEmailOTP(email, otp) {
  try {
    const response = await api.post('/email-verification/employee/verify-otp', { email, otp });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Invalid OTP'));
  }
}

export async function resendOTP(email, verificationType) {
  try {
    const response = await api.post('/email-verification/resend-otp', { email, verificationType });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to resend OTP'));
  }
}

export async function checkEmailVerification(email, verificationType = 'employee_email') {
  try {
    const response = await api.get('/email-verification/check', {
      params: { email, verificationType },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to check email verification'));
  }
}
