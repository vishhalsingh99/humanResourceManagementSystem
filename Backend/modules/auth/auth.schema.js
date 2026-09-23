import { z } from 'zod';

const ALLOWED_ROLES = ['admin', 'employee'];
const PINCODE_REGEX = /^[1-9]\d{5}$/;
const BASE64_IMAGE_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;

const notBase64Logo = (value) => !value || !BASE64_IMAGE_REGEX.test(String(value).trim());

// z.string().min(1, msg) only applies `msg` once the string exists -- a
// missing key falls through to zod's generic "Required". This helper keeps
// the same custom message for both "missing" and "present but empty" so it
// matches the original controllers' plain `!value` checks.
const requiredString = (message) => z.string({ required_error: message }).min(1, message);

export const requestSignupOTPSchema = z.object({
  name: requiredString('Name, email and password are required').trim(),
  email: requiredString('Name, email and password are required').trim(),
  password: requiredString('Name, email and password are required'),
  role: z.enum(ALLOWED_ROLES, { message: 'Role must be admin or employee' }).default('admin'),
});

export const verifySignupOTPSchema = z.object({
  email: requiredString('Email and OTP are required').trim(),
  otp: requiredString('Email and OTP are required').trim(),
});

export const loginSchema = z.object({
  email: z.string().trim().optional(),
  loginId: z.string().trim().optional(),
  employeeId: z.string().trim().optional(),
  password: requiredString('Email/Employee ID and password are required'),
}).refine((data) => data.email || data.loginId || data.employeeId, {
  message: 'Email/Employee ID and password are required',
  path: ['email'],
});

export const sendOTPSchema = z.object({
  email: requiredString('Email is required').trim(),
});

export const verifyOTPSchema = z.object({
  email: requiredString('Email and OTP are required').trim(),
  otp: requiredString('Email and OTP are required').trim(),
});

export const resetPasswordSchema = z.object({
  resetToken: requiredString('Reset token and new password are required'),
  newPassword: requiredString('Reset token and new password are required'),
});

const onboardingProfileSchema = z.object({
  pincode: z.string().trim().regex(PINCODE_REGEX, 'PIN code must be 6 digits and cannot start with 0').optional().or(z.literal('')),
}).passthrough();

const onboardingCompanySchema = z.object({
  companyName: requiredString('Company name is required').trim(),
  email: z.string().trim().optional().or(z.literal('')),
  pincode: z.string().trim().regex(PINCODE_REGEX, 'PIN code must be 6 digits and cannot start with 0').optional().or(z.literal('')),
  logoPreview: z.string().refine(notBase64Logo, 'Company logo must be uploaded as a file').optional().nullable(),
}).passthrough();

export const completeOnboardingSchema = z.object({
  profile: onboardingProfileSchema.default({}),
  company: onboardingCompanySchema,
  subscription: z.string().trim().min(1).default('basic'),
});

export const updateOnboardingProfileSchema = z.object({
  profile: onboardingProfileSchema.default({}),
}).passthrough();

export const updateOnboardingSubscriptionSchema = z.object({
  subscription: z.string().trim().min(1).optional(),
  planId: z.string().trim().min(1).optional(),
}).refine((data) => data.subscription || data.planId, {
  message: 'Subscription plan is required',
  path: ['subscription'],
});
