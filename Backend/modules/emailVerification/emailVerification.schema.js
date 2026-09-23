import { z } from 'zod';
import { requiredString } from '../../utils/zodHelpers.js';

export const emailOnlySchema = z.object({
  email: requiredString('Email is required'),
});

export const newEmailOnlySchema = z.object({
  newEmail: requiredString('New email is required'),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().optional(),
  otp: z.string().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.email?.trim() || !data.otp?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Email and OTP are required' });
  }
});

export const verifyEmailChangeOtpSchema = z.object({
  newEmail: z.string().optional(),
  otp: z.string().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.newEmail?.trim() || !data.otp?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'New email and OTP are required' });
  }
});

const VALID_VERIFICATION_TYPES = ['employee_email', 'company_email', 'email_change'];

export const resendOtpSchema = z.object({
  email: z.string().optional(),
  verificationType: z.string().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.email?.trim() || !data.verificationType) {
    ctx.addIssue({ code: 'custom', message: 'Email and verification type are required' });
    return;
  }
  if (!VALID_VERIFICATION_TYPES.includes(data.verificationType)) {
    ctx.addIssue({ code: 'custom', message: 'Invalid verification type' });
  }
});

export const checkEmailVerificationSchema = z.object({
  email: z.string().optional(),
  verificationType: z.string().optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.email?.trim() || !data.verificationType) {
    ctx.addIssue({ code: 'custom', message: 'Email and verification type are required' });
  }
});
