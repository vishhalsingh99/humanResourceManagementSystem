const subscriptionPlans = {
  free: {
    name: 'Free',
    employeeLimit: 10,
    upgradeTo: 'Basic',
  },
  basic: {
    name: 'Basic',
    employeeLimit: 25,
    upgradeTo: 'Standard',
  },
  standard: {
    name: 'Standard',
    employeeLimit: 75,
    upgradeTo: 'Premium',
  },
  premium: {
    name: 'Premium',
    employeeLimit: null,
    upgradeTo: null,
  },
};

const getSubscriptionPlan = (planId) => {
  const normalizedPlanId = String(planId || '').toLowerCase();
  return subscriptionPlans[normalizedPlanId] || subscriptionPlans.basic;
};

const getEmployeeLimitMessage = (plan) => {
  if (!plan?.employeeLimit) return '';
  return `⚠ Your ${plan.name} Plan employee limit is reached. Upgrade to ${plan.upgradeTo} Plan.`;
};

export {
  getSubscriptionPlan,
  getEmployeeLimitMessage,
};