import jsPDF from 'jspdf';
import { formatCurrency } from './numberFormatter';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  type?: string;
  tax_id?: string;
}

interface Service {
  id: string;
  type: string;
  date: string;
  vehicle: string;
  notes: string;
  responsiblePerson?: string;
  companyRepresentative?: string;
  paymentMethod?: string;
  secondaryPaymentMethod?: string;
  amountDelivered?: number;
  service_items?: Array<{
    type: string;
    vehicle: string;
    price: number | string;
    quantity?: number;
  }>;
}

interface Debt {
  id: string;
  clientId: string;
  serviceId: string;
  amount: number;
  dueDate: string;
  status: string;
  comments: string;
  signature?: string;
  createdAt: string;
}

interface Payment {
  amount: number;
  paymentMethod: string;
  date: string;
}

// Simple QR code generation function
const generateQRCodeDataURL = (text: string): string => {
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

const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash': return 'Efectivo';
    case 'transfer': return 'Transferencia';
    case 'card': return 'Tarjeta';
    case 'check': return 'Cheque';
    default: return method;
  }
};

const formatMultiplePaymentMethods = (paymentMethod: string): string => {
  if (!paymentMethod) return 'No especificado';
  
  // Check if it contains multiple payment methods (separated by +, comma, or "and")
  const methods = paymentMethod.split(/[+,&]|and|y/).map(method => method.trim());
  
  if (methods.length > 1) {
    const translatedMethods = methods.map(method => getPaymentMethodLabel(method));
    return translatedMethods.join(' + ');
  }
  
  return getPaymentMethodLabel(paymentMethod);
};

// Convert signature to BLACK strokes on WHITE background
const convertSignatureToBlack = (signatureDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (!ctx) {
            console.error('Could not get canvas context, returning original');
            resolve(signatureDataUrl);
            return;
          }
          
          // Draw white background first
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Build brightness histogram to detect background vs strokes
          const histogram: { [key: number]: number } = {};
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = Math.round((r + g + b) / 3 / 10) * 10; // Group by tens
            histogram[brightness] = (histogram[brightness] || 0) + 1;
          }
          
          // Find the most common brightness (likely background)
          let maxCount = 0;
          let backgroundBrightness = 255;
          for (const [brightness, count] of Object.entries(histogram)) {
            if (count > maxCount) {
              maxCount = count;
              backgroundBrightness = parseInt(brightness);
            }
          }
          
          // Determine if we need to invert (background is dark)
          const needsInversion = backgroundBrightness < 127;
          
          console.log('Signature analysis:', {
            backgroundBrightness,
            needsInversion,
            histogramSize: Object.keys(histogram).length
          });
          
          // Process all pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            
            if (needsInversion) {
              // Dark background with light strokes - invert everything
              const inverted = 255 - brightness;
              data[i] = inverted;
              data[i + 1] = inverted;
              data[i + 2] = inverted;
            } else {
              // Light background with dark strokes - ensure pure black/white
              if (brightness > 200) {
                // Make pure white
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
              } else if (brightness < 55) {
                // Make pure black
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
              }
            }
            
            data[i + 3] = 255; // Make fully opaque
          }
          
          // Put the modified data back
          ctx.putImageData(imageData, 0, 0);
          
          // Return as JPEG
          const result = canvas.toDataURL('image/jpeg', 1.0);
          console.log('Signature processed, result size:', result.length);
          resolve(result);
        } catch (processError) {
          console.error('Error processing signature image:', processError);
          resolve(signatureDataUrl);
        }
      };
      
      img.onerror = (error) => {
        console.error('Failed to load signature image:', error);
        resolve(signatureDataUrl);
      };
      
      img.src = signatureDataUrl;
    } catch (error) {
      console.error('Error in convertSignatureToBlack:', error);
      resolve(signatureDataUrl);
    }
  });
};

