import EmailVerification from '../../repositories/emailVerification.repository.js';
import User from '../../repositories/user.repository.js';
import { sendEmailVerificationOTP } from '../../utils/emailService.js';
import { ApiError } from '../../utils/ApiError.js';

const sendVerificationOTP = async (email, type, userId = null) => {
  const trimmedEmail = email.trim().toLowerCase();

  const isVerified = await EmailVerification.isEmailVerified(trimmedEmail, type);
  if (isVerified) {
    throw new ApiError(400, 'This email is already verified');
  }

  const otp = User.generateOTP();
  await EmailVerification.create(userId, trimmedEmail, type, otp);

  const emailResult = await sendEmailVerificationOTP(trimmedEmail, otp, type);
  if (!emailResult.success) {
    throw new ApiError(500, emailResult.message);
  }

  return trimmedEmail;
};

export const sendEmployeeEmailOTPService = async (email) => {
  const trimmedEmail = await sendVerificationOTP(email, 'employee_email');
  return { success: true, message: 'OTP sent successfully to your email', email: trimmedEmail };
};

export const sendCompanyEmailOTPService = async (email, userId) => {
  const trimmedEmail = await sendVerificationOTP(email, 'company_email', userId);
  return { success: true, message: 'OTP sent successfully to your email', email: trimmedEmail };
};

export const sendEmailChangeOTPService = async (userId, newEmail) => {
  const trimmedEmail = newEmail.trim().toLowerCase();

  const existingUser = await User.findByEmailOnly(trimmedEmail);
  if (existingUser) {
    throw new ApiError(400, 'Email is already in use');
  }

  await sendVerificationOTP(newEmail, 'email_change', userId);

  return { success: true, message: 'Verification OTP sent to your new email', email: trimmedEmail };
};

const verifyOTPFor = async (email, type, otp) => {
  const trimmedEmail = email.trim().toLowerCase();
  const result = await EmailVerification.verifyOTP(trimmedEmail, type, otp.trim());
  if (!result.valid) {
    throw new ApiError(400, result.message);
  }
  return result;
};

export const verifyEmployeeEmailOTPService = async (email, otp) => {
  const result = await verifyOTPFor(email, 'employee_email', otp);
  return { success: true, message: result.message, verificationId: result.verificationId, email: result.email };
};

export const verifyCompanyEmailOTPService = async (email, otp) => {
  const result = await verifyOTPFor(email, 'company_email', otp);
  return { success: true, message: result.message, verificationId: result.verificationId, email: result.email };
};

export const verifyEmailChangeOTPService = async (userId, newEmail, otp) => {
  const trimmedEmail = newEmail.trim().toLowerCase();
  await verifyOTPFor(newEmail, 'email_change', otp);

  await User.updateEmail(userId, trimmedEmail);

  return { success: true, message: 'Email changed successfully', newEmail: trimmedEmail };
};

export const resendOTPService = async (email, verificationType) => {
  const trimmedEmail = email.trim().toLowerCase();
  const otp = User.generateOTP();

  const resendResult = await EmailVerification.resendOTP(trimmedEmail, verificationType, otp);
  if (!resendResult.success) {
    throw new ApiError(400, resendResult.message);
  }

  const emailResult = await sendEmailVerificationOTP(trimmedEmail, otp, verificationType);
  if (!emailResult.success) {
    throw new ApiError(500, emailResult.message);
  }

  return { success: true, message: 'OTP resent successfully', email: trimmedEmail };
};

export const checkEmailVerificationService = async (email, verificationType) => {
  const trimmedEmail = email.trim().toLowerCase();
  const isVerified = await EmailVerification.isEmailVerified(trimmedEmail, verificationType);

  return { success: true, email: trimmedEmail, verificationType, isVerified };
};
