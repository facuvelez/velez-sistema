import jsPDF from 'jspdf';
import { formatCurrency } from './numberFormatter';
import { Client, Service, Payment, ServiceItem } from './invoiceTypes';
import { 
  generateQRCodeDataURL, 
  getPaymentMethodLabel, 
  getStatusLabel, 
  formatMultiplePaymentMethods 
} from './invoiceHelpers';

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
          
          console.log('Invoice signature analysis:', {
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
          console.log('Invoice signature processed, result size:', result.length);
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

export const generateInvoicePDF = async (service: Service, client: Client, payments?: Payment[]) => {
  const doc = new jsPDF();
  
  // Generate QR code for digital version
  const qrCodeURL = generateQRCodeDataURL(`https://velezneumaticos.com/facturas/${service.id}`);
  
  // Professional Header Layout - more compact
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Left-aligned business info with smaller fonts
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Velez Neumáticos – Distribuidor Oficial Dunlop', 20, 12);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Dr. Nicolás Berrotarán 182, Córdoba, Argentina', 20, 18);
  doc.text('Tel: (358) 518-1710 | www.velezneumaticos.com', 20, 23);
  
  // Right-aligned document info and QR code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Factura No: #${service.id}`, 125, 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date(service.date).toLocaleDateString('es-ES')}`, 125, 21);
  
  // Add QR code
  try {
    doc.addImage(qrCodeURL, 'PNG', 160, 18, 15, 15);
  } catch (error) {
    console.error('Error adding QR code:', error);
  }
  
  // Document title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURA DE SERVICIO', 105, 55, { align: 'center' });
  
  // Client information section
  doc.setFillColor(248, 249, 250);
  doc.rect(15, 65, 180, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, 65, 180, 25, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(52, 58, 64);
  doc.text('FACTURAR A:', 20, 73);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const clientName = client.type === 'Empresa' ? client.firstName : `${client.firstName} ${client.lastName}`;
  doc.text(`Cliente: ${clientName}`, 20, 80);
  doc.text(`Teléfono: ${client.phone}`, 20, 85);
  if (client.tax_id) {
    doc.text(`CUIT/CUIL: ${client.tax_id}`, 20, 89);
  }
  doc.text(`Email: ${client.email}`, 110, 80);
  doc.text(`Ciudad: ${client.city}`, 110, 85);
  
  // Service details section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(52, 58, 64);
  doc.text('DETALLES DEL SERVICIO', 20, 105);
  
  // Service info row - Date, Responsible Person, Vehicle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  
  let infoY = 112;
  doc.text(`Fecha: ${new Date(service.date).toLocaleDateString('es-ES')}`, 20, infoY);
  doc.text(`Monto Total: ${formatCurrency(service.amount)}`, 80, infoY);
  doc.text(`Método de Pago: ${formatMultiplePaymentMethods(service.paymentMethod)}`, 140, infoY);
  
  infoY += 5;
  doc.text(`Monto Entregado: ${formatCurrency(service.amount_delivered || 0)}`, 20, infoY);
  if (service.responsiblePerson) {
    doc.text(`Atendido por: ${service.responsiblePerson}`, 80, infoY);
  }
  if (service.vehicle) {
    doc.text(`Vehículo: ${service.vehicle}`, 140, infoY);
  }
  
  // Table header
  const tableStartY = infoY + 10;
  doc.setFillColor(220, 220, 220);
  doc.rect(15, tableStartY, 180, 10, 'F');
  doc.setDrawColor(150, 150, 150);
  doc.rect(15, tableStartY, 180, 10, 'S');
  
  // Table columns
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Producto/Servicio', 20, tableStartY + 7);
  doc.text('Cant.', 90, tableStartY + 7);
  doc.text('Precio Unit.', 115, tableStartY + 7);
  doc.text('Total', 160, tableStartY + 7);
  
  // Use individual service items if available, otherwise parse from type string
  let services: ServiceItem[] = [];
  if (service.serviceItems && service.serviceItems.length > 0) {
    services = service.serviceItems;
  } else {
    // Fallback: parse services from type string and divide amount equally
    const serviceTypes = service.type.split(',').map(s => s.trim());
    const pricePerService = service.amount / serviceTypes.length;
    services = serviceTypes.map(type => ({
      type,
      vehicle: service.vehicle || '',
      price: Math.round(pricePerService),
      quantity: 1,
      unitPrice: Math.round(pricePerService)
    }));
  }
  
  const rowHeight = 14;
  const baseRowY = tableStartY + 10;
  
  // Calculate total height needed for all service rows
  const totalServicesHeight = services.length * rowHeight;
  
  // Draw service rows with individual pricing and vehicle info
  let subtotal = 0;
  services.forEach((serviceItem, index) => {
    const rowY = baseRowY + (index * rowHeight);
    
    // Alternating row colors for better readability
    if (index % 2 === 1) {
      doc.setFillColor(248, 249, 250);
      doc.rect(15, rowY, 180, rowHeight, 'F');
    }
    
    // Draw row border
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, rowY, 180, rowHeight, 'S');
    
    // Add service data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Product/Service description with additional details
    let description = serviceItem.type;
    
    // Add specific details based on service type
    const details = [];
    if (serviceItem.material) details.push(`Material: ${serviceItem.material}`);
    if (serviceItem.rodado) details.push(`Rodado: ${serviceItem.rodado}`);
    if (serviceItem.marca) details.push(`Marca: ${serviceItem.marca}`);
    if (serviceItem.modelo) details.push(`Modelo: ${serviceItem.modelo}`);
    if (serviceItem.medida) details.push(`Medida: ${serviceItem.medida}`);
    if (serviceItem.tipoNeumatico) details.push(`Tipo: ${serviceItem.tipoNeumatico}`);
    if (serviceItem.tipoRepuesto) details.push(`Tipo: ${serviceItem.tipoRepuesto}`);
    
    if (details.length > 0) {
      description += `\n${details.join(', ')}`;
    }
    
    const splitDescription = doc.splitTextToSize(description, 60);
    doc.text(splitDescription[0], 20, rowY + 6);
    
    // Handle multiple lines of description
    for (let i = 1; i < splitDescription.length && i < 3; i++) {
      doc.setFontSize(7);
      doc.text(splitDescription[i], 20, rowY + 6 + (i * 3));
      doc.setFontSize(8);
    }
    
    // Quantity
    doc.text(`${serviceItem.quantity || 1}`, 90, rowY + 8, { align: 'center' });
    
    // Unit Price
    doc.text(`${formatCurrency(serviceItem.unitPrice || serviceItem.price)}`, 115, rowY + 8);
    
    // Total Price
    doc.text(`${formatCurrency(serviceItem.price)}`, 160, rowY + 8);
    
    subtotal += serviceItem.price;
  });
  
  // Subtotal section
  let currentY = baseRowY + totalServicesHeight + 5;
  
  doc.setFillColor(235, 235, 235);
  doc.rect(15, currentY, 180, 10, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, currentY, 180, 10, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Subtotal:', 135, currentY + 7);
  doc.text(`${formatCurrency(subtotal)}`, 160, currentY + 7);
  
  currentY += 15;
  
  // Amount delivered section - calculate from service amount_delivered + payments
  console.log('🔍 DEBUG PDF Generation - Service data:', {
    id: service.id,
    amount_delivered: service.amount_delivered,
    amountDelivered: (service as any).amountDelivered,
    amount: service.amount,
    payments: payments
  });
  
  let amountDelivered = service.amount_delivered || (service as any).amountDelivered || 0;
  
  // If payments are provided, add them to the delivered amount
  if (payments && payments.length > 0) {
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    console.log('🔍 DEBUG PDF Generation - Total payments:', totalPayments);
    amountDelivered += totalPayments;
  }
  
  console.log('🔍 DEBUG PDF Generation - Final amountDelivered:', amountDelivered);
  doc.setFillColor(240, 255, 240);
  doc.rect(15, currentY, 180, 12, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.rect(15, currentY, 180, 12, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text('MONTO ENTREGADO:', 20, currentY + 8);
  doc.text(`${formatCurrency(amountDelivered)}`, 160, currentY + 8);
  
  currentY += 17;
  
  // Pending amount (if any)
  const pendingAmount = service.amount - amountDelivered;
  if (pendingAmount > 0) {
    doc.setFillColor(255, 248, 240);
    doc.rect(15, currentY, 180, 10, 'F');
    doc.setDrawColor(255, 193, 7);
    doc.rect(15, currentY, 180, 10, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(184, 92, 0);
    doc.text('Monto Pendiente:', 20, currentY + 7);
    doc.text(`${formatCurrency(pendingAmount)}`, 160, currentY + 7);
    
    currentY += 15;
  }
  
  // Notes section (if any)
  if (service.notes) {
    const splitNotes = doc.splitTextToSize(service.notes, 170);
    const notesHeight = Math.max(14, splitNotes.length * 3 + 6);
    
    doc.setFillColor(248, 249, 250);
    doc.rect(15, currentY, 180, notesHeight, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, currentY, 180, notesHeight, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(52, 58, 64);
    doc.text('Notas:', 20, currentY + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.text(splitNotes, 20, currentY + 12);
    
    currentY += notesHeight + 6;
  }
  
  // Total section
  currentY += 8;
  doc.setFillColor(255, 248, 240);
  doc.rect(15, currentY, 180, 18, 'F');
  doc.setDrawColor(255, 193, 7);
  doc.rect(15, currentY, 180, 18, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', 135, currentY + 11);
  doc.text(`${formatCurrency(service.amount)}`, 160, currentY + 11);
  
  // Payment history section (if payments provided)
  if (payments && payments.length > 0) {
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(52, 58, 64);
    doc.text('HISTORIAL DE PAGOS', 20, currentY);
    currentY += 5;
    
    // Payment table header
    doc.setFillColor(220, 220, 220);
    doc.rect(15, currentY, 180, 8, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 180, 8, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Fecha', 20, currentY + 5);
    doc.text('Método', 65, currentY + 5);
    doc.text('Monto', 120, currentY + 5);
    doc.text('Notas', 155, currentY + 5);
    currentY += 8;
    
    // Payment rows
    payments.forEach((payment, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(15, currentY, 180, 8, 'F');
      }
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, currentY, 180, 8, 'S');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(new Date(payment.date).toLocaleDateString('es-ES'), 20, currentY + 5);
      doc.text(getPaymentMethodLabel(payment.paymentMethod), 65, currentY + 5);
      doc.text(formatCurrency(payment.amount), 120, currentY + 5);
      doc.text(payment.notes || '', 155, currentY + 5);
      currentY += 8;
    });
    currentY += 5;
  }

  // Signature will be added in footer

  // Additional service information
  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Estado: ${getStatusLabel(service.status)}`, 20, currentY);
  if (service.companyRepresentative) {
    doc.text(`Representante: ${service.companyRepresentative}`, 20, currentY + 4);
    currentY += 4;
  }
  
  // Professional footer with signature - ensure it fits in A4
  const maxY = 280; // A4 height limit with margins
  let footerY = Math.min(currentY + 15, maxY);
  
  // Add signature in footer if exists
  if (service.signature) {
    const signatureHeight = 20;
    footerY = Math.min(footerY, maxY - signatureHeight - 15);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(52, 58, 64);
    doc.text('FIRMA DEL CLIENTE:', 20, footerY);
    
    try {
      // Convert signature to black on white - returns JPEG
      const blackSignature = await convertSignatureToBlack(service.signature);
      // Use JPEG format which has no transparency issues
      doc.addImage(blackSignature, 'JPEG', 20, footerY + 2, 60, signatureHeight);
    } catch (error) {
      console.error('Error adding signature:', error);
    }
    
    footerY += signatureHeight + 8;
  }
  
  // Footer message
  doc.setFillColor(240, 240, 240);
  doc.rect(0, footerY, 210, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(52, 58, 64);
  doc.text('¡Gracias por confiar en Velez Neumáticos!', 105, footerY + 5, { align: 'center' });
  
  // Save the PDF
  const clientLastName = client.type === 'Empresa' ? client.firstName : client.lastName;
  doc.save(`Factura-${service.id}-${clientLastName}.pdf`);
};
