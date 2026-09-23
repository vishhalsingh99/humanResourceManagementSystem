const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN');
};

const valueOf = (employee, key) => {
  const value = typeof key === 'function' ? key(employee) : employee[key];
  return value === undefined || value === null || value === '' ? '-' : value;
};

const scheduleValue = (employee, field) => {
  const schedule = employee.workSchedule || {};
  return schedule[field] || '-';
};

// Render the logo only when a logoPreview value exists, preventing broken images in generated PDFs.
const renderCompanyLogo = (company = {}) => {
  const logoPreview = String(company.logoPreview || '').trim();
  return logoPreview ? `<img class="logo" src="${escapeHtml(logoPreview)}" alt="${escapeHtml(company.companyName || 'Company logo')}">` : '';
};

const renderCompanyHeader = (company = {}) => `
  <div class="brand-row">
    ${renderCompanyLogo(company)}
    <div>
      <div class="brand">${escapeHtml(company.companyName)}</div>
      <div class="address">${escapeHtml(company.address)}</div>
    </div>
  </div>
`;

const employeeFields = [
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
      ['Previous Salary', ' previousSalary'],
      ['Reason For Leaving', 'reasonForLeaving'],
    ],
  },
  {
    title: '6. Current Job Details',
    fields: [
      ['Department', 'department'],
      ['Designation', 'designation'],
      [' Salary', 'salary'],
      ['Date of Joining', (employee) => formatDate(employee.join_date || employee.joinDate)],
    ],
  },
  {
    title: '7. Working Schedule',
    fields: [
      ['Working Start Time', (employee) => scheduleValue(employee, 'startTime')],
      ['Working End Time', (employee) => scheduleValue(employee, 'endTime')],
      ['Schedule Effective From', (employee) => formatDate(scheduleValue(employee, 'effectiveFrom'))],
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
      ['Resume', 'resumeFile'],
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

const baseStyles = `
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #ffffff; }
    .page { padding: 28px; }
    .header { border-bottom: 3px solid #111827; padding-bottom: 18px; margin-bottom: 24px; }
    .brand-row { display: flex; align-items: center; gap: 14px; }
    .logo { width: 100px; height: 100px;  object-fit: contain; flex: 0 0 90px; }
    .brand { font-size: 28px; font-weight: 800; letter-spacing: .04em; }
    .address { margin-top: 6px; color: #475569; font-size: 12px; line-height: 1.5; white-space: pre-line; }
    h1 { margin: 22px 0 0; text-align: center; font-size: 22px; letter-spacing: .03em; }
    h2 { margin: 22px 0 10px; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
    .field { display: grid; grid-template-columns: 210px 1fr; gap: 16px; margin: 9px 0; font-size: 13px; }
    .label { font-weight: 700; }
    .value { border-bottom: 1px dotted #64748b; min-height: 20px; padding-bottom: 3px; white-space: pre-wrap; }
    .declaration { margin-top: 28px; line-height: 1.7; font-size: 13px; }
    .signature { margin-top: 38px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #eef5ff; color: #0f172a; text-align: left; font-weight: 700; }
    th, td { border: 1px solid #cbd5e1; padding: 7px; vertical-align: top; }
    tr { break-inside: avoid; }
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }

      body {
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .no-print {
        display: none !important;
      }
    }
  </style>
`;

const printScript = `
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 300);
        };

        window.onafterprint = () => {
          window.close();
        };
      </script>
`;

export const renderEmployeeForm = (employee, company) => `
  <!doctype html>
  <html>
    <head><meta charset="utf-8">${baseStyles}</head>
    <body>
      <main class="page">
        <section class="header">
          ${renderCompanyHeader(company)}
          <h1>EMPLOYEE DETAILS FORM</h1>
        </section>
        ${employeeFields
    .map(
      (group) => `
              <section>
                <h2>${escapeHtml(group.title)}</h2>
                ${group.fields
          .map(
            ([label, key]) => `
                      <div class="field">
                        <div class="label">${escapeHtml(label)}:</div>
                        <div class="value">${escapeHtml(valueOf(employee, key))}</div>
                      </div>
                    `
          )
          .join('')}
              </section>
            `
    )
    .join('')}
        <section>
          <h2>10. Declaration</h2>
          <p class="declaration">I hereby declare that the above information is true to the best of my knowledge.</p>
          <div class="signature">
            <div>Employee Signature: ___________________</div>
            <div>Date: _____/_______/________</div>
          </div>
        </section>
      </main>
      ${printScript}
    </body>
  </html>
`;

export const renderEmployeeList = (employees, company) => `
  <!doctype html>
  <html>
    <head><meta charset="utf-8">${baseStyles}</head>
    <body>
      <main class="page">
        <section class="header">
          ${renderCompanyHeader(company)}
          <h1>EMPLOYEES LIST</h1>
        </section>
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Gender</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
            ${employees
    .map(
      (employee, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(employee.employeeId || employee.employee_id || '-')}</td>
                    <td>${escapeHtml(employee.name || '-')}</td>
                    <td>${escapeHtml(employee.gender || '-')}</td>
                    <td>${escapeHtml(employee.phone || '-')}</td>
                    <td>${escapeHtml(employee.email || '-')}</td>
                    <td>${escapeHtml(employee.department || '-')}</td>
                    <td>${escapeHtml(employee.designation || '-')}</td>
                    <td>${escapeHtml(formatDate(employee.join_date || employee.joinDate))}</td>
                  </tr>
                `
    )
    .join('')}
          </tbody>
        </table>
      </main>
      ${printScript}
    </body>
  </html>
