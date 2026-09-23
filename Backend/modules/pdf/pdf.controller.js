import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  renderEmployeeFormPageService,
  renderEmployeeListPageService,
  renderPayslipPageService,
} from './pdf.service.js';

const sendPrintPage = (res, html) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
};

export const employeeFormPage = asyncHandler(async (req, res) => {
  sendPrintPage(res, await renderEmployeeFormPageService(req));
});

export const employeesListPage = asyncHandler(async (req, res) => {
  sendPrintPage(res, await renderEmployeeListPageService(req));
});

export const payslipPage = asyncHandler(async (req, res) => {
  sendPrintPage(res, await renderPayslipPageService(req));
});
