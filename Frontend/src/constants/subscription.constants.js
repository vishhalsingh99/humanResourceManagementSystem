export const SUBSCRIPTION_PLANS = [
  {
    id: 'Free',
    name: 'Free',
    desc: 'Good for small teams starting with core HRMS tools.',
    price: 'Rs. 0 / month',
    employeeLimit: 10,
    upgradeTo: 'Basic',
    rules: [
      'Maximum 10 employees allowed.',
      'Only 1 company admin account allowed.',
      'Basic HRMS modules available.',
      'Attendance and leave management included.',
      'Payroll module not included.',
      'File storage limit: 500 MB.',
      'Email support only.',
      'Custom roles and permissions not available.',
      'Company branding customization not available.',
      'Data backup retained for 7 days only.',
      'API access not included.',
      'Upgrade required for additional employees or advanced features.',
    ],
  },
  {
    id: 'Basic',
    name: 'Basic',
    desc: 'Balanced plan for growing teams that need payroll and better control.',
    price: 'Rs. 2,499 / month',
    employeeLimit: 25,
    upgradeTo: 'Standard',
    rules: [
      'Maximum 25 employees allowed.',
      'Up to 3 admin/manager accounts.',
      'Attendance, leave, and payroll modules included.',
      'Basic reports and analytics available.',
      'File storage limit: 5 GB.',
      'Priority email support included.',
      'Custom departments and designations supported.',
      'Employee self-service portal available.',
      'Monthly attendance reports included.',
      'Upgrade required for advanced analytics and integrations.',
    ],
  },
  {
    id: 'Standard',
    name: 'Standard',
    desc: 'Best for established teams that need stronger reports and integrations.',
    price: 'Rs. 3,999 / month',
    employeeLimit: 75,
    upgradeTo: 'Premium',
    rules: [
      'Maximum 75 employees allowed.',
      'Up to 10 admin/manager accounts.',
      'All Basic modules included.',
      'Advanced reports and analytics available.',
      'File storage limit: 25 GB.',
      'Priority support included.',
      'Custom roles and permissions available.',
      'Company branding customization available.',
      'Data backup retained for 30 days.',
      'API access included for standard integrations.',
    ],
  },
  {
    id: 'Premium',
    name: 'Premium',
    desc: 'Full HRMS access for larger teams that need maximum scale and support.',
    price: 'Rs. 4,999 / month',
    employeeLimit: null,
    upgradeTo: null,
    rules: [
      'Unlimited employees allowed.',
      'Unlimited admin/manager accounts.',
      'All HRMS modules included.',
      'Advanced analytics and custom reports included.',
      'File storage limit: 100 GB.',
      'Dedicated premium support included.',
      'Custom roles and permissions available.',
      'Company branding customization available.',
      'Data backup retained for 90 days.',
      'Full API access and integrations included.',
    ],
  },
];

export const getSubscriptionPlan = (planId) => {
  const normalizedPlanId = String(planId || '').toLowerCase();
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === normalizedPlanId) || SUBSCRIPTION_PLANS[1];
};

export const getEmployeeLimitMessage = (plan) => {
  const selectedPlan = typeof plan === 'string' ? getSubscriptionPlan(plan) : plan;
  if (!selectedPlan?.employeeLimit) return '';

  return `⚠ Your ${selectedPlan.name} Plan employee limit is reached. Upgrade to ${selectedPlan.upgradeTo} Plan.`;
};
