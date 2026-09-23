import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getCompanySettingsService,
  updateCompanySettingsService,
  listPoliciesService,
  createPolicyService,
  updatePolicyService,
  deletePolicyService,
  listRulesService,
  createRuleService,
  updateRuleService,
  deleteRuleService,
} from './settings.service.js';

export const getCompanySettings = asyncHandler(async (req, res) => {
  res.json(await getCompanySettingsService());
});

export const updateCompanySettings = asyncHandler(async (req, res) => {
  res.json(await updateCompanySettingsService(req.user, req.body));
});

export const listPolicies = asyncHandler(async (req, res) => {
  res.json(await listPoliciesService(req.user));
});

export const createPolicy = asyncHandler(async (req, res) => {
  res.status(201).json(await createPolicyService(req.user, req.body));
});

export const updatePolicy = asyncHandler(async (req, res) => {
  res.json(await updatePolicyService(req.user, req.params.id, req.body));
});

export const deletePolicy = asyncHandler(async (req, res) => {
  res.json(await deletePolicyService(req.user, req.params.id));
});

export const listRules = asyncHandler(async (req, res) => {
  res.json(await listRulesService(req.user));
});

export const createRule = asyncHandler(async (req, res) => {
  res.status(201).json(await createRuleService(req.user, req.body));
});

export const updateRule = asyncHandler(async (req, res) => {
  res.json(await updateRuleService(req.user, req.params.id, req.body));
});

export const deleteRule = asyncHandler(async (req, res) => {
  res.json(await deleteRuleService(req.user, req.params.id));
});
