
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, DollarSign, Plus, Receipt, CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/utils/numberFormatter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ChequeForm from "./ChequeForm";
import { useCheques } from "@/hooks/useCheques";
import { handleNameInput } from "@/utils/textFormatters";

import { Payment } from '@/types/shared';

interface PaymentTrackerProps {
  debtId: string;
  totalAmount: number;
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => Promise<any> | void;
  onDownloadPaymentReceipt?: (payment: Payment) => void;
  clientId?: string;
  serviceId?: string;
}

const PaymentTracker = ({ debtId, totalAmount, payments, onAddPayment, onDownloadPaymentReceipt, clientId, serviceId }: PaymentTrackerProps) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showChequeForm, setShowChequeForm] = useState(false);
  const { createCheque } = useCheques();
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Cheque data state
  const [chequeData, setChequeData] = useState({
    bankName: '',
    chequeNumber: '',
    holderName: '',
    issuanceDate: '',
    paymentDate: '',
    cbuNumber: '',
    status: 'En cartera',
    notes: '',
    imageFile: null as File | null
  });

  const formatNumberWithDots = (value: string) => {
    // Remove all non-numeric characters except dots
    const numbers = value.replace(/[^\d]/g, '');
    
    // Add dots for thousands
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberWithDots(rawValue);
    setNewPayment({ ...newPayment, amount: formattedValue });
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setNewPayment({ ...newPayment, date: date.toISOString().split('T')[0] });
    }
  };

  const handleAddPayment = async () => {
    if (newPayment.amount && newPayment.paymentMethod) {
      // Convert formatted amount back to number
      const numericAmount = parseFloat(newPayment.amount.replace(/\./g, ''));
      
      // Validate that payment amount doesn't exceed remaining balance (except for cheques)
      if (newPayment.paymentMethod !== 'Cheque' && numericAmount > remainingBalance) {
        alert(`El monto del pago ($${numericAmount.toLocaleString()}) no puede ser mayor al saldo pendiente (${formatCurrency(remainingBalance)})`);
        return;
      }
      
      // If payment method is cheque, validate cheque fields first
      if (newPayment.paymentMethod === 'Cheque' || newPayment.paymentMethod === 'Echeq') {
        if (!chequeData.bankName.trim()) {
          alert("El nombre del banco es obligatorio para cheques");
          return;
        }
        if (!chequeData.chequeNumber.trim()) {
          alert("El número de cheque es obligatorio");
          return;
        }
        if (!chequeData.holderName.trim()) {
          alert("El emisor del cheque es obligatorio");
          return;
        }
        if (!chequeData.issuanceDate) {
          alert("La fecha de emisión es obligatoria");
          return;
        }
        if (!chequeData.paymentDate) {
          alert("La fecha de pago es obligatoria");
          return;
        }
      }
      
      try {
        // Create the payment
        const paymentResult = await onAddPayment({
          debtId,
          amount: numericAmount,
          paymentMethod: newPayment.paymentMethod,
          date: newPayment.date,
          notes: (newPayment.paymentMethod === 'Cheque' || newPayment.paymentMethod === 'Echeq') 
            ? `Cheque ${chequeData.chequeNumber} - ${chequeData.bankName}` 
            : newPayment.notes
        });

        // If payment method is cheque and we have clientId, create cheque record
        if ((newPayment.paymentMethod === 'Cheque' || newPayment.paymentMethod === 'Echeq') && clientId) {
          try {
            if (!paymentResult?.id) {
              throw new Error('No se pudo obtener el ID del pago para asociar el cheque');
            }
            
            await createCheque({
              client_id: clientId,
              service_id: serviceId || undefined,
              debt_payment_id: paymentResult.id,
              bank_name: chequeData.bankName,
              cheque_number: chequeData.chequeNumber,
              amount: numericAmount,
              issuance_date: chequeData.issuanceDate,
              payment_date: chequeData.paymentDate,
              holder_name: chequeData.holderName,
              cbu_number: chequeData.cbuNumber || undefined,
              status: chequeData.status as 'En cartera' | 'Depositado' | 'Cobrado' | 'Rechazado',
              notes: chequeData.notes || undefined,
              image_url: undefined
            });
          } catch (chequeError) {
            console.error('Error creating cheque:', chequeError);
            // Si falla la creación del cheque, mostrar error claro
            alert('ERROR CRÍTICO: No se pudo guardar la información del cheque. Contacte al administrador del sistema.');
            // El pago ya fue creado pero sin cheque asociado - esto necesita ser revertido manualmente
            throw chequeError;
          }
        }
        
        // Reset form
        setNewPayment({
          amount: '',
          paymentMethod: '',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setChequeData({
          bankName: '',
          chequeNumber: '',
          holderName: '',
          issuanceDate: '',
          paymentDate: '',
          cbuNumber: '',
          status: 'En cartera',
          notes: '',
          imageFile: null
        });
        setSelectedDate(new Date());
        setShowAddPayment(false);
      } catch (error) {
        console.error('Error adding payment:', error);
      }
    }
  };

  const handleChequeSubmit = async (chequeData: any) => {
    try {
      // Create cheque record
      await createCheque(chequeData);
      
      // Also add payment record
      onAddPayment({
        debtId,
        amount: chequeData.amount,
        paymentMethod: 'Cheque',
        date: chequeData.payment_date,
        notes: `Cheque ${chequeData.cheque_number} - ${chequeData.bank_name}`
      });

      setShowChequeForm(false);
      setShowAddPayment(false);
      setNewPayment({
        amount: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setSelectedDate(new Date());
    } catch (error) {
      console.error('Error creating cheque:', error);
    }
  };

  return (
    <>
      <Card className="dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg dark:text-gray-100">Historial de Pagos</CardTitle>
            <Button
              onClick={() => setShowAddPayment(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Pago
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/70 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deuda</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pagado</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Pendiente</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(remainingBalance)}</p>
            </div>
          </div>

          {/* Add Payment Form */}
          {showAddPayment && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Monto</label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={newPayment.amount}
                      onChange={handleAmountChange}
                      className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Método de Pago</label>
                    <Select
                      value={newPayment.paymentMethod}
                      onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="Efectivo" className="dark:text-gray-100 dark:hover:bg-gray-700">Efectivo</SelectItem>
                        <SelectItem value="Transferencia Bancaria" className="dark:text-gray-100 dark:hover:bg-gray-700">Transferencia Bancaria</SelectItem>
                        <SelectItem value="Tarjeta de Crédito" className="dark:text-gray-100 dark:hover:bg-gray-700">Tarjeta de Crédito</SelectItem>
                        <SelectItem value="Tarjeta de Débito" className="dark:text-gray-100 dark:hover:bg-gray-700">Tarjeta de Débito</SelectItem>
                        <SelectItem value="Cheque" className="dark:text-gray-100 dark:hover:bg-gray-700">Cheque</SelectItem>
                        <SelectItem value="Echeq" className="dark:text-gray-100 dark:hover:bg-gray-700">Echeq</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                 </div>
                 
                 {/* Cheque fields - only show when Cheque is selected */}
                 {(newPayment.paymentMethod === 'Cheque' || newPayment.paymentMethod === 'Echeq') && (
                   <div className="space-y-4 p-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                       <label className="text-base font-semibold text-blue-800 dark:text-blue-200">
                         Información del Cheque
                       </label>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Banco *</label>
                         <Input
                           value={chequeData.bankName}
                           onChange={(e) => setChequeData({...chequeData, bankName: e.target.value})}
                           placeholder="Nombre del banco"
                           className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Número de Cheque *</label>
                          <Input
                            value={chequeData.chequeNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                              setChequeData({...chequeData, chequeNumber: value});
                            }}
                            maxLength={8}
                           placeholder="Número del cheque"
                           className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Emisor del Cheque *</label>
                         <Input
                           value={chequeData.holderName}
                           onChange={(e) => {
                             handleNameInput(e.target.value, (formattedValue) => {
                               setChequeData({...chequeData, holderName: formattedValue});
                             });
                           }}
                           placeholder="Nombre del titular"
                           className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">CBU</label>
                         <Input
                           value={chequeData.cbuNumber}
                           onChange={(e) => setChequeData({...chequeData, cbuNumber: e.target.value})}
                           placeholder="CBU (opcional)"
                           className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha de Emisión *</label>
                         <Input
                           type="date"
                           value={chequeData.issuanceDate}
                           onChange={(e) => setChequeData({...chequeData, issuanceDate: e.target.value})}
                           className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha de Pago *</label>
                         <Input
                           type="date"
                           value={chequeData.paymentDate}
                           onChange={(e) => setChequeData({...chequeData, paymentDate: e.target.value})}
                           className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Estado del Cheque</label>
                         <Select 
                           value={chequeData.status} 
                           onValueChange={(value) => setChequeData({...chequeData, status: value})}
                         >
                           <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                             <SelectItem value="En cartera">En cartera</SelectItem>
                             <SelectItem value="Depositado">Depositado</SelectItem>
                             <SelectItem value="Cobrado">Cobrado</SelectItem>
                             <SelectItem value="Rechazado">Rechazado</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Imagen del Cheque</label>
                         <Input
                           type="file"
                           accept="image/*"
                           onChange={(e) => setChequeData({...chequeData, imageFile: e.target.files?.[0] || null})}
                           className="cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                         />
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-medium mb-1 dark:text-gray-300">Notas del Cheque</label>
                       <Input
                         value={chequeData.notes}
                         onChange={(e) => setChequeData({...chequeData, notes: e.target.value})}
                         placeholder="Notas adicionales del cheque"
                         className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                       />
                     </div>
                   </div>
                 )}
                 
                 <div>
                   <label className="block text-sm font-medium mb-1 dark:text-gray-300">Notas (opcional)</label>
                   <Input
                     placeholder="Comentarios adicionales..."
                     value={newPayment.notes}
                     onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                     className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                   />
                 </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddPayment} size="sm">
                    Guardar Pago
                  </Button>
                  <Button 
                    onClick={() => setShowAddPayment(false)} 
                    variant="outline" 
                    size="sm"
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments List */}
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800/70 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <div>
                    <p className="font-medium dark:text-gray-100">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{payment.paymentMethod}</p>
                    {payment.notes && <p className="text-xs text-gray-500 dark:text-gray-500">{payment.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-500 dark:text-white" />
                      <span className="text-sm dark:text-gray-300">{new Date(payment.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {onDownloadPaymentReceipt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadPaymentReceipt(payment)}
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay pagos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cheque Form Modal */}
      {showChequeForm && clientId && (
        <ChequeForm
          clientId={clientId}
          serviceId={serviceId}
          defaultAmount={newPayment.amount ? parseFloat(newPayment.amount.replace(/\./g, '')) : undefined}
          onSave={handleChequeSubmit}
          onCancel={() => setShowChequeForm(false)}
        />
      )}
    </>
  );
};

export default PaymentTracker;
