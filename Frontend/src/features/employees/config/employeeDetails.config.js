import { formatDate } from '../utils/employee.utils';

export const employeeDetailGroups = [
  {
    title: '1. Basic Information',
    fields: [
      ['Employee Name', 'name'],
      ['Employee Code', (employee) => employee.employeeId || employee.employee_id],
      ['Date of Birth', (employee) => formatDate(employee.dob)],
      ['Gender', 'gender'],
      ['Blood Group', 'bloodGroup'],
    ],
  },
  {
    title: '2. Family Details',
    fields: [
      ["Father's Name", 'fatherName'],
      ["Mother's Name", 'motherName'],
      ['Marital Status', (employee) => employee.maritalStatus || employee.marital_status],
      ['Spouse Name', (employee) => (
        (employee.maritalStatus || employee.marital_status) === 'Married'
          ? employee.spouseName || employee.spouse_name
          : '-'
      )],
    ],
  },
  {
    title: '3. Contact Information',
    fields: [
      ['Contact Number', 'phone'],
      ['Emergency Contact Number', 'emergencyContact'],
      ['Email ID', 'email'],
    ],
  },
  {
    title: '4. Address Details',
    fields: [
      ['Current Address', 'currentAddress'],
      ['Permanent Address', 'permanentAddress'],
    ],
  },
  {
    title: '5. Employment Details',
    fields: [
      ['Previous Company', 'previousCompany'],
      ['Total Experience', 'experience'],
      ['Previous Salary', 'previousSalary'],
      ['Reason For Leaving', 'reasonForLeaving'],
    ],
  },
  {
    title: '6. Current Job Details',
    fields: [
      ['Department', 'department'],
      ['Designation', 'designation'],
      ['Current Salary', 'salary'],
      ['Date of Joining', (employee) => formatDate(employee.join_date)],
    ],
  },
  {
    title: '7. Working Schedule',
    fields: [
      ['Working Start Time', (employee) => employee.workSchedule?.startTime || '-'],
      ['Working End Time', (employee) => employee.workSchedule?.endTime || '-'],
      ['Schedule Effective From', (employee) => formatDate(employee.workSchedule?.effectiveFrom)],
    ],
  },
  {
    title: '8. Skills & Review',
    fields: [
      ['Key Skills', 'skills'],
      ['Performance / Review Notes', (employee) => employee.reviewNotes || employee.Review],
    ],
  },
  {
    title: '9. Documents Submitted',
    fields: [
      ['Aadhaar Number', 'aadhaarNumber'],
      ['PAN Number', 'panNumber'],
      ['Resume', (employee) => employee.resumeFile || '-'],
    ],
  },
  {
    title: '10. Bank Details',
    fields: [
      ['Account Holder Name', 'accountholder'],
      ['Bank Name', 'bankName'],
      ['Bank Account Number', (employee) => employee.bankAccountNumber || employee.bankAccountNo],
      ['IFSC Code', 'ifscCode'],
    ],
  },
];
