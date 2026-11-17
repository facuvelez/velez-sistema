
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/numberFormatter";

interface Payment {
  id: number;
  debtId: number;
  amount: number;
  paymentMethod: string;
  date: string;
  notes: string;
}

interface MonthlySummaryProps {
  clientId: number;
  payments: Payment[];
}

const MonthlySummary = ({ clientId, payments }: MonthlySummaryProps) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    return paymentDate.getFullYear() === parseInt(selectedYear) &&
           paymentDate.getMonth() + 1 === parseInt(selectedMonth);
  });

  const totalMonthlyPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const paymentsByMethod = filteredPayments.reduce((acc, payment) => {
    acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumen Mensual de Pagos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Año</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Mes</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Total del Mes</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(totalMonthlyPayments)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        {Object.keys(paymentsByMethod).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Desglose por Método de Pago</h4>
            {Object.entries(paymentsByMethod).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{getPaymentMethodLabel(method)}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Payments List */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Pagos del Mes</h4>
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="flex justify-between items-center p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-500 dark:text-white" />
                <div>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-sm text-gray-600">{getPaymentMethodLabel(payment.paymentMethod)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm">{new Date(payment.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {filteredPayments.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay pagos en este período</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlySummary;
