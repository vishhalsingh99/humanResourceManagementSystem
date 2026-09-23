export const departmentFormFields = [
  { label: 'Department Name', name: 'name', required: true },
  { label: 'Department Code', name: 'code', required: true },
  
  
   
  { label: 'Status', name: 'status', type: 'select', options: ['Active', 'Inactive'] },
  {
    label: 'Description',
    name: 'description',
    type: 'textarea',
    className: 'md:col-span-2',
  },
];