export const generateDebtReceiptPDF = async (debt: Debt, client: Client, service: Service, payments: Payment[] = []) => {
  const doc = new jsPDF();
  
  // Professional color scheme
  const primaryColor = [254, 230, 0]; // Yellow #FEE600
  const secondaryColor = [52, 73, 94]; // Dark blue-gray
  const accentColor = [231, 76, 60]; // Red for outstanding amounts
  const successColor = [254, 230, 0]; // Yellow for payments
  const lightGray = [236, 240, 241];
  const darkGray = [149, 165, 166];
  
  // Generate QR code for digital version
  const qrCodeURL = generateQRCodeDataURL(`https://velezneumaticos.com/comprobantes/${debt.id}`);
  
  // Professional Header with gradient effect
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 30, 'F');
  
  // Decorative bottom border
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 28, 210, 2, 'F');
  
  // Company name and branding - Left section
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Velez Neumáticos', 15, 14);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 52, 52);
  doc.text('Especialistas en neumáticos y servicios automotrices', 15, 21);
  
  // Vertical separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(135, 8, 135, 24);
  
  // Document info - Right section with date and time
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 52, 52);
  const currentDate = new Date();
  doc.text(`Fecha: ${currentDate.toLocaleDateString('es-ES')}`, 142, 15);
  doc.text(`Hora: ${currentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, 142, 20);
  
  // Contact info footer - Organized in three columns
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 30, 210, 12, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  // Address
  doc.text('Dr. Nicolás Berrotarán 182, Córdoba', 15, 37);
  
  // Phone
  doc.text('(358) 518-1710', 90, 37);
  
  // Website
  doc.text('www.velezneumaticos.com', 155, 37);
  
  // Professional Title with sophisticated design
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 48, 180, 14, 3, 3, 'F');
  
  // Elegant border
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 48, 180, 14, 3, 3, 'S');
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('COMPROBANTE DE SALDO PENDIENTE', 105, 56, { align: 'center' });
  
  // Client Information Panel
  let currentY = 71;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(15, currentY, 180, 25, 3, 3, 'F');
  
  // Client icon and title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0); // Black text for better contrast
  doc.text('INFORMACIÓN DEL CLIENTE', 20, currentY + 8);
  
  // Client details in organized layout
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const clientName = client.type === 'Empresa' ? client.firstName : `${client.firstName} ${client.lastName}`;
  doc.setFont('helvetica', 'bold');
  doc.text(clientName, 20, currentY + 16);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (client.phone) {
    doc.text(`Tel: ${client.phone}`, 20, currentY + 21);
  }
  
  if (client.email) {
    doc.text(`Email: ${client.email}`, 100, currentY + 21);
  }
  
  if (client.tax_id) {
    doc.text(`CUIT: ${client.tax_id}`, 100, currentY + 16);
  }
  
  // Service & Debt Details Panel
  currentY += 35;
  doc.setFillColor(255, 248, 220);
  doc.roundedRect(15, currentY, 180, 45, 3, 3, 'F');
  
  // Orange accent line for debt details
  doc.setFillColor(255, 193, 7);
  doc.rect(15, currentY, 180, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(198, 125, 0);
  doc.text('DETALLES DEL SERVICIO', 20, currentY + 12);
  
  // Service details in professional grid with tighter spacing
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  
  // Left column labels
  doc.text('Fecha del servicio:', 20, currentY + 16);
  doc.text('Tipo de servicio:', 20, currentY + 20);
  doc.text('Método de pago:', 20, currentY + 24);
  
  // Left column values - positioned directly next to labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  doc.text(new Date(service.date).toLocaleDateString('es-ES'), 49, currentY + 16);
  
  // Handle long service type text with text wrapping
  const serviceTypeText = service.type;
  const maxWidth = 85; // Maximum width for service type
  const splitServiceType = doc.splitTextToSize(serviceTypeText, maxWidth);
  doc.text(splitServiceType, 47, currentY + 20);
  
  const paymentMethodY = currentY + 24;
  doc.text(formatMultiplePaymentMethods(service.paymentMethod || 'No especificado'), 46, paymentMethodY);
  
  // Right column labels and values - positioned directly next to labels
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  
  doc.text('Monto total:', 110, currentY + 16);
  doc.text('Monto entregado:', 110, currentY + 20);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = debt.amount - totalPaid;
  
  doc.text(formatCurrency(debt.amount), 127, currentY + 16);
  doc.text(formatCurrency(service.amountDelivered || 0), 137, currentY + 20);
  
  currentY += 28;
  
  // Add significant space between DETALLES DEL SERVICIO and PERSONAL rectangles
  currentY += 18;
  
  // Staff information panel (if exists)
  if (service.responsiblePerson || (service.companyRepresentative && client.type === 'Empresa')) {
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, currentY, 180, 15, 3, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Black text for better contrast
    doc.text('PERSONAL', 20, currentY + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    
    if (service.responsiblePerson) {
      doc.text(`Atendido por: ${service.responsiblePerson}`, 20, currentY + 11);
    }
    
    if (service.companyRepresentative && client.type === 'Empresa') {
      doc.text(`Representante: ${service.companyRepresentative}`, 110, currentY + 11);
    }
    
    currentY += 20;
  }
  
  // Payment History Panel (if payments exist)
  if (payments.length > 0) {
    doc.setFillColor(240, 255, 240);
    doc.roundedRect(15, currentY, 180, 15 + (payments.length * 8) + 15, 3, 3, 'F');
    
    // Green accent line
    doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    doc.rect(15, currentY, 180, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('HISTORIAL DE PAGOS', 20, currentY + 12);
    
    currentY += 20;
    
    // Professional table headers
    doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    doc.rect(20, currentY, 160, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Black text for better contrast on yellow
    doc.text('MONTO', 25, currentY + 6);
    doc.text('MÉTODO DE PAGO', 70, currentY + 6);
    doc.text('FECHA', 140, currentY + 6);
    
    currentY += 10;
    
    // Payment entries with alternating colors
    payments.forEach((payment, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 255, 248);
        doc.rect(20, currentY, 160, 8, 'F');
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      
      doc.text(formatCurrency(payment.amount), 25, currentY + 5);
      doc.text(formatMultiplePaymentMethods(payment.paymentMethod), 70, currentY + 5);
      doc.text(new Date(payment.date).toLocaleDateString('es-ES'), 140, currentY + 5);
      
      currentY += 8;
    });
    
    // Payment summary
    doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    doc.rect(20, currentY, 160, 12, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black text for better contrast on yellow
    doc.text(`Total Pagado: ${formatCurrency(totalPaid)}`, 25, currentY + 8);
    
    if (remainingAmount > 0) {
      doc.setTextColor(0, 0, 0); // Black text for better contrast on yellow
      doc.text(`Saldo Restante: ${formatCurrency(remainingAmount)}`, 110, currentY + 8);
    } else {
      doc.text('✅ TOTALMENTE PAGADO', 110, currentY + 8);
    }
    
    currentY += 20;
  } else {
    // Outstanding balance alert
    doc.setFillColor(255, 240, 240);
    doc.roundedRect(15, currentY, 180, 20, 3, 3, 'F');
    
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(15, currentY, 180, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`SALDO PENDIENTE: ${formatCurrency(remainingAmount)}`, 20, currentY + 12);
    
    currentY += 25;
  }
  
  // Legal disclaimer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('*Este documento certifica el saldo pendiente y las condiciones acordadas según nuestros términos de servicio.', 20, currentY + 5);
  
  currentY += 15;
  
  // Footer with signature and thank you message
  const footerY = 260; // Fixed footer position
  
  // Footer background
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(0, footerY, 210, 37, 'F');
  
  // Professional separator line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, footerY, 210, 2, 'F');
  
  // Signature section in footer
  console.log('=== PDF GENERATION - SIGNATURE CHECK ===');
  console.log('debt.signature exists:', !!debt.signature);
  console.log('debt.signature type:', typeof debt.signature);
  console.log('debt.signature length:', debt.signature?.length || 0);
  console.log('debt.signature first 100 chars:', debt.signature?.substring(0, 100));
  
  if (debt.signature && debt.signature.trim() !== '') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('FIRMA DEL CLIENTE', 20, footerY + 10);
    
    // Professional signature container
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, footerY + 12, 60, 18, 2, 2, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(20, footerY + 12, 60, 18, 2, 2, 'S');
    
    try {
      console.log('Converting signature to black...');
      console.log('Original signature size:', debt.signature.length);
      // Convert signature to black on white - returns JPEG
      const blackSignature = await convertSignatureToBlack(debt.signature);
      console.log('Converted signature size:', blackSignature.length);
      console.log('Adding signature to PDF at position:', { x: 22, y: footerY + 14, w: 56, h: 14 });
      // Use JPEG format which has no transparency issues
      doc.addImage(blackSignature, 'JPEG', 22, footerY + 14, 56, 14);
      console.log('Signature added to PDF successfully');
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.line(25, footerY + 21, 75, footerY + 21);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('Firma del cliente', 50, footerY + 27, { align: 'center' });
    }
    
    // Date of signature
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${new Date(debt.createdAt).toLocaleDateString('es-ES')}`, 20, footerY + 33);
  } else {
    // Manual signature area
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('FIRMA DEL CLIENTE', 20, footerY + 10);
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, footerY + 12, 60, 18, 2, 2, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(20, footerY + 12, 60, 18, 2, 2, 'S');
    doc.line(25, footerY + 21, 75, footerY + 21);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Firma del cliente', 50, footerY + 27, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${new Date(debt.createdAt).toLocaleDateString('es-ES')}`, 20, footerY + 33);
  }
  
  // Thank you message in footer (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Gracias por confiar en', 110, footerY + 12);
  doc.text('Velez Neumáticos', 110, footerY + 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Su confianza es nuestro mayor compromiso.', 110, footerY + 24);
  doc.text('Estamos aquí para servirle siempre.', 110, footerY + 28);
  
  // Save the PDF
  doc.save(`Comprobante-Saldo-${client.lastName || client.firstName}-${debt.id}.pdf`);
};
