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
}

interface Service {
  id: string;
  type: string;
  date: string;
  vehicle: string;
  notes: string;
  responsiblePerson?: string;
  companyRepresentative?: string;
}

interface Payment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: string;
  date: string;
  notes: string;
}

interface PaymentReceiptData {
  payment: Payment;
  client: Client;
  service: Service;
  totalDebtAmount: number;
  remainingBalance: number;
  signature?: string;
}

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

export const generatePaymentReceiptPDF = async (data: PaymentReceiptData) => {
  const { payment, client, service, totalDebtAmount, remainingBalance, signature } = data;
  const doc = new jsPDF();
  
  // Determine if this is a full or partial payment
  const isFullPayment = remainingBalance <= 0;
  
  // Header with business info
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Velez Neumáticos – Distribuidor Oficial Dunlop', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dr. Nicolás Berrotarán 182, Córdoba, Argentina', 105, 32, { align: 'center' });
  doc.text('Tel: (358) 518-1710 | www.velezneumaticos.com', 105, 37, { align: 'center' });
  
  // Receipt Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = isFullPayment ? 'RECIBO DE PAGO COMPLETO' : 'RECIBO DE PAGO PARCIAL';
  doc.text(title, 105, 55, { align: 'center' });
  
  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);
  
  // Client & Payment Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 25, 75);
  doc.text('DETALLES DEL PAGO', 115, 75);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const clientName = `${client.firstName} ${client.lastName}`;
  doc.text(`Cliente: ${clientName}`, 25, 85);
  doc.text(`Teléfono: ${client.phone}`, 25, 92);
  doc.text(`Ciudad: ${client.city}`, 25, 99);
  
  doc.text(`Fecha: ${new Date(payment.date).toLocaleDateString('es-ES')}`, 115, 85);
  doc.text(`Método: ${formatMultiplePaymentMethods(payment.paymentMethod)}`, 115, 92);
  doc.text(`Recibo No: #${payment.id.substring(0, 8)}`, 115, 99);
  
  // Service Info
  doc.setFont('helvetica', 'bold');
  doc.text('REFERENCIA DEL SERVICIO', 25, 115);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vehículo: ${service.vehicle}`, 25, 125);
  doc.text(`Servicio: ${service.type}`, 25, 132);
  
  // Amount Box
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 145, 170, 40, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, 145, 170, 40, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RESUMEN DE CUENTA', 105, 155, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Monto Total de la Deuda:', 30, 168);
  doc.text(formatCurrency(totalDebtAmount), 180, 168, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(254, 230, 0); // Yellow highlight
  doc.text('PAGO RECIBIDO:', 30, 178);
  doc.text(formatCurrency(payment.amount), 180, 178, { align: 'right' });
  
  // Remaining Balance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const balanceLabel = isFullPayment ? 'SALDO RESTANTE: $0' : `SALDO PENDIENTE: ${formatCurrency(remainingBalance)}`;
  doc.text(balanceLabel, 105, 200, { align: 'center' });
  
  // Signature section
  const signatureY = 220;
  const signatureWidth = 60;
  const signatureHeight = 25;
  
  if (signature) {
    try {
      const blackSignature = await convertSignatureToBlack(signature);
      doc.addImage(blackSignature, 'JPEG', 105 - (signatureWidth / 2), signatureY, signatureWidth, signatureHeight);
      doc.setLineWidth(0.2);
      doc.line(75, signatureY + signatureHeight + 2, 135, signatureY + signatureHeight + 2);
      doc.setFontSize(9);
      doc.text('Firma del Cliente', 105, signatureY + signatureHeight + 7, { align: 'center' });
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
    }
  } else {
    doc.setLineWidth(0.2);
    doc.line(75, signatureY + signatureHeight + 2, 135, signatureY + signatureHeight + 2);
    doc.setFontSize(9);
    doc.text('Firma del Cliente', 105, signatureY + signatureHeight + 7, { align: 'center' });
  }
  
  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gracias por confiar en Velez Neumáticos.', 105, signatureY + signatureHeight + 35, { align: 'center' });
  
  // Save the PDF
  const receiptType = isFullPayment ? 'Completo' : 'Parcial';
  doc.save(`Recibo-Pago-${receiptType}-${payment.id}-${client.lastName || client.firstName}.pdf`);
};
