import { materializeMonthlyCredits } from '../services/leaveBalanceService.js';

// Invoke from platform scheduler at 00:05 on day 1, once per tenant context.
// Do not use in-process timers: they run once per Node instance and duplicate in scaled deployments.
async function runMonthlyLeaveCreditJob({ year, month, actorId = null } = {}) {
  return materializeMonthlyCredits({ year, month, actorId });
}

export { runMonthlyLeaveCreditJob };