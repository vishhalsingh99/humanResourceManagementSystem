import CompanySettings from '../../repositories/companySettings.repository.js';
import Attendance from '../../repositories/attendance.repository.js';
import { ApiError } from '../../utils/ApiError.js';

const isCompanyAdmin = (authUser) => authUser?.role === 'admin';

const requireCompanyAdmin = (authUser) => {
  if (!isCompanyAdmin(authUser)) {
    throw new ApiError(403, 'Only Company Admin can update company settings');
  }
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return Boolean(value);
};

export const getCompanySettingsService = () => CompanySettings.get();

export const updateCompanySettingsService = async (authUser, body) => {
  requireCompanyAdmin(authUser);

  const settings = await CompanySettings.update(body || {});
  await Attendance.recalculateAllStatuses();
  return settings;
};

export const listPoliciesService = (authUser) => (
  CompanySettings.listPolicies({ publicOnly: authUser?.role === 'employee' })
);

export const createPolicyService = async (authUser, body) => {
  requireCompanyAdmin(authUser);
  const { title, content } = body;

  return CompanySettings.createPolicy({
    title: title.trim(),
    content: content.trim(),
    isPublished: parseBoolean(body.isPublished ?? body.is_published),
  });
};

export const updatePolicyService = async (authUser, id, body) => {
  requireCompanyAdmin(authUser);
  const existingPolicy = await CompanySettings.findPolicyById(id);
  if (!existingPolicy) throw new ApiError(404, 'Policy not found');

  const { title, content } = body;

  return CompanySettings.updatePolicy(id, {
    title: title.trim(),
    content: content.trim(),
    isPublished: body.isPublished === undefined && body.is_published === undefined
      ? existingPolicy.isPublished
      : parseBoolean(body.isPublished ?? body.is_published),
  });
};

export const deletePolicyService = async (authUser, id) => {
  requireCompanyAdmin(authUser);
  const deleted = await CompanySettings.deletePolicy(id);
  if (!deleted) throw new ApiError(404, 'Policy not found');
  return { message: 'Policy deleted' };
};

export const listRulesService = (authUser) => (
  CompanySettings.listRules({ activeOnly: authUser?.role === 'employee' })
);

export const createRuleService = async (authUser, body) => {
  requireCompanyAdmin(authUser);
  const { title, description } = body;

  return CompanySettings.createRule({
    title: title.trim(),
    description: description.trim(),
    isActive: body.isActive === undefined ? true : parseBoolean(body.isActive ?? body.is_active),
  });
};

export const updateRuleService = async (authUser, id, body) => {
  requireCompanyAdmin(authUser);
  const existingRule = await CompanySettings.findRuleById(id);
  if (!existingRule) throw new ApiError(404, 'Rule not found');

  const { title, description } = body;

  return CompanySettings.updateRule(id, {
    title: title.trim(),
    description: description.trim(),
    isActive: body.isActive === undefined && body.is_active === undefined
      ? existingRule.isActive
      : parseBoolean(body.isActive ?? body.is_active),
  });
};

export const deleteRuleService = async (authUser, id) => {
  requireCompanyAdmin(authUser);
  const deleted = await CompanySettings.deleteRule(id);
  if (!deleted) throw new ApiError(404, 'Rule not found');
  return { message: 'Rule deleted' };
};