`;

export const renderPayslip = (dashboard, company) => `
  <!doctype html>
  <html>
    <head><meta charset="utf-8">${baseStyles}</head>
    <body>
      <main class="page">
        <section class="header">
          ${renderCompanyHeader(company)}
          <h1>PAYSLIP - ${escapeHtml(dashboard.month)} ${escapeHtml(dashboard.year)}</h1>
        </section>
        <section>
          <h2>Employee Details</h2>
          <div class="field"><div class="label">Employee Name:</div><div class="value">${escapeHtml(dashboard.employee.name)}</div></div>
          <div class="field"><div class="label">Employee Code:</div><div class="value">${escapeHtml(dashboard.employee.employeeId)}</div></div>
          <div class="field"><div class="label">Department:</div><div class="value">${escapeHtml(dashboard.employee.department)}</div></div>
          <div class="field"><div class="label">Designation:</div><div class="value">${escapeHtml(dashboard.employee.designation)}</div></div>
          <div class="field"><div class="label">Join Date:</div><div class="value">${escapeHtml(formatDate(dashboard.employee.joinDate))}</div></div>
          <div class="field"><div class="label">Eligible Period:</div><div class="value">${escapeHtml(formatDate(dashboard.period.start))} - ${escapeHtml(formatDate(dashboard.period.end))}</div></div>
        </section>
        <section>
          <h2>Attendance Summary</h2>
          <table>
            <tbody>
              <tr><th>Present Days</th><td>${dashboard.attendance.presentDays}</td><th>Absent Days</th><td>${dashboard.attendance.absentDays}</td></tr>
              <tr><th>Half Days</th><td>${dashboard.attendance.halfDays}</td><th>Late Count</th><td>${dashboard.attendance.lateCount}</td></tr>
              <tr><th>Eligible Days</th><td>${dashboard.period.eligibleDays}</td><th>Payable Days</th><td>${dashboard.salary.payableDays}</td></tr>
              <tr><th>Leave Days</th><td>${dashboard.leave.totalLeaveDays}</td><th>Sandwich Leave Days</th><td>${dashboard.leave.sandwichLeaveDays}</td></tr>
              <tr><th>Paid Leave Balance</th><td>${dashboard.leave.paidLeaveBalance || 0}</td><th>Paid Leave Used</th><td>${dashboard.leave.paidLeaveUsed || 0}</td></tr>
              <tr><th>Unpaid Leave Days</th><td>${dashboard.leave.unpaidLeaveDays || 0}</td><th>Carry Forward Leave</th><td>${dashboard.leave.carryForwardBalance || 0}</td></tr>
              <tr><th>Overtime Hours</th><td>${dashboard.attendance.overtimeHours}</td><th>Per-Day Salary</th><td>Rs ${Number(dashboard.salary.perDaySalary).toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </section>
        <section>
          <h2>Salary Calculation</h2>
          <table>
            <tbody>
              <tr><th>Monthly Salary</th><td>Rs ${Number(dashboard.salary.monthlySalary).toLocaleString('en-IN')}</td></tr>
              <tr><th>Payable Salary</th><td>Rs ${Number(dashboard.salary.payableSalary).toLocaleString('en-IN')}</td></tr>
              <tr><th>Deductions</th><td>Rs ${Number(dashboard.salary.salaryDeductions).toLocaleString('en-IN')}</td></tr>
              <tr><th>Leave Value</th><td>Rs ${Number(dashboard.salary.leaveDeduction).toLocaleString('en-IN')}</td></tr>
              <tr><th>Absent Cut</th><td>Rs ${Number(dashboard.salary.absentDeduction).toLocaleString('en-IN')}</td></tr>
              <tr><th>Bonus / Overtime</th><td>Rs ${Number(dashboard.salary.bonus).toLocaleString('en-IN')}</td></tr>
              <tr><th>Net Salary</th><td><strong>Rs ${Number(dashboard.salary.netSalary).toLocaleString('en-IN')}</strong></td></tr>
              <tr><th>Payroll Status</th><td>${escapeHtml(dashboard.payrollStatus)}</td></tr>
            </tbody>
          </table>
        </section>
        <div class="signature">
          <div>Employee Signature: ___________________</div>
          <div>Authorized Signatory: ___________________</div>
        </div>
      </main>
      ${printScript}
    </body>
  </html>
`;
