
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Plus, Minus } from "lucide-react";

interface PaymentPlanFormProps {
  onClose: () => void;
  onSave: (paymentPlan: any) => void;
  clients: any[];
  services: any[];
}

interface Installment {
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  paymentMethod?: string;
}

const PaymentPlanForm = ({ onClose, onSave, clients, services }: PaymentPlanFormProps) => {
  const [formData, setFormData] = useState({
    clientId: "",
    serviceId: "", 
    totalAmount: "",
    paymentType: "single", // single or installments
    numberOfInstallments: 2,
    comments: ""
  });

  const [installments, setInstallments] = useState<Installment[]>([
    { amount: 0, dueDate: "", status: 'pending' },
    { amount: 0, dueDate: "", status: 'pending' }
  ]);

  const paymentMethods = [
    "Efectivo",
    "Tarjeta de Crédito",
    "Tarjeta de Débito",
    "Transferencia Bancaria",
    "Cheque",
    "Echeq"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.clientId && formData.serviceId && formData.totalAmount) {
      const paymentPlan = {
        ...formData,
        clientId: parseInt(formData.clientId),
        serviceId: parseInt(formData.serviceId),
        totalAmount: parseFloat(formData.totalAmount),
        installments: formData.paymentType === 'installments' ? installments : [],
        createdAt: new Date().toISOString(),
        type: formData.paymentType
      };
      onSave(paymentPlan);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePaymentTypeChange = (value: string) => {
    setFormData({
      ...formData,
      paymentType: value
    });
    
    if (value === 'installments') {
      generateInstallments();
    }
  };

  const generateInstallments = () => {
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    const numInstallments = formData.numberOfInstallments;
    const amountPerInstallment = totalAmount / numInstallments;
    
    const newInstallments: Installment[] = [];
    const today = new Date();
    
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + i + 1);
      
      newInstallments.push({
        amount: Math.round(amountPerInstallment * 100) / 100,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending'
      });
    }
    
    setInstallments(newInstallments);
  };

  const handleInstallmentChange = (index: number, field: keyof Installment, value: string | number) => {
    const newInstallments = [...installments];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    setInstallments(newInstallments);
  };

  const addInstallment = () => {
    const newDueDate = new Date();
    newDueDate.setMonth(newDueDate.getMonth() + installments.length + 1);
    
    setInstallments([
      ...installments,
      { amount: 0, dueDate: newDueDate.toISOString().split('T')[0], status: 'pending' }
    ]);
    setFormData({ ...formData, numberOfInstallments: installments.length + 1 });
  };

  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((_, i) => i !== index));
      setFormData({ ...formData, numberOfInstallments: installments.length - 1 });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Crear Plan de Pago</CardTitle>
              <CardDescription>Configurar deuda con pagos únicos o cuotas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Cliente *</Label>
                <Select onValueChange={(value) => handleSelectChange("clientId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.firstName} {client.lastName} {client.type && `(${client.type})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="serviceId">Servicio *</Label>
                <Select onValueChange={(value) => handleSelectChange("serviceId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.type} - {new Date(service.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="totalAmount">Monto Total *</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.totalAmount}
                onChange={handleChange}
                onBlur={formData.paymentType === 'installments' ? generateInstallments : undefined}
                required
              />
            </div>

            <div>
              <Label>Tipo de Pago *</Label>
              <RadioGroup value={formData.paymentType} onValueChange={handlePaymentTypeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Pago único</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="installments" id="installments" />
                  <Label htmlFor="installments">Plan de cuotas</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.paymentType === 'installments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Configuración de Cuotas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addInstallment}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Cuota
                  </Button>
                </div>
                
                {installments.map((installment, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Cuota {index + 1}</span>
                      {installments.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInstallment(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Monto</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={installment.amount}
                          onChange={(e) => handleInstallmentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div>
                        <Label>Fecha de Vencimiento</Label>
                        <Input
                          type="date"
                          value={installment.dueDate}
                          onChange={(e) => handleInstallmentChange(index, 'dueDate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Método de Pago (Opcional)</Label>
                      <Select onValueChange={(value) => handleInstallmentChange(index, 'paymentMethod', value)}>
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
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="comments">Comentarios</Label>
              <Input
                id="comments"
                name="comments"
                placeholder="Observaciones sobre el plan de pago..."
                value={formData.comments}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Crear Plan de Pago
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPlanForm;
