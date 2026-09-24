import { z } from 'zod';

const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;
const MARITAL_STATUSES = ['', 'Single', 'Married', 'Divorced', 'Widowed'];

const aadhaarField = z.string().trim().optional().refine(
  (value) => !value || AADHAAR_REGEX.test(value),
  'Aadhaar number must be exactly 12 digits'
);

const panField = z.string().trim().optional().refine(
  (value) => !value || PAN_REGEX.test(value.toUpperCase()),
  'PAN number must use the format ABCDE1234F'
);

const salaryField = z.union([z.string(), z.number()]).optional();

const checkSalary = (data, ctx) => {
  const salary = Number(data.salary);
  if (!Number.isFinite(salary) || salary <= 0) {
    ctx.addIssue({ code: 'custom', message: 'Salary must be a positive number', path: ['salary'] });
  }
};

const familyDetailsRefinement = (data, ctx) => {
  const maritalStatus = data.maritalStatus || data.marital_status || '';
  if (!MARITAL_STATUSES.includes(maritalStatus)) {
    ctx.addIssue({ code: 'custom', message: 'Marital Status must be Single, Married, Divorced, or Widowed' });
    return;
  }
  if (maritalStatus === 'Married' && !String(data.spouseName || data.spouse_name || '').trim()) {
    ctx.addIssue({ code: 'custom', message: 'Spouse Name is required when marital status is Married' });
  }
};

export const createEmployeeSchema = z.object({
  name: z.string().trim().optional(),
  first_name: z.string().trim().optional(),
  department: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  joinDate: z.string().trim().optional(),
  join_date: z.string().trim().optional(),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Gender is required' }),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('A valid employee email is required'),
  salary: salaryField,
  loginPassword: z.string().trim().optional(),
  password: z.string().trim().optional(),
  aadhaarNumber: aadhaarField,
  panNumber: panField,
}).passthrough()
  .superRefine((data, ctx) => {
    const employeeName = data.name || data.first_name;
    const employeeJoinDate = data.joinDate || data.join_date;
    if (!employeeName || !data.department || !data.designation || !employeeJoinDate || !data.gender || !data.phone || !data.email) {
      ctx.addIssue({ code: 'custom', message: 'Name, email, department, designation, join date, gender and phone are required' });
    }
    if (!data.loginPassword && !data.password) {
      ctx.addIssue({ code: 'custom', message: 'Employee login password is required' });
    }
    checkSalary(data, ctx);
    familyDetailsRefinement(data, ctx);
  });

export const updateEmployeeSchema = z.object({
  name: z.string().trim().optional(),
  first_name: z.string().trim().optional(),
  department: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  joinDate: z.string().trim().optional(),
  join_date: z.string().trim().optional(),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Gender is required' }),
  phone: z.string().trim().optional(),
  email: z.string().trim().min(1, 'Employee email is required'),
  salary: salaryField,
  aadhaarNumber: aadhaarField,
  panNumber: panField,
}).passthrough()
  .superRefine((data, ctx) => {
    const employeeName = data.name || data.first_name;
    const employeeJoinDate = data.joinDate || data.join_date;
    if (!employeeName || !data.department || !data.designation || !employeeJoinDate || !data.gender || !data.phone) {
      ctx.addIssue({ code: 'custom', message: 'Name, department, designation, join date, gender and phone are required' });
    }
    checkSalary(data, ctx);
    familyDetailsRefinement(data, ctx);
  });

export const updateEmployeeStatusSchema = z.object({
  status: z.enum(['active', 'inactive'], { message: 'Status must be active or inactive' }),
});

const requiredPasswordField = z.string({
  required_error: 'Current password, new password and confirm password are required',
}).min(1, 'Current password, new password and confirm password are required');

export const changePasswordSchema = z.object({
  currentPassword: requiredPasswordField,
  newPassword: requiredPasswordField,
  confirmPassword: requiredPasswordField,
}).superRefine((data, ctx) => {
  if (data.newPassword.length < 8) {
    ctx.addIssue({ code: 'custom', message: 'New password must be at least 8 characters', path: ['newPassword'] });
    return;
  }
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({ code: 'custom', message: 'New password and confirm password do not match', path: ['confirmPassword'] });
  }
});
