/**
 * Validate phone number
 * Rules: 
 * - Minimum 10 digits
 * - Must start with 6, 7, 8, or 9
 */
export const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Allow empty if not required elsewhere
  
  const phoneString = String(phone).trim();
  
  // Check if it has at least 10 digits
  if (phoneString.length < 10) {
    return false;
  }
  
  // Check if first digit is 6, 7, 8, or 9
  const firstDigit = phoneString.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return false;
  }
  
  // Check if all characters are digits
  if (!/^\d+$/.test(phoneString)) {
    return false;
  }
  
  return true;
};

export const getPhoneErrorMessage = (phone) => {
  if (!phone) return null;
  
  const phoneString = String(phone).trim();
  
  if (phoneString.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  
  const firstDigit = phoneString.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return 'Phone number must start with 6, 7, 8, or 9';
  }
  
  if (!/^\d+$/.test(phoneString)) {
    return 'Phone number must contain only digits';
  }
  
  return null;
};
