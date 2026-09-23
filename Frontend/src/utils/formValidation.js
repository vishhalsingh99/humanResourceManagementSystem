export const validatePincode = (pincode) => {
  if (!pincode) return true;
  return /^[1-9]\d{5}$/.test(String(pincode).trim());
};

export const getPincodeErrorMessage = (pincode) => {
  if (!pincode || validatePincode(pincode)) return '';
  return 'PIN code must be 6 digits and cannot start with 0';
};

export const validatePositiveNumber = (value) => {
  if (value === '' || value === null || value === undefined) return true;
  return Number.isFinite(Number(value)) && Number(value) > 0;
};

export const getSalaryErrorMessage = (salary) => {
  if (salary === '' || salary === null || salary === undefined || validatePositiveNumber(salary)) return '';
  return 'Salary must be a positive number';
};

export const validateAadhaarNumber = (aadhaarNumber) => {
  if (!aadhaarNumber) return true;
  return /^\d{12}$/.test(String(aadhaarNumber).trim());
};

export const getAadhaarErrorMessage = (aadhaarNumber) => {
  if (!aadhaarNumber || validateAadhaarNumber(aadhaarNumber)) return '';
  return 'Aadhaar number must be exactly 12 digits';
};

export const validatePanNumber = (panNumber) => {
  if (!panNumber) return true;
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(String(panNumber).trim().toUpperCase());
};

export const getPanErrorMessage = (panNumber) => {
  if (!panNumber || validatePanNumber(panNumber)) return '';
  return 'PAN number must use the format ABCDE1234F';
};