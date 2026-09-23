export const getEmployeeFormSections = (

  departmentOptions = [],
  designationOptions = [],
  isEditing = false
) => [
    {
      title: '1. Basic Information',
      gridClassName: 'grid gap-6 md:grid-cols-2 xl:grid-cols-4',
      fields: [
        { label: 'Employee Name', name: 'name', required: true },
        ...(isEditing
          ? [{ label: 'Employee Code', name: 'employeeId', required: true, readOnly: true }]
          : []),
        {
          label: 'Date of Birth',
          name: 'dob',
          type: 'date',
          required: true,
          max: new Date(
            new Date().getFullYear() - 18,
            new Date().getMonth(),
            new Date().getDate()
          )
            .toISOString()
            .split('T')[0],
        },

      { label: 'Gender', name: 'gender', required: true, type: 'select', options: ['Select', 'Male', 'Female', 'Other'] },
        { label: 'Blood Group', name: 'bloodGroup' },

      ],
    },
    {
      title: '2. Family Details',
      gridClassName: 'grid gap-6 md:grid-cols-4',
      fields: [
        { label: "Father's Name", name: 'fatherName', required: true },
        { label: "Mother's Name", name: 'motherName', required: true },
        {
          label: 'Marital Status',
          name: 'maritalStatus',
          type: 'select',
          required: true,
          options: [
            { label: 'Select Marital Status', value: '' },
            'Single',
            'Married',
            'Divorced',
            'Widowed',
          ],
        },
        {
          label: 'Spouse Name',
          name: 'spouseName',
          required: true,
          visibleWhen: (form) => form.maritalStatus === 'Married',
        },
      ],
    },
    {
      title: '3. Contact Information',
      gridClassName: 'grid gap-6 md:grid-cols-4 xl:grid-cols-4',
      fields: [
        { label: 'Contact Number', name: 'phone', type: 'tel', maxLength: 10, required: true },
        { label: 'Emergency Contact Number', name: 'emergencyContact', maxLength: 10, type: 'tel' },
        ...(isEditing ? [{ label: 'Email ID', name: 'email', type: 'email', required: true }] : []),
      ],
    },
    {
      title: '4. Address Details',
      gridClassName: 'grid gap-6',
      fields: [
        { label: 'Current Address', name: 'currentAddress', type: 'textarea', rows: 3, required: true },
        { label: 'Permanent Address', name: 'permanentAddress', type: 'textarea', rows: 3, required: true },
      ],
    },
    {
      title: '5. Employment Details',
      gridClassName: 'grid gap-6 md:grid-cols-2 xl:grid-cols-4',
      fields: [
        { label: 'Previous Company', name: 'previousCompany' },
        { label: 'Total Experience', name: 'experience', type: 'number', placeholder: 'In years' },
        { label: 'Previous Salary', name: 'previousSalary', type: 'number' },
        {
          label: 'Reason For Leaving',
          name: 'reasonForLeaving',
          type: 'textarea',
          rows: 3,
          className: 'md:col-span-2 xl:col-span-3',
        },
      ],
    },
    {
      title: '6. Current Job Details',
      gridClassName: 'grid gap-6 md:grid-cols-2 xl:grid-cols-4',
      fields: [
        {
          label: 'Department',
          name: 'department',
          type: 'selectWithAdd',
          options: departmentOptions,
          required: true,

        },
        {
          label: 'Designation',
          name: 'designation',
          type: 'selectWithAdd',
          options: designationOptions,
          required: true,
        },
        { label: 'Current Salary', name: 'salary', type: 'number', min: '0.01', step: '0.01', required: true },
        { label: 'Date of Joining', name: 'join_date', type: 'date', required: true },
      ],
    },
    {
      title: '7. Working Schedule',
      gridClassName: 'grid gap-6 md:grid-cols-3',
      fields: [
        { label: 'Working Start Time', name: 'workStartTime', type: 'time' },
        { label: 'Working End Time', name: 'workEndTime', type: 'time' },
        { label: 'Schedule Effective From', name: 'scheduleEffectiveFrom', type: 'date' },
      ],
    },
    {
      title: '8. Skills & Review',
      gridClassName: 'grid gap-6',
      fields: [
        { label: 'Key Skills', name: 'skills', type: 'textarea', rows: 3 },
        { label: 'Performance / Review Notes', name: 'reviewNotes', type: 'textarea', rows: 3 },
      ],
    },
    {
      title: '9. Documents Submitted',
      gridClassName: 'grid gap-6 md:grid-cols-2 xl:grid-cols-4',
      fields: [
        { label: 'Aadhaar Number', name: 'aadhaarNumber', inputMode: 'numeric', maxLength: 12, required: true, placeholder: '1234 5678 9012' },
        { label: 'PAN Number', name: 'panNumber', maxLength: 10, textTransform: 'uppercase', placeholder: 'ABCDE1234F' },
        { label: 'Upload Resume', name: 'resumeFile', type: 'file', accept: '.pdf,.doc,.docx' },
      ],
    },
    {
      title: '10. Bank Details',
      gridClassName: 'grid gap-6 md:grid-cols-4',
      sectionClassName: 'mt-6',
      fields: [
        { label: 'Account Holder Name', maxLength: 20, placeholder: 'Enter account holder name', name: 'accountholder', type: 'text', },
        { label: 'Bank Name', name: 'bankName', maxLength: 20, placeholder: 'Enter bank name', type: 'text', },
        { label: 'Bank Account Number', name: 'bankAccountNumber', placeholder: ' (e.g.,12345678901234)', type: 'text', maxLength: 15, },
        { label: 'IFSC Code', name: 'ifscCode', placeholder: 'Enter IFSC code', type: 'text', maxLength: 11, },
      ],
    },
    {
      title: '11. Employee Login',
      gridClassName: 'grid gap-6 md:grid-cols-2 xl:grid-cols-4',
      sectionClassName: 'mt-6',
      fields: [
        // { label: 'Login ID', name: 'loginId', placeholder: 'Leave blank to use Employee Code' },
        {
          label: isEditing ? 'Change Password' : 'Login Password',
          name: 'loginPassword',
          type: 'password',
          required: !isEditing,
          placeholder: isEditing ? 'Leave blank to keep old password' : 'Create employee password',
        },
      ],
    },
  ];
