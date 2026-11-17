// Simple QR code generation function
export const generateQRCodeDataURL = (text: string): string => {
  // This is a simple placeholder QR code implementation
  // In a real application, you would use a proper QR code library
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 60;
  canvas.height = 60;
  
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 60, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(5, 5, 50, 50);
    ctx.fillStyle = '#000000';
    // Simple pattern for QR representation
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(10 + i * 6, 10 + j * 6, 5, 5);
        }
      }
    }
  }
  
  return canvas.toDataURL();
};

export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash': return 'Efectivo';
    case 'transfer': return 'Transferencia';
    case 'card': return 'Tarjeta';
    case 'check': return 'Cheque';
    default: return method;
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'paid': return 'Pagado';
    case 'pending': return 'Pendiente';
    case 'overdue': return 'Vencido';
    case 'partial': return 'Parcial';
    default: return status;
  }
};

export const formatMultiplePaymentMethods = (paymentMethod: string): string => {
  if (!paymentMethod) return 'No especificado';
  
  // Check if it contains multiple payment methods (separated by +, comma, or "and")
  const methods = paymentMethod.split(/[+,&]|and|y/).map(method => method.trim());
  
  if (methods.length > 1) {
    const translatedMethods = methods.map(method => getPaymentMethodLabel(method));
    return translatedMethods.join(' + ');
  }
  
  return getPaymentMethodLabel(paymentMethod);
};