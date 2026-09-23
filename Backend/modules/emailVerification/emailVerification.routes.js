import { Router } from 'express';
import {
  sendEmployeeEmailOTP,
  verifyEmployeeEmailOTP,
  sendCompanyEmailOTP,
  verifyCompanyEmailOTP,
  sendEmailChangeOTP,
  verifyEmailChangeOTP,
  resendOTP,
  checkEmailVerification,
} from './emailVerification.controller.js';
import { authMiddleware } from '../../middlewares/authe.js';
import { validate } from '../../middlewares/validate.js';
import {
  emailOnlySchema,
  newEmailOnlySchema,
  verifyEmailOtpSchema,
  verifyEmailChangeOtpSchema,
  resendOtpSchema,
  checkEmailVerificationSchema,
} from './emailVerification.schema.js';

const router = Router();

// Public routes - Employee email verification
router.post('/employee/send-otp', validate(emailOnlySchema), sendEmployeeEmailOTP);
router.post('/employee/verify-otp', validate(verifyEmailOtpSchema), verifyEmployeeEmailOTP);

// Public routes - Company email verification
router.post('/company/send-otp', validate(emailOnlySchema), sendCompanyEmailOTP);
router.post('/company/verify-otp', validate(verifyEmailOtpSchema), verifyCompanyEmailOTP);

// Resend OTP
router.post('/resend-otp', validate(resendOtpSchema), resendOTP);

// Check verification status
router.get('/check', validate(checkEmailVerificationSchema, 'query'), checkEmailVerification);

// Protected routes - Email change verification
router.post('/change/send-otp', authMiddleware, validate(newEmailOnlySchema), sendEmailChangeOTP);
router.post('/change/verify-otp', authMiddleware, validate(verifyEmailChangeOtpSchema), verifyEmailChangeOTP);

export default router;
