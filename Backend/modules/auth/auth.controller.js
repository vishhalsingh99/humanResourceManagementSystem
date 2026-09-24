import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  registerService,
  loginService,
  getProfileService,
  getOnboardingService,
  completeOnboardingService,
  updateOnboardingCompanyService,
  updateOnboardingProfileService,
  updateOnboardingSubscriptionService,
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

export const register = asyncHandler(async (req, res) => {
  const result = await registerService(req.body);
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

