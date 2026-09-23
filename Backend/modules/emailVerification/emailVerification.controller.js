import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  sendEmployeeEmailOTPService,
  sendCompanyEmailOTPService,
  sendEmailChangeOTPService,
  verifyEmployeeEmailOTPService,
  verifyCompanyEmailOTPService,
  verifyEmailChangeOTPService,
  resendOTPService,
  checkEmailVerificationService,
} from './emailVerification.service.js';

export const sendEmployeeEmailOTP = asyncHandler(async (req, res) => {
  res.json(await sendEmployeeEmailOTPService(req.body.email));
});

export const sendCompanyEmailOTP = asyncHandler(async (req, res) => {
  res.json(await sendCompanyEmailOTPService(req.body.email, req.user?.id || null));
});

export const sendEmailChangeOTP = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  res.json(await sendEmailChangeOTPService(req.user.id, req.body.newEmail));
});

export const verifyEmployeeEmailOTP = asyncHandler(async (req, res) => {
  res.json(await verifyEmployeeEmailOTPService(req.body.email, req.body.otp));
});

export const verifyCompanyEmailOTP = asyncHandler(async (req, res) => {
  res.json(await verifyCompanyEmailOTPService(req.body.email, req.body.otp));
});

export const verifyEmailChangeOTP = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  res.json(await verifyEmailChangeOTPService(req.user.id, req.body.newEmail, req.body.otp));
});

export const resendOTP = asyncHandler(async (req, res) => {
  res.json(await resendOTPService(req.body.email, req.body.verificationType));
});

export const checkEmailVerification = asyncHandler(async (req, res) => {
  res.json(await checkEmailVerificationService(req.query.email, req.query.verificationType));
});
