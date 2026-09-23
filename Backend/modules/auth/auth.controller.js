import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  requestSignupOTPService,
  verifySignupOTPService,
  loginService,
  getProfileService,
  getOnboardingService,
  completeOnboardingService,
  updateOnboardingCompanyService,
  updateOnboardingProfileService,
  updateOnboardingSubscriptionService,
  sendOTPService,
  verifyOTPService,
  resetPasswordService,
} from './auth.service.js';

const companyLogoUploadPath = 'uploads/company/logos';

export const uploadCompanyLogo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Company logo file is required' });
  }

  res.status(201).json({
    logoPreview: `${companyLogoUploadPath}/${req.file.filename}`,
  });
};

export const requestSignupOTP = asyncHandler(async (req, res) => {
  const result = await requestSignupOTPService(req.body);
  res.json(result);
});

export const verifySignupOTP = asyncHandler(async (req, res) => {
  const result = await verifySignupOTPService(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginService(req.body);
  res.json(result);
});

export const getProfile = asyncHandler(async (req, res) => {
  const result = await getProfileService(req.user.id);
  res.json(result);
});

export const getOnboarding = asyncHandler(async (req, res) => {
  const result = await getOnboardingService(req.user);
  res.json(result);
});

export const completeOnboarding = asyncHandler(async (req, res) => {
  const result = await completeOnboardingService(req.user, req.body);
  res.json(result);
});

export const updateOnboardingCompany = asyncHandler(async (req, res) => {
  const result = await updateOnboardingCompanyService(req.user, req.body, req.file);
  res.json(result);
});

export const updateOnboardingProfile = asyncHandler(async (req, res) => {
  const result = await updateOnboardingProfileService(req.user, req.body);
  res.json(result);
});

export const updateOnboardingSubscription = asyncHandler(async (req, res) => {
  const result = await updateOnboardingSubscriptionService(req.user, req.body);
  res.json(result);
});

export const sendOTP = asyncHandler(async (req, res) => {
  const result = await sendOTPService(req.body.email);
  res.json(result);
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const result = await verifyOTPService(req.body.email, req.body.otp);
  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await resetPasswordService(req.body.resetToken, req.body.newPassword);
  res.json(result);
});
