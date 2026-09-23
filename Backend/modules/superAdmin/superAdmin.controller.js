import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getDashboardService,
  getCompaniesService,
  getCompanyService,
  updateCompanyStatusService,
  deleteCompanyService,
  impersonateCompanyAdminService,
  updateSubscriptionService,
  getAuditLogsService,
  getGlobalSettingsService,
  updateGlobalSettingsService,
} from './superAdmin.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  res.json(await getDashboardService());
});

export const getCompanies = asyncHandler(async (req, res) => {
  res.json(await getCompaniesService(req.query));
});

export const getCompany = asyncHandler(async (req, res) => {
  res.json(await getCompanyService(req.params.id));
});

export const updateCompanyStatus = asyncHandler(async (req, res) => {
  res.json(await updateCompanyStatusService(req, req.params.id, req.body.status));
});

export const deleteCompany = asyncHandler(async (req, res) => {
  res.json(await deleteCompanyService(req, req.params.id));
});

export const impersonateCompanyAdmin = asyncHandler(async (req, res) => {
  res.json(await impersonateCompanyAdminService(req, req.params.id));
});

export const updateSubscription = asyncHandler(async (req, res) => {
  res.json(await updateSubscriptionService(req, req.params.id, req.body.planId, req.body.status));
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  res.json(await getAuditLogsService());
});

export const getGlobalSettings = asyncHandler(async (req, res) => {
  res.json(await getGlobalSettingsService());
});

export const updateGlobalSettings = asyncHandler(async (req, res) => {
  res.json(await updateGlobalSettingsService(req.body));
});
