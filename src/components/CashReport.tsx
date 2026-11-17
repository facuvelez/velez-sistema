
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar as CalendarIcon, DollarSign, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { formatCurrency } from "@/utils/numberFormatter";

import { Payment } from '@/types/shared';

interface CashReportProps {
  payments: (Payment & { clientName?: string })[];
}

const CashReport = ({ payments }: CashReportProps) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const start = startDate;
    const end = endDate;
    
    const isInDateRange = paymentDate >= start && paymentDate <= end;
    const isMethodMatch = paymentMethodFilter === 'all' || payment.paymentMethod === paymentMethodFilter;
    
    return isInDateRange && isMethodMatch;
  });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const paymentsByMethod = filteredPayments.reduce((acc, payment) => {
    acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentsByDate = filteredPayments.reduce((acc, payment) => {
    const date = payment.date;
    acc[date] = (acc[date] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      card: 'Tarjeta',
      check: 'Cheque'
    };
    return labels[method] || method;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE INGRESOS', 105, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, 40);
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Ingresos: ${formatCurrency(totalAmount)}`, 20, 55);
    
    // Payment methods breakdown
    doc.setFont('helvetica', 'bold');
    doc.text('Desglose por Método de Pago:', 20, 75);
    
    let yPos = 85;
    doc.setFont('helvetica', 'normal');
    Object.entries(paymentsByMethod).forEach(([method, amount]) => {
      doc.text(`${getPaymentMethodLabel(method)}: ${formatCurrency(amount)}`, 25, yPos);
      yPos += 10;
    });
    
    // Daily breakdown
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Ingresos por Día:', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    Object.entries(paymentsByDate).forEach(([date, amount]) => {
      doc.text(`${new Date(date).toLocaleDateString()}: ${formatCurrency(amount)}`, 25, yPos);
      yPos += 10;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    doc.save(`Reporte-Ingresos-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}.pdf`);
  };

  const exportToExcel = () => {
    const worksheetData = [
      ['Reporte de Ingresos'],
      [`Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
      [''],
      ['Fecha', 'Cliente', 'Método de Pago', 'Monto', 'Notas'],
      ...filteredPayments.map(payment => [
        new Date(payment.date).toLocaleDateString(),
        payment.clientName || 'N/A',
        getPaymentMethodLabel(payment.paymentMethod),
        payment.amount,
        payment.notes || ''
      ]),
      [''],
      ['Total:', '', '', totalAmount, '']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Ingresos');
    
    XLSX.writeFile(workbook, `Reporte-Ingresos-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-800/90 dark:border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-xl dark:text-gray-100">Reporte de Ingresos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Fecha Inicio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? (
                      format(startDate, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50 dark:text-white" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Fecha Fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? (
                      format(endDate, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50 dark:text-white" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Método de Pago</label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-white" />
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Transacciones</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{filteredPayments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Promedio por Transacción</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {formatCurrency(filteredPayments.length > 0 ? (totalAmount / filteredPayments.length) : 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          {Object.keys(paymentsByMethod).length > 0 && (
            <Card className="dark:bg-gray-800/50 dark:border-gray-600/50">
              <CardHeader>
                <CardTitle className="text-lg dark:text-gray-100">Desglose por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(paymentsByMethod).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium dark:text-gray-200">{getPaymentMethodLabel(method)}</span>
                      <span className="text-lg font-bold dark:text-gray-100">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Breakdown */}
          {Object.keys(paymentsByDate).length > 0 && (
            <Card className="dark:bg-gray-800/50 dark:border-gray-600/50">
              <CardHeader>
                <CardTitle className="text-lg dark:text-gray-100">Ingresos por Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(paymentsByDate)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, amount]) => (
                    <div key={date} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium dark:text-gray-200">{new Date(date).toLocaleDateString()}</span>
                      <span className="text-lg font-bold dark:text-gray-100">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashReport;
