import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import {
  requestSignupOTP,
  verifySignupOTP,
  login,
  getProfile,
  getOnboarding,
  completeOnboarding,
  uploadCompanyLogo,
  updateOnboardingCompany,
  updateOnboardingProfile,
  updateOnboardingSubscription,
  sendOTP,
  verifyOTP,
  resetPassword,
} from './auth.controller.js';
import { authMiddleware } from '../../middlewares/authe.js';
import { validate } from '../../middlewares/validate.js';
import {
  requestSignupOTPSchema,
  verifySignupOTPSchema,
  loginSchema,
  sendOTPSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  completeOnboardingSchema,
  updateOnboardingProfileSchema,
  updateOnboardingSubscriptionSchema,
} from './auth.schema.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const companyLogoDirectory = path.join(__dirname, '..', '..', 'uploads', 'company', 'logos');
fs.mkdirSync(companyLogoDirectory, { recursive: true });

// Company logos use the same Multer disk-storage pattern as employee resume uploads.
const companyLogoUpload = multer({
  storage: multer.diskStorage({
    destination: companyLogoDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `company-logo-${Date.now()}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!/\.(png|jpe?g|webp|gif)$/i.test(file.originalname)) {
      return callback(new Error('Company logo must be an image file'));
    }
    callback(null, true);
  },
});

const handleCompanyLogoUpload = (req, res, next) => {
  companyLogoUpload.single('logo')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    next();
  });
};

// Public routes
router.post('/register', validate(requestSignupOTPSchema), requestSignupOTP);
router.post('/signup/send-otp', validate(requestSignupOTPSchema), requestSignupOTP);
router.post('/signup/verify-otp', validate(verifySignupOTPSchema), verifySignupOTP);
router.post('/login', validate(loginSchema), login);
router.post('/send-otp', validate(sendOTPSchema), sendOTP);
router.post('/verify-otp', validate(verifyOTPSchema), verifyOTP);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.get('/onboarding', authMiddleware, getOnboarding);
router.post('/onboarding/complete', authMiddleware, validate(completeOnboardingSchema), completeOnboarding);
router.post('/onboarding/company-logo', authMiddleware, handleCompanyLogoUpload, uploadCompanyLogo);
router.put(
  '/onboarding/company',
  authMiddleware,
  handleCompanyLogoUpload,
  // Not zod-validated here: this endpoint accepts either a JSON `{ company }`
  // body or flat multipart fields (when a logo file is attached), so the shape
  // is resolved and validated inside updateOnboardingCompanyService instead.
  updateOnboardingCompany
);
router.put('/onboarding/profile', authMiddleware, validate(updateOnboardingProfileSchema), updateOnboardingProfile);
router.put('/onboarding/subscription', authMiddleware, validate(updateOnboardingSubscriptionSchema), updateOnboardingSubscription);

export default router;
