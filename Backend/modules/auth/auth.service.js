import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import User from '../../repositories/user.repository.js';
import Tenant from '../../repositories/tenant.repository.js';
import EmailVerification from '../../repositories/emailVerification.repository.js';
import Location from '../../repositories/location.repository.js';
import Role from '../../repositories/role.repository.js';
import { sendOTPEmail } from '../../utils/emailService.js';
import { JWT_SECRET } from '../../middlewares/authe.js';
import { createTenantDatabaseName, createTenantDatabase, withTenantDatabase } from '../../config/databases.js';
import { createTables } from '../../db.js';
import { COMPANY_ADMIN_PERMISSIONS } from '../../config/rbac.js';
import { ApiError } from '../../utils/ApiError.js';

const PINCODE_REGEX = /^[1-9]\d{5}$/;
const BASE64_IMAGE_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;

const hasBase64Logo = (value) => BASE64_IMAGE_REGEX.test(String(value || '').trim());

const buildTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  roleId: user.role_id || user.roleId,
  employeeId: user.employee_id || user.employeeId,
  loginId: user.login_id || user.loginId,
  tenantId: user.tenant_id || user.tenantId,
  tenantDatabase: user.tenant_database || user.tenantDatabase,
});

export const toApiUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  roleId: user.role_id || user.roleId,
  roleName: user.roleName || user.role_name || null,
  permissions: user.permissions || [],
  employeeId: user.employee_id || user.employeeId,
  loginId: user.login_id || user.loginId,
  tenantId: user.tenant_id || user.tenantId,
  tenantDatabase: user.tenant_database || user.tenantDatabase,
  status: user.status || 'active',
  onboarding_completed: Boolean(user.onboarding_completed || user.onboardingCompleted),
});

const signToken = (user) => jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: '7d' });
const signSuperAdminToken = () => jwt.sign({ id: 1, role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '7d' });

const enrichUserWithPermissions = async (user) => {
  if (!user || user.role === 'SUPER_ADMIN') return user;

  if (user.role === 'admin') {
    return {
      ...user,
      permissions: COMPANY_ADMIN_PERMISSIONS,
      roleName: 'Company Admin',
    };
  }

  const tenantDatabase = user.tenant_database || user.tenantDatabase;
  let roleId = user.role_id || user.roleId;
  if (!tenantDatabase) {
    return {
      ...user,
      permissions: [],
      roleName: null,
    };
  }

  return withTenantDatabase(tenantDatabase, async () => {
    if (!roleId && user.role === 'employee' && (user.employee_id || user.employeeId) && (user.tenant_id || user.tenantId)) {
      const employeeRole = await Role.findEmployeeRole();
      roleId = employeeRole?.id || null;
      if (roleId) {
        await User.assignRoleToEmployee(user.employee_id || user.employeeId, user.tenant_id || user.tenantId, roleId);
      }
    }

    const role = await Role.findById(roleId);
    return {
      ...user,
      role_id: roleId,
      roleId,
      roleName: role?.name || null,
      permissions: role?.permissions || [],
    };
  });
};

const getUserTenantId = async (authUser) => {
  if (authUser?.tenantId || authUser?.tenant_id) {
    return authUser.tenantId || authUser.tenant_id;
  }

  if (authUser?.role !== 'admin') return null;

  const tenant = await Tenant.findByAdminUserId(authUser.id);
  return tenant?.id || null;
};

const withLocationNames = async (data = {}) => {
  const location = await Location.getStateDistrictNames(data.state_id, data.district_id);
  return {
    ...data,
    state: location.state || data.state || null,
    district: location.district || data.district || null,
  };
};

export const requestSignupOTPService = async ({ name, email, password, role }) => {
  const existingUser = await User.findByEmailOnly(email);
  if (existingUser) {
    throw new ApiError(400, 'User already exists');
  }

  const otp = User.generateOTP();
  await User.createPendingSignup({ name, email, password, role }, otp);

  const emailResult = await sendOTPEmail(email, otp);
  if (!emailResult.success) {
    throw new ApiError(500, emailResult.message);
  }

  return { message: 'OTP sent successfully to your email' };
};

