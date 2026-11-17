import jsPDF from 'jspdf';
import { formatCurrency } from './numberFormatter';
import { format } from 'date-fns';

interface AnalyticsPdfData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedClient?: string;
  totalRevenue: number;
  totalDebts: number;
  averageServiceValue: number;
  monthlySalesData: Array<{ month: string; revenue: number }>;
  serviceFrequencyData: Array<{ service: string; count: number }>;
  paymentStatusData: Array<{ status: string; count: number }>;
  paymentMethodData: Array<{ method: string; count: number }>;
  debtAgingData: Array<{ range: string; amount: number }>;
  chequeStatusData: Array<{ status: string; amount: number }>;
  upcomingChequesData: Array<{ periodo: string; monto: number; count: number }>;
  debtEvolutionData: Array<{ month: string; generadas: number; cobradas: number }>;
}

export const generateAnalyticsPDF = (data: AnalyticsPdfData) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const secondaryColor = [100, 116, 139]; // Gray
  const accentColor = [254, 230, 0]; // Yellow

  // Helper function to check if we need a new page
  const checkNewPage = (neededSpace: number = 30) => {
    if (yPosition + neededSpace > 280) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Estadísticas', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Período: ${format(new Date(data.dateRange.startDate), 'dd/MM/yyyy')} - ${format(new Date(data.dateRange.endDate), 'dd/MM/yyyy')}`,
    pageWidth / 2,
    22,
    { align: 'center' }
  );

  yPosition = 40;

  // Summary Cards
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen General', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    { label: 'Ingresos Totales:', value: formatCurrency(data.totalRevenue) },
    { label: 'Deudas Activas:', value: formatCurrency(data.totalDebts) },
    { label: 'Valor Promedio por Servicio:', value: formatCurrency(data.averageServiceValue) }
  ];

  summaryData.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, margin + 70, yPosition);
    yPosition += 6;
  });

  yPosition += 5;
  checkNewPage();

  // Monthly Sales
  if (data.monthlySalesData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ventas Mensuales', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.monthlySalesData.slice(0, 10).forEach(item => {
      checkNewPage();
      doc.text(item.month, margin, yPosition);
      doc.text(formatCurrency(item.revenue), margin + 60, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  checkNewPage(50);

  // Service Frequency
  if (data.serviceFrequencyData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Servicios Más Solicitados', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.serviceFrequencyData.forEach(item => {
      checkNewPage();
      doc.text(item.service, margin, yPosition);
      doc.text(item.count.toString(), margin + 60, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }


  checkNewPage(50);

  // Payment Status
  if (data.paymentStatusData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado de Pagos', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.paymentStatusData.forEach(item => {
      checkNewPage();
      doc.text(item.status, margin, yPosition);
      doc.text(item.count.toString() + ' servicios', margin + 60, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  checkNewPage(50);

  // Payment Methods
  if (data.paymentMethodData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Métodos de Pago Preferidos', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.paymentMethodData.forEach(item => {
      checkNewPage();
      doc.text(item.method, margin, yPosition);
      doc.text(item.count.toString() + ' usos', margin + 70, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }


  checkNewPage(50);

  // Debt Aging
  if (data.debtAgingData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Antigüedad de Deudas', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.debtAgingData.forEach(item => {
      checkNewPage();
      doc.text(item.range, margin, yPosition);
      doc.text(formatCurrency(item.amount), margin + 50, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  checkNewPage(50);

  // Check Status
  if (data.chequeStatusData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado de Cheques', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.chequeStatusData.forEach(item => {
      checkNewPage();
      doc.text(item.status, margin, yPosition);
      doc.text(formatCurrency(item.amount), margin + 50, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  checkNewPage(50);

  // Upcoming Checks
  if (data.upcomingChequesData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Cheques Próximos a Vencer', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.upcomingChequesData.forEach(item => {
      checkNewPage();
      doc.text(item.periodo, margin, yPosition);
      doc.text(`${item.count} cheques - ${formatCurrency(item.monto)}`, margin + 50, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      pageWidth / 2,
      287,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `estadisticas_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};
