import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, Minus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SignatureCapture, { SignatureCaptureRef } from "./SignatureCapture";
import { useForm, Controller } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/utils/numberFormatter";
import { FormattedInput } from "@/components/ui/formatted-input";
import { handleNameInput } from "@/utils/textFormatters";

interface ServiceItem {
  type: string;
  vehicle: string;
  price: number | string;
  unitPrice?: number | string;
  quantity?: number;
  marca?: string;
  modelo?: string;
  medida?: string;
  descripcion?: string;
}

interface Service {
  id: number;
  clientId: number;
  date: string;
  type: string;
  vehicle: string;
  notes: string;
  amount: number;
  totalAmount?: number;
  paymentMethod: string;
  secondaryPaymentMethod?: string;
  status: string;
  representative?: string;
  attendedBy?: string;
  amountPaid?: number;
  companyRepresentative?: string;
  responsiblePerson?: string;
  service_items?: any[];
  category?: string;
}

interface FormData {
  clientId: string;
  date: Date;
  notes: string;
  amount: string;
  amountDelivered: string;
  paymentMethod: string;
  secondaryPaymentMethod: string;
  status: string;
  responsiblePerson: string;
  companyRepresentativeFirstName: string;
  companyRepresentativeLastName: string;
}

interface EditServiceFormProps {
  service: Service;
  onClose: () => void;
  onSave: (service: Service & { signature?: string; chequeData?: any; serviceItems?: ServiceItem[] }) => void;
  clientType?: string;
}