export const verifySignupOTPService = async ({ email, otp }) => {
  const existingUser = await User.findByEmailOnly(email);
  if (existingUser) {
    await User.deletePendingSignup(email);
    throw new ApiError(400, 'User already exists');
  }

  const result = await User.verifyPendingSignup(email, otp);
  if (!result.valid) {
    throw new ApiError(400, result.message);
  }

  const user = await enrichUserWithPermissions(await User.createWithHashedPassword({
    name: result.pendingSignup.name,
    email: result.pendingSignup.email,
    password: result.pendingSignup.password,
    role: result.pendingSignup.role,
  }));

  await User.deletePendingSignup(email);

  const token = signToken(user);

  return {
    message: 'User registered successfully',
    user: toApiUser(user),
    token,
  };
};

export const loginService = async ({ email, loginId, employeeId, password }) => {
  const loginIdentifier = email || loginId || employeeId;

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPasswordHash = process.env.SUPER_ADMIN_PASSWORD_HASH;

  if (
    superAdminEmail &&
    superAdminPasswordHash &&
    String(loginIdentifier).trim().toLowerCase() === superAdminEmail.trim().toLowerCase()
  ) {
    const isValidSuperAdminPassword = await bcrypt.compare(password, superAdminPasswordHash);
    if (!isValidSuperAdminPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }

    return {
      message: 'Login successful',
      user: {
        id: 1,
        name: 'Super Admin',
        email: superAdminEmail,
        role: 'SUPER_ADMIN',
        status: 'active',
        onboarding_completed: true,
      },
      token: signSuperAdminToken(),
    };
  }

  const user = await User.findByLoginId(loginIdentifier);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.status === 'inactive') {
    throw new ApiError(403, user.role === 'employee'
      ? 'Your employee account is inactive. Please contact your company administrator.'
      : 'Your account has been deactivated. Please contact your administrator.');
  }

  const isValidPassword = await User.comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const userWithPermissions = await enrichUserWithPermissions(user);
  const token = signToken(userWithPermissions);

  return {
    message: 'Login successful',
    user: toApiUser(userWithPermissions),
    token,
  };
};

export const getProfileService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return toApiUser(await enrichUserWithPermissions(user));
};

export const getOnboardingService = async (authUser) => {
  const tenantId = await getUserTenantId(authUser);
  if (!tenantId) {
    throw new ApiError(404, 'Company onboarding not found');
  }

  const onboarding = await Tenant.findOnboardingByTenantId(tenantId);
  if (!onboarding) {
    throw new ApiError(404, 'Company onboarding not found');
  }

  return onboarding;
};

