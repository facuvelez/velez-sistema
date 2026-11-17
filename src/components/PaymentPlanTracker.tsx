
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Calendar, DollarSign, CreditCard, Receipt } from "lucide-react";

interface Installment {
  id?: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  paymentMethod?: string;
  paymentDate?: string;
}

interface PaymentPlan {
  id: number;
  clientId: number;
  serviceId: number;
  totalAmount: number;
  type: 'single' | 'installments';
  installments: Installment[];
  comments: string;
  createdAt: string;
  signature?: string;
}

interface PaymentPlanTrackerProps {
  paymentPlan: PaymentPlan;
  onUpdateInstallment: (planId: number, installmentIndex: number, updates: Partial<Installment>) => void;
  onDownloadReceipt: (paymentPlan: PaymentPlan) => void;
}

const PaymentPlanTracker = ({ paymentPlan, onUpdateInstallment, onDownloadReceipt }: PaymentPlanTrackerProps) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<{ index: number; installment: Installment } | null>(null);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: "",
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const paymentMethods = [
    "Efectivo",
    "Tarjeta de Crédito",
    "Tarjeta de Débito",
    "Transferencia Bancaria",
    "Cheque",
    "Echeq"
  ];

  const getTotalPaid = () => {
    return paymentPlan.installments
      .filter(inst => inst.status === 'paid')
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  const getRemainingBalance = () => {
    return paymentPlan.totalAmount - getTotalPaid();
  };

  const getOverdueInstallments = () => {
    const today = new Date();
    return paymentPlan.installments.filter(inst => 
      inst.status === 'pending' && new Date(inst.dueDate) < today
    ).length;
  };

  const handleMarkAsPaid = () => {
    if (selectedInstallment) {
      onUpdateInstallment(paymentPlan.id, selectedInstallment.index, {
        status: 'paid',
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate
      });
      setShowPaymentDialog(false);
      setSelectedInstallment(null);
      setPaymentData({ paymentMethod: "", paymentDate: new Date().toISOString().split('T')[0] });
    }
  };

  const openPaymentDialog = (installment: Installment, index: number) => {
    setSelectedInstallment({ index, installment });
    setShowPaymentDialog(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Plan de Pago</CardTitle>
              <CardDescription>
                {paymentPlan.type === 'single' ? 'Pago único' : `${paymentPlan.installments.length} cuotas`}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownloadReceipt(paymentPlan)}
            >
              <Receipt className="h-4 w-4 mr-1" />
              Comprobante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-xl font-bold text-gray-900">${paymentPlan.totalAmount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagado</p>
              <p className="text-xl font-bold text-green-600">${getTotalPaid()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Saldo Pendiente</p>
              <p className="text-xl font-bold text-red-600">${getRemainingBalance()}</p>
            </div>
          </div>

          {getOverdueInstallments() > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                <strong>Atención:</strong> {getOverdueInstallments()} cuota(s) vencida(s)
              </p>
            </div>
          )}

          {paymentPlan.type === 'installments' && (
            <div className="space-y-3">
              <h4 className="font-semibold">Cronograma de Pagos</h4>
              {paymentPlan.installments.map((installment, index) => {
                const isOverdue = installment.status === 'pending' && new Date(installment.dueDate) < new Date();
                const isDueSoon = installment.status === 'pending' && 
                  new Date(installment.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                return (
                  <div key={index} className={`p-3 border rounded-lg ${
                    isOverdue ? 'border-red-200 bg-red-50' : 
                    isDueSoon ? 'border-yellow-200 bg-yellow-50' : 
                    installment.status === 'paid' ? 'border-green-200 bg-green-50' : ''
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          installment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {installment.status === 'paid' ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Cuota {index + 1}</p>
                          <p className="text-sm text-gray-600">
                            ${installment.amount} - Vence: {new Date(installment.dueDate).toLocaleDateString()}
                          </p>
                          {installment.status === 'paid' && installment.paymentDate && (
                            <p className="text-xs text-green-600">
                              Pagado el {new Date(installment.paymentDate).toLocaleDateString()}
                              {installment.paymentMethod && ` - ${installment.paymentMethod}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {installment.status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-800">Pagado</Badge>
                        ) : (
                          <>
                            {isOverdue && (
                              <Badge className="bg-red-100 text-red-800">Vencida</Badge>
                            )}
                            {isDueSoon && !isOverdue && (
                              <Badge className="bg-yellow-100 text-yellow-800">Próxima</Badge>
                            )}
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(installment, index)}
                            >
                              Marcar como Pagado
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {paymentPlan.comments && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{paymentPlan.comments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInstallment && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p><strong>Cuota:</strong> {selectedInstallment.index + 1}</p>
                <p><strong>Monto:</strong> ${selectedInstallment.installment.amount}</p>
                <p><strong>Vencimiento:</strong> {new Date(selectedInstallment.installment.dueDate).toLocaleDateString()}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="paymentMethod">Método de Pago *</Label>
              <Select onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentDate">Fecha de Pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleMarkAsPaid}
                disabled={!paymentData.paymentMethod}
              >
                Confirmar Pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPlanTracker;