const EditServiceForm = ({ service, onClose, onSave, clientType = "Persona" }: EditServiceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    defaultValues: {
      clientId: service.clientId.toString(),
      date: new Date(service.date),
      notes: service.notes || "",
      amount: (service.amount || service.totalAmount || 0).toString(),
      amountDelivered: "0", // This could be calculated from payments
      paymentMethod: service.paymentMethod || "",
      secondaryPaymentMethod: service.secondaryPaymentMethod || "",
      status: service.status || "pending",
      responsiblePerson: service.responsiblePerson || service.attendedBy || "",
      companyRepresentativeFirstName: service.companyRepresentative?.split(' ')[0] || "",
      companyRepresentativeLastName: service.companyRepresentative?.split(' ').slice(1).join(' ') || ""
    }
  });

  // Parse service items from service.service_items or create default ones
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>(() => {
    // Always prioritize service_items if it exists and is not empty
    if (service.service_items && 
        Array.isArray(service.service_items) && 
        service.service_items.length > 0) {
      const mappedItems = service.service_items.map(item => {
        console.log('🔍 DEBUG - Item from database:', JSON.stringify(item, null, 2));
        
        // Usar directamente la cantidad del item sin modificaciones
        let finalQuantity = item.quantity;
        
        // Solo convertir si viene como string
        if (typeof finalQuantity === 'string') {
          finalQuantity = parseInt(finalQuantity, 10);
        }
        
        // Si no hay cantidad definida, usar 1
        if (finalQuantity === undefined || finalQuantity === null || isNaN(finalQuantity)) {
          finalQuantity = 1;
        }
        
        console.log('🔍 DEBUG - Final quantity for', item.type, ':', finalQuantity);
        console.log('🔍 DEBUG - Unit price from DB:', item.unitPrice);
        console.log('🔍 DEBUG - Total price from DB:', item.price);
        
        return {
          type: item.type || '',
          vehicle: item.vehicle || '',
          quantity: finalQuantity,
          price: item.price || 0,
          unitPrice: item.unitPrice || 0, // Usar directamente unitPrice de la BD
          marca: item.marca || '',
          modelo: item.modelo || '',
          medida: item.medida || '',
          descripcion: item.descripcion || ''
        };
      });
      
      return mappedItems;
    } else {
      // Only for truly legacy services without service_items, try to extract from text
      const serviceType = service.type || '';
      const notes = service.notes || '';
      const totalAmount = service.amount || service.totalAmount || 0;
      
      // Look for quantity patterns only as a last resort
      const quantityMatch = (serviceType + ' ' + notes).match(/(?:cantidad|cant|qty)[\s:]*(\d+)|(\d+)\s*(?:unidades?|u|piezas?|pcs?|neumáticos?|llantas?)|(?:colocar|desarme|arme|sacar|rotación|vulcanizado)\s+(\d+)/i);
      const originalQuantity = quantityMatch ? parseInt(quantityMatch[1] || quantityMatch[2] || quantityMatch[3]) : 1;
      const unitPrice = originalQuantity > 1 ? totalAmount / originalQuantity : totalAmount;
      
      return [{
        type: serviceType,
        vehicle: service.vehicle || '',
        quantity: originalQuantity,
        price: totalAmount,
        unitPrice: unitPrice,
        marca: '',
        modelo: '',
        medida: '',
        descripcion: ''
      }];
    }
  });

  const [showSecondaryPayment, setShowSecondaryPayment] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<SignatureCaptureRef>(null);
  const [signature, setSignature] = useState<string>('');
  const [chequeData, setChequeData] = useState({
    bankName: '',
    chequeNumber: '',
    holderName: '',
    issuanceDate: '',
    paymentDate: '',
    cbuNumber: '',
    status: 'En cartera',
    imageFile: null as File | null
  });
  const [secondaryChequeData, setSecondaryChequeData] = useState({
    bankName: '',
    chequeNumber: '',
    holderName: '',
    issuanceDate: '',
    paymentDate: '',
    cbuNumber: '',
    status: 'En cartera',
    imageFile: null as File | null
  });

  const formData = form.watch();

  // Calculate total amount from individual service prices
  useEffect(() => {
    const total = serviceItems.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
      return sum + price;
    }, 0);
    form.setValue('amount', total.toString());
  }, [serviceItems, form]);

  // Calculate payment status automatically
  useEffect(() => {
    const totalAmount = parseFloat(formData.amount) || 0;
    const deliveredAmount = parseFloat(formData.amountDelivered) || 0;
    
    let status = "pending";
    if (deliveredAmount === 0) {
      status = "pending";
    } else if (deliveredAmount > 0 && deliveredAmount < totalAmount) {
      status = "partial";
    } else if (deliveredAmount >= totalAmount) {
      status = "paid";
    }

    form.setValue('status', status);
  }, [formData.amount, formData.amountDelivered, form]);

  // Check if signature is required when amounts change
  useEffect(() => {
    const totalAmount = parseFloat(formData.amount) || 0;
    const deliveredAmount = parseFloat(formData.amountDelivered) || 0;
    const hasPendingBalance = deliveredAmount < totalAmount && totalAmount > 0;
    
    setShowSignature(hasPendingBalance);
    
    // Clear signature if no longer needed
    if (!hasPendingBalance) {
      setSignature('');
      signatureRef.current?.clear();
    }
  }, [formData.amount, formData.amountDelivered]);

  const handleSignatureChange = (signatureData: string) => {
    setSignature(signatureData);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Pagado";
      case "partial": return "Parcial";
      case "pending": return "Pendiente";
      default: return "Pendiente";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "partial": return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "pending": return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      default: return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
    }
  };

  const serviceTypes = [
    { name: "Alineado", hasQuantity: false },
    { name: "Arme", hasQuantity: true },
    { name: "Balanceo", hasQuantity: false },
    { name: "Colocar", hasQuantity: true },
    { name: "Desarme", hasQuantity: true },
    { name: "Reparación de cámara", hasQuantity: true },
    { name: "Reparación de llanta", hasQuantity: true },
    { name: "Reparación de neumático", hasQuantity: true },
    { name: "Rotación", hasQuantity: true },
    { name: "Sacar", hasQuantity: true },
    { name: "Vulcanizado", hasQuantity: true }
  ];

  const paymentMethods = [
    "Efectivo",
    "Tarjeta de Crédito",
    "Tarjeta de Débito",
    "Transferencia Bancaria",
    "Cheque",
    "Echeq"
  ];

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Validate amounts
    const totalAmount = parseFloat(data.amount) || 0;
    const deliveredAmount = parseFloat(data.amountDelivered) || 0;
    
    // Check if signature is required for pending balance
    const hasPendingBalance = deliveredAmount < totalAmount && totalAmount > 0;
    if (hasPendingBalance && !signature) {
      alert("La firma es obligatoria cuando queda un saldo pendiente");
      setIsSubmitting(false);
      return;
    }

    // Validate cheque fields if payment method is cheque or echeq
    if (data.paymentMethod === 'Cheque' || data.paymentMethod === 'Echeq') {
      if (!chequeData.bankName) {
        alert("El nombre del banco es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.chequeNumber) {
        alert("El número de cheque es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.holderName) {
        alert("El nombre del titular es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.issuanceDate) {
        alert("La fecha de emisión del cheque es obligatoria");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.paymentDate) {
        alert("La fecha de pago del cheque es obligatoria");
        setIsSubmitting(false);
        return;
      }
    }

    // Validate secondary cheque data if secondary payment method is cheque or echeq
    if (data.secondaryPaymentMethod === 'Cheque' || data.secondaryPaymentMethod === 'Echeq') {
      if (!secondaryChequeData.bankName) {
        alert("El nombre del banco del cheque secundario es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!secondaryChequeData.chequeNumber) {
        alert("El número del cheque secundario es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!secondaryChequeData.holderName) {
        alert("El nombre del emisor del cheque secundario es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!secondaryChequeData.issuanceDate) {
        alert("La fecha de emisión del cheque secundario es obligatoria");
        setIsSubmitting(false);
        return;
      }
      if (!secondaryChequeData.paymentDate) {
        alert("La fecha de pago del cheque secundario es obligatoria");
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      if (data.clientId && serviceItems.some(item => item.type) && totalAmount > 0) {
        const serviceType = serviceItems.map(item => item.type).filter(Boolean).join(", ");
        const combinedNotes = data.notes;
        
        // Create a consolidated vehicle string from all unique vehicles
        const uniqueVehicles = [...new Set(serviceItems.map(item => item.vehicle).filter(Boolean))];
        const vehicleInfo = uniqueVehicles.join(", ");
        
        const updatedService = {
          ...service,
          date: format(data.date, 'yyyy-MM-dd'),
          type: serviceType,
          vehicle: vehicleInfo,
          notes: combinedNotes,
          clientId: parseInt(data.clientId),
          amount: totalAmount,
          totalAmount: totalAmount,
          amountDelivered: deliveredAmount,
          paymentMethod: data.paymentMethod,
          secondaryPaymentMethod: data.secondaryPaymentMethod || null,
          status: data.status,
          companyRepresentative: clientType === "Empresa" 
            ? `${data.companyRepresentativeFirstName} ${data.companyRepresentativeLastName}` 
            : undefined,
          responsiblePerson: data.responsiblePerson,
          serviceItems: serviceItems.filter(item => {
            const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
            return item.type && price > 0;
          }),
      signature: hasPendingBalance ? signature : undefined,
      chequeData: (data.paymentMethod === 'Cheque' || data.paymentMethod === 'Echeq') ? chequeData : undefined,
      secondaryChequeData: (data.secondaryPaymentMethod === 'Cheque' || data.secondaryPaymentMethod === 'Echeq') ? secondaryChequeData : undefined
        };
        
        onSave(updatedService);
      }
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceItemChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    const newServiceItems = [...serviceItems];
    newServiceItems[index] = { ...newServiceItems[index], [field]: value };
    setServiceItems(newServiceItems);
  };

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { type: "", vehicle: "", price: "", unitPrice: "", quantity: 1 }]);
  };

  const removeServiceItem = (index: number) => {
    if (serviceItems.length > 1) {
      setServiceItems(serviceItems.filter((_, i) => i !== index));
    }
  };

  const isCompanyClient = clientType === "Empresa";

  // Calculate subtotal for display
  const subtotal = serviceItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
    return sum + price;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Completar Servicio</CardTitle>
              <CardDescription>Finalizar información del servicio pendiente</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Información del servicio completada (solo lectura) */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">INFORMACIÓN YA REGISTRADA</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Persona Responsable</Label>
                    <p className="font-medium">{service?.responsiblePerson || 'No especificada'}</p>
                  </div>
                  
                  {isCompanyClient && service?.companyRepresentative && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Representante de la Empresa</Label>
                      <p className="font-medium">{service.companyRepresentative}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Tipo de Servicio</Label>
                  <p className="font-medium">{service?.type}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Información del Vehículo</Label>
                  <p className="font-medium">{service?.vehicle || 'No especificada'}</p>
                </div>

                {service?.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Notas</Label>
                    <p className="font-medium">{service.notes}</p>
                  </div>
                )}

                 {/* Servicios realizados */}
                <div>
                  <Label className="text-xs text-muted-foreground">Servicios Realizados</Label>
                  <div className="space-y-2 mt-2">
                     {serviceItems.map((item, index) => {
                       const quantity = item.quantity || 1;
                       const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
                       const totalPrice = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
                       
                       return (
                        <div key={index} className="bg-background p-3 rounded border space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item.type} - {item.vehicle}</span>
                            <span className="text-xs text-muted-foreground">Cantidad: {quantity}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Precio Unitario</Label>
                              <FormattedInput
                                formatNumbers={true}
                                value={unitPrice.toString()}
                                onChange={(value) => {
                                  const newUnitPrice = value; // value ya es un número del FormattedInput
                                  const newTotalPrice = newUnitPrice * quantity;
                                  const newServiceItems = [...serviceItems];
                                  newServiceItems[index] = {
                                    ...newServiceItems[index],
                                    unitPrice: newUnitPrice,
                                    price: newTotalPrice
                                  };
                                  setServiceItems(newServiceItems);
                                }}
                                placeholder="0"
                                className="w-full text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs text-muted-foreground">Precio Total</Label>
                              <Input
                                type="text"
                                value={formatCurrency(totalPrice)}
                                readOnly
                                className="w-full text-sm bg-muted/50"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-right pt-2 border-t">
                      <span className="text-lg font-bold">Total: {formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos a completar */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">INFORMACIÓN A COMPLETAR</h3>

                <FormField
                  control={form.control}
                  name="date"
                  rules={{ required: "Este campo es obligatorio" }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha del servicio *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            readOnly
                            className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Calculado automáticamente</span>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amountDelivered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Entregado</FormLabel>
                        <FormControl>
                          <FormattedInput
                            formatNumbers={true}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Automatically calculated payment status - read-only display */}
                {(formData.amount || formData.amountDelivered) && (
                  <div>
                    <Label>Estado de Pago</Label>
                    <div className={`w-full px-3 py-2 border rounded-md text-sm font-medium ${getStatusColor(formData.status)}`}>
                      {getStatusLabel(formData.status)}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    rules={{ required: "Este campo es obligatorio" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="showSecondaryPayment"
                        checked={showSecondaryPayment}
                        onChange={(e) => setShowSecondaryPayment(e.target.checked)}
                      />
                      <Label htmlFor="showSecondaryPayment" className="text-sm">
                        Pago dividido en dos métodos
                      </Label>
                    </div>
                    {showSecondaryPayment && (
                      <FormField
                        control={form.control}
                        name="secondaryPaymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Pago Secundario</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar método secundario" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paymentMethods.map((method) => (
                                  <SelectItem key={method} value={method}>
                                    {method}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Signature section */}
                {showSignature && (
                  <div className="space-y-2">
                    <Label>Firma del cliente (obligatoria para saldo pendiente)</Label>
                    <SignatureCapture
                      ref={signatureRef}
                      onSignatureChange={handleSignatureChange}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalles adicionales del servicio..."
                          className="resize-none"
                          {...field}
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditServiceForm;
