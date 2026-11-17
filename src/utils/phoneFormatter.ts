/**
 * Formats phone numbers by adding +54 prefix to all numbers except landlines starting with 4940
 */
export const formatPhoneNumber = (phone: string | number | null): string | number | null => {
  if (phone === null) return null;
  
  const phoneStr = String(phone).trim();
  if (!phoneStr) return null;
  
  // Extract only digits to check the actual number
  const digitsOnly = phoneStr.replace(/\D/g, '');
  
  // Check if the number starts with 4940 (after removing area codes)
  // We check if 4940 appears at the start or after common area codes
  const is4940Landline = 
    digitsOnly.startsWith('4940') || 
    digitsOnly.startsWith('03584940') ||
    digitsOnly.startsWith('35844940');
  
  // If it's a 4940 landline or already has +54, leave as is
  if (is4940Landline || phoneStr.startsWith('+54')) {
    return phone;
  }
  
  // Add +54 prefix to the original phone format
  return `+54 ${phoneStr}`;
};

/**
 * Processes an array of client data and formats all phone numbers
 */
export const formatClientPhones = (clients: any[]): any[] => {
  return clients.map(client => ({
    ...client,
    TELEFONO: formatPhoneNumber(client.TELEFONO)
  }));
};