export const completeOnboardingService = async (authUser, { profile = {}, company, subscription = 'basic' }) => {
  if (authUser.role !== 'admin') {
    throw new ApiError(403, 'Only admin users can complete company onboarding');
  }

  const companyName = company.companyName?.trim();
  const companyEmail = company.email?.trim();

  if (companyEmail) {
    const emailVerified = await EmailVerification.isEmailVerified(companyEmail, 'company_email');
    if (!emailVerified) {
      throw new ApiError(400, 'Company email must be verified before completing onboarding', {
        code: 'COMPANY_EMAIL_NOT_VERIFIED',
        email: companyEmail,
      });
    }
  }

  if (!await Location.isValidDistrictForState(company.state_id, company.district_id)) {
    throw new ApiError(400, 'Company district must belong to the selected state');
  }

  if (
    (profile.state_id || profile.district_id) &&
    !await Location.isValidDistrictForState(profile.state_id, profile.district_id)
  ) {
    throw new ApiError(400, 'Profile district must belong to the selected state');
  }

  const existingTenant = await Tenant.findByAdminUserId(authUser.id);
  const databaseName = existingTenant?.databaseName || createTenantDatabaseName(companyName, authUser.id);
  const tenantPool = await createTenantDatabase(databaseName);

  await createTables(tenantPool, {
    includeMasterTables: false,
    includeTenantTables: true,
  });

  const profileWithLocation = await withLocationNames(profile);
  const companyWithLocation = await withLocationNames({ ...company, companyName });

  const tenant = await Tenant.upsertOnboarding(authUser.id, {
    companyName,
    databaseName,
    subscriptionPlan: subscription,
    profile: profileWithLocation,
    company: companyWithLocation,
  });

  const updatedUser = await enrichUserWithPermissions(await User.attachTenant(authUser.id, tenant.id, databaseName));
  const token = signToken(updatedUser);

  return {
    message: 'Company tenant database created successfully',
    tenant,
    user: toApiUser(updatedUser),
    token,
  };
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');
const companyLogoUploadPath = 'uploads/company/logos';

const getUploadedCompanyLogoPath = (file) => (file ? `${companyLogoUploadPath}/${file.filename}` : '');

const deleteCompanyLogoFile = (logoPath) => {
  if (!logoPath || hasBase64Logo(logoPath)) return;

  const normalizedLogoPath = String(logoPath).replace(/^\/+/, '').replace(/\\/g, '/');
  if (!normalizedLogoPath.startsWith(`${companyLogoUploadPath}/`)) return;

  const absoluteLogoPath = path.resolve(backendRoot, normalizedLogoPath);
  const uploadsRoot = path.resolve(backendRoot, companyLogoUploadPath);

  // Delete only files inside uploads/company/logos so saved paths cannot remove unrelated files.
  if (!absoluteLogoPath.startsWith(uploadsRoot)) return;

  fs.unlink(absoluteLogoPath, (error) => {
    if (error && error.code !== 'ENOENT') {
      console.error('COMPANY LOGO DELETE ERROR:', error);
    }
  });
};

export const updateOnboardingCompanyService = async (authUser, rawBody, file) => {
  if (authUser.role !== 'admin') {
    throw new ApiError(403, 'Only admin users can update company onboarding');
  }

  const tenantId = await getUserTenantId(authUser);
  if (!tenantId) {
    throw new ApiError(428, 'Company onboarding is required before updating company details');
  }

  const existingTenant = await Tenant.findByAdminUserId(authUser.id);
  if (!existingTenant) {
    throw new ApiError(428, 'Company onboarding is required before updating company details');
  }

  const existingOnboarding = await Tenant.findOnboardingByTenantId(tenantId);
  const existingCompanyEmail = existingOnboarding?.company?.email?.trim().toLowerCase() || '';
  const company = rawBody?.company || rawBody || {};
  const companyName = company.companyName?.trim();
  const companyEmail = company.email?.trim();
  const requestedCompanyEmail = companyEmail?.toLowerCase() || '';
  const uploadedLogoPath = getUploadedCompanyLogoPath(file);

  if (!companyName) {
    throw new ApiError(400, 'Company name is required');
  }

  if (!uploadedLogoPath && hasBase64Logo(company.logoPreview)) {
    throw new ApiError(400, 'Company logo must be uploaded as a file');
  }

  const isCompanyEmailChanged = requestedCompanyEmail && requestedCompanyEmail !== existingCompanyEmail;
  if (isCompanyEmailChanged) {
    const emailVerified = await EmailVerification.isEmailVerified(companyEmail, 'company_email');
    if (!emailVerified) {
      throw new ApiError(400, 'Company email must be verified before updating company details', {
        code: 'COMPANY_EMAIL_NOT_VERIFIED',
        email: companyEmail,
      });
    }
  }

  if (company.pincode && !PINCODE_REGEX.test(String(company.pincode).trim())) {
    throw new ApiError(400, 'PIN code must be 6 digits and cannot start with 0');
  }

  if (!await Location.isValidDistrictForState(company.state_id, company.district_id)) {
    throw new ApiError(400, 'Company district must belong to the selected state');
  }

  const companyWithLocation = await withLocationNames({
    ...company,
    companyName,
    logoPreview: uploadedLogoPath || company.logoPreview || existingOnboarding?.company?.logoPreview || null,
  });

  await Tenant.upsertTenant(authUser.id, {
    companyName,
    databaseName: existingTenant.databaseName,
    subscriptionPlan: existingTenant.subscriptionPlan || 'basic',
  });
  await Tenant.upsertCompany(tenantId, authUser.id, companyWithLocation);

  if (uploadedLogoPath && existingOnboarding?.company?.logoPreview !== uploadedLogoPath) {
    deleteCompanyLogoFile(existingOnboarding?.company?.logoPreview);
  }

  const onboarding = await Tenant.findOnboardingByTenantId(tenantId);

  return {
    message: 'Company details updated successfully',
    onboarding,
  };
};

export const updateOnboardingProfileService = async (authUser, { profile = {} }) => {
  if (authUser.role !== 'admin') {
    throw new ApiError(403, 'Only admin users can update onboarding profile');
  }

  const tenantId = await getUserTenantId(authUser);
  if (!tenantId) {
    throw new ApiError(428, 'Company onboarding is required before updating profile details');
  }

  if (
    (profile.state_id || profile.district_id) &&
    !await Location.isValidDistrictForState(profile.state_id, profile.district_id)
  ) {
    throw new ApiError(400, 'Profile district must belong to the selected state');
  }

  const profileWithLocation = await withLocationNames(profile);
  await Tenant.upsertProfile(tenantId, authUser.id, profileWithLocation);

  const onboarding = await Tenant.findOnboardingByTenantId(tenantId);

  return {
    message: 'Profile details updated successfully',
    onboarding,
  };
};

export const updateOnboardingSubscriptionService = async (authUser, { subscription, planId }) => {
  if (authUser.role !== 'admin') {
    throw new ApiError(403, 'Only admin users can update subscription');
  }

  const tenantId = await getUserTenantId(authUser);
  if (!tenantId) {
    throw new ApiError(428, 'Company onboarding is required before updating subscription');
  }

  const subscriptionPlan = subscription || planId;

  const existingTenant = await Tenant.findByAdminUserId(authUser.id);
  if (existingTenant) {
    await Tenant.upsertTenant(authUser.id, {
      companyName: existingTenant.companyName,
      databaseName: existingTenant.databaseName,
      subscriptionPlan,
    });
  }
  await Tenant.upsertSubscription(tenantId, authUser.id, subscriptionPlan);

  const onboarding = await Tenant.findOnboardingByTenantId(tenantId);

  return {
    message: 'Subscription updated successfully',
    onboarding,
  };
};

export const sendOTPService = async (email) => {
  const user = await User.findByEmailOnly(email);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const otp = User.generateOTP();
  await User.setOTP(email, otp);

  const emailResult = await sendOTPEmail(email, otp);
  if (!emailResult.success) {
    throw new ApiError(500, emailResult.message);
  }

  return { message: 'OTP sent successfully to your email' };
};

export const verifyOTPService = async (email, otp) => {
  const result = await User.verifyOTP(email, otp);
  if (!result.valid) {
    throw new ApiError(400, result.message);
  }

  const resetToken = jwt.sign({ email, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '15m' });

  return { message: result.message, resetToken };
};

export const resetPasswordService = async (resetToken, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, JWT_SECRET);
  } catch {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  if (decoded.purpose !== 'password_reset') {
    throw new ApiError(400, 'Invalid token purpose');
  }

  await User.resetPassword(decoded.email, newPassword);

  return { message: 'Password reset successfully' };
};
