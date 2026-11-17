import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, Check, ChevronsUpDown, Plus, Minus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import SignatureCapture, { SignatureCaptureRef } from "./SignatureCapture";
import { useForm, Controller } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/utils/numberFormatter";
import { FormattedInput } from "@/components/ui/formatted-input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { handleNameInput } from "@/utils/textFormatters";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  type?: string;
}

interface SaleItem {
  type: string;
  vehicle: string;
  price: number | string;
  quantity: number;
  unitPrice: number | string;
  // Campos específicos por tipo
  tipoNeumatico?: string; // Nuevo campo para tipo de neumático
  marca?: string;       // Para neumáticos y repuestos
  modelo?: string;      // Para neumáticos
  medida?: string;      // Para neumáticos
  material?: string;    // Para llantas
  rodado?: string;      // Para llantas
  tipoRepuesto?: string; // Para repuestos
  marcaRepuesto?: string; // Para repuestos
}

interface SaleFormProps {
  clients: Client[];
  onClose: () => void;
  onSave: (sale: any) => void;
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

const SaleForm = ({ clients, onClose, onSave }: SaleFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormData>({
    defaultValues: {
      clientId: "",
      date: new Date(),
      notes: "",
      amount: "",
      amountDelivered: "",
      paymentMethod: "",
      secondaryPaymentMethod: "",
      status: "pending",
      responsiblePerson: "",
      companyRepresentativeFirstName: "",
      companyRepresentativeLastName: ""
    }
  });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { type: "", vehicle: "", price: "", quantity: 1, unitPrice: "" }
  ]);

  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showSecondaryPayment, setShowSecondaryPayment] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<SignatureCaptureRef>(null);
  const [signature, setSignature] = useState<string>('');
  
  // Cheque data states
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
  const [secondaryChequeData, setSecondaryChequeData] = useState({
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

  const formData = form.watch();

  // Calculate total amount from individual sale prices
  useEffect(() => {
    const total = saleItems.reduce((sum, item) => {
      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
      const quantity = item.quantity || 1;
      return sum + (unitPrice * quantity);
    }, 0);
    form.setValue('amount', total.toString());
    
    // Update individual item prices
    const updatedItems = saleItems.map(item => {
      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
      const quantity = item.quantity || 1;
      return { ...item, price: unitPrice * quantity };
    });
    setSaleItems(updatedItems);
  }, [saleItems, form]);

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

  const productTypes = [
    "Neumáticos",
    "Llantas",
    "Repuestos"
  ];

  const neumaticosTypes = [
    "Agrícola",
    "Auto",
    "Camión",
    "Camioneta", 
    "Industrial",
    "Moto",
    "Vial"
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
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    
    // Validate client selection first
    if (!data.clientId || !selectedClient) {
      alert("Debe seleccionar un cliente antes de guardar la venta");
      setIsSubmitting(false);
      return;
    }
    
    // Validate amounts
    const totalAmount = parseFloat(data.amount) || 0;
    const deliveredAmount = parseFloat(data.amountDelivered) || 0;
    
    if (deliveredAmount > totalAmount) {
      alert("El monto entregado no puede ser mayor al monto total");
      return;
    }

    // Check if signature is required for pending balance
    const hasPendingBalance = deliveredAmount < totalAmount && totalAmount > 0;
    if (hasPendingBalance && (!signature || signatureRef.current?.isEmpty())) {
      alert("Se requiere la firma del cliente para reconocer el saldo pendiente");
      return;
    }

    // Additional validation for company clients
    if (selectedClient?.type === "Empresa") {
      if (!data.companyRepresentativeFirstName.trim()) {
        form.setError('companyRepresentativeFirstName', {
          type: 'manual',
          message: 'Este campo es obligatorio'
        });
        return;
      }
      if (!data.companyRepresentativeLastName.trim()) {
        form.setError('companyRepresentativeLastName', {
          type: 'manual',
          message: 'Este campo es obligatorio'
        });
        return;
      }
    }

    // Validate responsiblePerson for all clients (now mandatory)
    if (!data.responsiblePerson.trim()) {
      form.setError('responsiblePerson', {
        type: 'manual',
        message: 'Este campo es obligatorio'
      });
      return;
    }

    // Validate required fields for all clients
    if (!data.paymentMethod) {
      form.setError('paymentMethod', {
        type: 'manual',
        message: 'Este campo es obligatorio'
      });
      return;
    }

    // Validate cheque fields if payment method is cheque or echeq
    if (data.paymentMethod === 'Cheque' || data.paymentMethod === 'Echeq') {
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

    // Validate secondary cheque fields if secondary payment method is cheque or echeq
    if (data.secondaryPaymentMethod === 'Cheque' || data.secondaryPaymentMethod === 'Echeq') {
      if (!secondaryChequeData.bankName.trim()) {
        alert("El nombre del banco es obligatorio para el cheque secundario");
        return;
      }
      if (!secondaryChequeData.chequeNumber.trim()) {
        alert("El número de cheque secundario es obligatorio");
        return;
      }
      if (!secondaryChequeData.holderName.trim()) {
        alert("El emisor del cheque secundario es obligatorio");
        return;
      }
      if (!secondaryChequeData.issuanceDate) {
        alert("La fecha de emisión del cheque secundario es obligatoria");
        return;
      }
      if (!secondaryChequeData.paymentDate) {
        alert("La fecha de pago del cheque secundario es obligatoria");
        return;
      }
    }

    // Validate sale items
    for (let i = 0; i < saleItems.length; i++) {
      const item = saleItems[i];
      if (item.type && !item.vehicle.trim()) {
        alert(`El campo "Vehículo Asociado" es obligatorio para el producto ${i + 1}`);
        return;
      }
    }
    
    if (data.clientId && saleItems.some(item => item.type) && totalAmount > 0) {
      const saleType = saleItems.map(item => item.type).filter(Boolean).join(", ");
      const combinedNotes = data.notes;
      
      // Create a consolidated vehicle string from all unique vehicles
      const uniqueVehicles = [...new Set(saleItems.map(item => item.vehicle).filter(Boolean))];
      const vehicleInfo = uniqueVehicles.join(", ");
      
      onSave({
        ...data,
        type: saleType,
        vehicle: vehicleInfo, // For backward compatibility
        notes: combinedNotes,
        clientId: data.clientId, // Keep as UUID string
        amount: totalAmount,
        amountDelivered: deliveredAmount,
        // Fix: Only include secondary payment method if it's actually selected
        secondaryPaymentMethod: data.secondaryPaymentMethod || null,
        // Combine first and last name for company representative
        companyRepresentative: selectedClient?.type === "Empresa" 
          ? `${data.companyRepresentativeFirstName} ${data.companyRepresentativeLastName}` 
          : undefined,
        serviceItems: saleItems.filter(item => {
          const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
          return item.type && price > 0;
        }),
        signature: hasPendingBalance ? signature : undefined,
        // Include cheque data if payment method is cheque or echeq
        chequeData: (data.paymentMethod === 'Cheque' || data.paymentMethod === 'Echeq') ? chequeData : undefined,
        secondaryChequeData: (data.secondaryPaymentMethod === 'Cheque' || data.secondaryPaymentMethod === 'Echeq') ? secondaryChequeData : undefined
      });
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    form.setValue('clientId', client.id.toString());
    setOpen(false);
  };

  const handleSaleItemChange = (index: number, field: keyof SaleItem, value: string | number) => {
    const newSaleItems = [...saleItems];
    newSaleItems[index] = { ...newSaleItems[index], [field]: value };
    setSaleItems(newSaleItems);
  };

  const addSaleItem = () => {
    setSaleItems([...saleItems, { type: "", vehicle: "", price: "", quantity: 1, unitPrice: "" }]);
  };

  const removeSaleItem = (index: number) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const isCompanyClient = selectedClient?.type === "Empresa";

  // Calculate subtotal for display
  const subtotal = saleItems.reduce((sum, item) => {
    const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
    const quantity = item.quantity || 1;
    return sum + (unitPrice * quantity);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Agregar Nueva Venta</CardTitle>
              <CardDescription>Registrar una venta de productos</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="clientId">Cliente *</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedClient
                        ? `${selectedClient.firstName} ${selectedClient.lastName} ${selectedClient.type ? `(${selectedClient.type})` : ''}`
                        : "Seleccionar un cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." autoComplete="off" />
                      <CommandList>
                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={`${client.firstName} ${client.lastName}`}
                              onSelect={() => handleClientSelect(client)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.firstName} {client.lastName} {client.type && `(${client.type})`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedClient?.type === "Empresa" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyRepresentativeFirstName"
                    rules={{ required: "Este campo es obligatorio" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del representante *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre"
                            autoComplete="off"
                            value={field.value}
                            onChange={(e) => {
                              handleNameInput(e.target.value, field.onChange);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyRepresentativeLastName"
                    rules={{ required: "Este campo es obligatorio" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido del representante *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Apellido"
                            autoComplete="off"
                            value={field.value}
                            onChange={(e) => {
                              handleNameInput(e.target.value, field.onChange);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="responsiblePerson"
                rules={{ required: "Este campo es obligatorio" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Atendido por *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la persona responsable"
                        autoComplete="off"
                        value={field.value}
                        onChange={(e) => {
                          handleNameInput(e.target.value, field.onChange);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50 dark:text-white" />
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Productos Vendidos *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSaleItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Producto
                  </Button>
                </div>
                
                {saleItems.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Producto {index + 1}</span>
                      {saleItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSaleItem(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                     <div className="space-y-4">
                       {/* Primera fila: Tipo de producto, Cantidad, Vehículo */}
                       <div className="grid grid-cols-1 md:grid-cols-[2.5fr,80px,1.5fr] gap-4">
                         <div>
                           <Label>Tipo de Producto *</Label>
                           <Select 
                             value={item.type} 
                              onValueChange={(value) => {
                                const newItems = [...saleItems];
                                newItems[index] = { 
                                  ...newItems[index], 
                                  type: value,
                                  // Limpiar campos específicos al cambiar tipo
                                  tipoNeumatico: "",
                                  marca: "",
                                  modelo: "",
                                  medida: "",
                                  material: "",
                                  rodado: "",
                                  tipoRepuesto: "",
                                  marcaRepuesto: ""
                                };
                                setSaleItems(newItems);
                              }}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder="Seleccionar producto" />
                             </SelectTrigger>
                             <SelectContent>
                               {productTypes.map((type) => (
                                 <SelectItem key={type} value={type}>
                                   {type}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>

                         <div>
                           <Label>Cantidad *</Label>
                           <div className="flex items-center justify-center space-x-1">
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 const newQty = Math.max(1, (item.quantity || 1) - 1);
                                 const newItems = [...saleItems];
                                 newItems[index] = { ...newItems[index], quantity: newQty };
                                 setSaleItems(newItems);
                               }}
                               className="w-6 h-6 p-0"
                             >
                               <Minus className="h-3 w-3" />
                             </Button>
                             <Input
                               type="number"
                               min="1"
                               value={item.quantity || 1}
                               onChange={(e) => {
                                 const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                 const newItems = [...saleItems];
                                 newItems[index] = { ...newItems[index], quantity: newQty };
                                 setSaleItems(newItems);
                               }}
                               className="w-10 text-center p-1 text-sm"
                               autoComplete="off"
                             />
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 const newQty = (item.quantity || 1) + 1;
                                 const newItems = [...saleItems];
                                 newItems[index] = { ...newItems[index], quantity: newQty };
                                 setSaleItems(newItems);
                               }}
                               className="w-6 h-6 p-0"
                             >
                               <Plus className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>

                         <div>
                           <Label>Vehículo Asociado *</Label>
                           <Input
                             placeholder="ej. Toyota Corolla 2020"
                             value={item.vehicle}
                             onChange={(e) => handleSaleItemChange(index, 'vehicle', e.target.value)}
                             autoComplete="off"
                           />
                         </div>
                       </div>

                        {/* Campos específicos por tipo de producto */}
                        {item.type === "Neumáticos" && (
                          <div className="space-y-4">
                            {/* Campo Tipo de Neumático - NUEVO */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <Label>Tipo *</Label>
                              <Select 
                                value={item.tipoNeumatico || ""} 
                                onValueChange={(value) => handleSaleItemChange(index, 'tipoNeumatico', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo de neumático" />
                                </SelectTrigger>
                                <SelectContent>
                                  {neumaticosTypes.map((tipo) => (
                                    <SelectItem key={tipo} value={tipo}>
                                      {tipo}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Campos existentes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div>
                                <Label>Marca *</Label>
                                <Input
                                  value={item.marca || ""}
                                  onChange={(e) => handleSaleItemChange(index, 'marca', e.target.value)}
                                  placeholder="ej. Bridgestone"
                                  autoComplete="off"
                                />
                              </div>
                              <div>
                                <Label>Modelo *</Label>
                                <Input
                                  value={item.modelo || ""}
                                  onChange={(e) => handleSaleItemChange(index, 'modelo', e.target.value)}
                                  placeholder="ej. Turanza T005"
                                  autoComplete="off"
                                />
                              </div>
                              <div>
                                <Label>Medida *</Label>
                                <Input
                                  value={item.medida || ""}
                                  onChange={(e) => handleSaleItemChange(index, 'medida', e.target.value)}
                                  placeholder="ej. 205/55 R16"
                                  autoComplete="off"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                       {item.type === "Llantas" && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                           <div>
              <Label>Material *</Label>
              <Select 
                value={item.material || ""} 
                onValueChange={(value) => handleSaleItemChange(index, 'material', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aleación">Aleación</SelectItem>
                  <SelectItem value="Chapa">Chapa</SelectItem>
                </SelectContent>
              </Select>
                           </div>
                            <div>
                              <Label>Rodado *</Label>
                              <Input
                                value={item.rodado || ""}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^0-9]/g, ''); // Solo números
                                  if (value.length > 2) value = value.slice(0, 2); // Máximo 2 dígitos
                                  if (value.length === 2) value += '"'; // Agregar " al completar 2 dígitos
                                  handleSaleItemChange(index, 'rodado', value);
                                }}
                                placeholder="ej. 16&quot;"
                                autoComplete="off"
                                maxLength={3}
                              />
                            </div>
                         </div>
                       )}

                       {item.type === "Repuestos" && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                           <div>
                             <Label>Tipo de Repuesto *</Label>
                             <Input
                               value={item.tipoRepuesto || ""}
                               onChange={(e) => handleSaleItemChange(index, 'tipoRepuesto', e.target.value)}
                               placeholder="ej. Filtro de aceite, Pastillas de freno"
                               autoComplete="off"
                             />
                           </div>
                           <div>
                             <Label>Marca *</Label>
                             <Input
                               value={item.marcaRepuesto || ""}
                               onChange={(e) => handleSaleItemChange(index, 'marcaRepuesto', e.target.value)}
                               placeholder="ej. Bosch, Mann-Filter"
                               autoComplete="off"
                             />
                           </div>
                         </div>
                       )}

                       {/* Segunda fila: Precios */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <Label>Precio Unitario *</Label>
                           <FormattedInput
                             formatNumbers={true}
                             value={item.unitPrice || ""}
                             onChange={(value) => handleSaleItemChange(index, 'unitPrice', value)}
                             placeholder="0,00"
                             className="w-full"
                           />
                         </div>
                         
                         <div>
                           <Label className="flex items-center gap-2">
                             <span>Precio Total *</span>
                             <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                               Auto
                             </span>
                           </Label>
                           <FormattedInput
                             formatNumbers={true}
                             value={item.price}
                             onChange={(value) => handleSaleItemChange(index, 'price', value)}
                             placeholder="0,00"
                             className="w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                             readOnly
                           />
                         </div>
                       </div>
                     </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total de la Venta:</span>
                  <span className="text-green-600">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amountDelivered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Entregado *</FormLabel>
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

                <div>
                  <Label>Estado del Pago</Label>
                  <div className={`p-2 rounded text-sm font-medium text-center ${getStatusColor(formData.status)}`}>
                    {getStatusLabel(formData.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-center justify-between mb-2">
                    <Label>Método de Pago Secundario</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecondaryPayment(!showSecondaryPayment)}
                    >
                      {showSecondaryPayment ? "Ocultar" : "Agregar"}
                    </Button>
                  </div>
                  {showSecondaryPayment && (
                    <FormField
                      control={form.control}
                      name="secondaryPaymentMethod"
                      render={({ field }) => (
                        <FormItem>
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
                  )}
                </div>
              </div>

              {/* Primary cheque/echeq fields section */}
              {(formData.paymentMethod === 'Cheque' || formData.paymentMethod === 'Echeq') && (
                <div className="space-y-4 p-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Label className="text-base font-semibold text-blue-800 dark:text-blue-200">
                      Información del Cheque - Método Principal
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cheque-bank">Banco *</Label>
                      <Input
                        id="cheque-bank"
                        value={chequeData.bankName}
                        onChange={(e) => setChequeData({...chequeData, bankName: e.target.value})}
                        placeholder="Nombre del banco"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cheque-number">Número de Cheque *</Label>
                      <Input
                        id="cheque-number"
                        value={chequeData.chequeNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setChequeData({...chequeData, chequeNumber: value});
                        }}
                        maxLength={8}
                        placeholder="Número del cheque"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cheque-holder">Emisor del Cheque *</Label>
                      <Input
                        id="cheque-holder"
                        value={chequeData.holderName}
                        onChange={(e) => {
                          handleNameInput(e.target.value, (formattedValue) => {
                            setChequeData({...chequeData, holderName: formattedValue});
                          });
                        }}
                        placeholder="Nombre del titular"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cheque-cbu">CBU</Label>
                      <Input
                        id="cheque-cbu"
                        value={chequeData.cbuNumber}
                        onChange={(e) => setChequeData({...chequeData, cbuNumber: e.target.value})}
                        placeholder="CBU (opcional)"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fecha de Emisión *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !chequeData.issuanceDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {chequeData.issuanceDate ? format(new Date(chequeData.issuanceDate), "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={chequeData.issuanceDate ? new Date(chequeData.issuanceDate) : undefined}
                            onSelect={(date) => setChequeData({...chequeData, issuanceDate: date ? format(date, "yyyy-MM-dd") : ""})}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Fecha de Pago *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !chequeData.paymentDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {chequeData.paymentDate ? format(new Date(chequeData.paymentDate), "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={chequeData.paymentDate ? new Date(chequeData.paymentDate) : undefined}
                            onSelect={(date) => setChequeData({...chequeData, paymentDate: date ? format(date, "yyyy-MM-dd") : ""})}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cheque-status">Estado del Cheque</Label>
                      <Select 
                        value={chequeData.status} 
                        onValueChange={(value) => setChequeData({...chequeData, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="En cartera">En cartera</SelectItem>
                          <SelectItem value="Depositado">Depositado</SelectItem>
                          <SelectItem value="Cobrado">Cobrado</SelectItem>
                          <SelectItem value="Rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cheque-image">Imagen del Cheque</Label>
                      <Input
                        id="cheque-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setChequeData({...chequeData, imageFile: e.target.files?.[0] || null})}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cheque-notes">Notas del Cheque</Label>
                    <Input
                      id="cheque-notes"
                      value={chequeData.notes}
                      onChange={(e) => setChequeData({...chequeData, notes: e.target.value})}
                      placeholder="Notas adicionales del cheque"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              {/* Secondary cheque/echeq fields section */}
              {(formData.secondaryPaymentMethod === 'Cheque' || formData.secondaryPaymentMethod === 'Echeq') && showSecondaryPayment && (
                <div className="space-y-4 p-4 border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <Label className="text-base font-semibold text-purple-800 dark:text-purple-200">
                      Información del Cheque - Método Secundario
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secondary-cheque-bank">Banco *</Label>
                      <Input
                        id="secondary-cheque-bank"
                        value={secondaryChequeData.bankName}
                        onChange={(e) => setSecondaryChequeData({...secondaryChequeData, bankName: e.target.value})}
                        placeholder="Nombre del banco"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary-cheque-number">Número de Cheque *</Label>
                      <Input
                        id="secondary-cheque-number"
                        value={secondaryChequeData.chequeNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setSecondaryChequeData({...secondaryChequeData, chequeNumber: value});
                        }}
                        maxLength={8}
                        placeholder="Número del cheque"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secondary-cheque-holder">Emisor del Cheque *</Label>
                      <Input
                        id="secondary-cheque-holder"
                        value={secondaryChequeData.holderName}
                        onChange={(e) => {
                          handleNameInput(e.target.value, (formattedValue) => {
                            setSecondaryChequeData({...secondaryChequeData, holderName: formattedValue});
                          });
                        }}
                        placeholder="Nombre del titular"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary-cheque-cbu">CBU</Label>
                      <Input
                        id="secondary-cheque-cbu"
                        value={secondaryChequeData.cbuNumber}
                        onChange={(e) => setSecondaryChequeData({...secondaryChequeData, cbuNumber: e.target.value})}
                        placeholder="CBU (opcional)"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fecha de Emisión *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !secondaryChequeData.issuanceDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {secondaryChequeData.issuanceDate ? format(new Date(secondaryChequeData.issuanceDate), "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={secondaryChequeData.issuanceDate ? new Date(secondaryChequeData.issuanceDate) : undefined}
                            onSelect={(date) => setSecondaryChequeData({...secondaryChequeData, issuanceDate: date ? format(date, "yyyy-MM-dd") : ""})}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Fecha de Pago *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !secondaryChequeData.paymentDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {secondaryChequeData.paymentDate ? format(new Date(secondaryChequeData.paymentDate), "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={secondaryChequeData.paymentDate ? new Date(secondaryChequeData.paymentDate) : undefined}
                            onSelect={(date) => setSecondaryChequeData({...secondaryChequeData, paymentDate: date ? format(date, "yyyy-MM-dd") : ""})}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secondary-cheque-status">Estado del Cheque</Label>
                      <Select 
                        value={secondaryChequeData.status} 
                        onValueChange={(value) => setSecondaryChequeData({...secondaryChequeData, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="En cartera">En cartera</SelectItem>
                          <SelectItem value="Depositado">Depositado</SelectItem>
                          <SelectItem value="Cobrado">Cobrado</SelectItem>
                          <SelectItem value="Rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="secondary-cheque-image">Imagen del Cheque</Label>
                      <Input
                        id="secondary-cheque-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSecondaryChequeData({...secondaryChequeData, imageFile: e.target.files?.[0] || null})}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary-cheque-notes">Notas del Cheque</Label>
                    <Input
                      id="secondary-cheque-notes"
                      value={secondaryChequeData.notes}
                      onChange={(e) => setSecondaryChequeData({...secondaryChequeData, notes: e.target.value})}
                      placeholder="Notas adicionales del cheque"
                      autoComplete="off"
                    />
                  </div>
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
                        placeholder="Notas adicionales sobre la venta..."
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showSignature && (
                <div className="space-y-2">
                  <Label>Firma del Cliente (Requerida para saldo pendiente) *</Label>
                  <div className="border rounded-lg p-4">
                    <SignatureCapture
                      ref={signatureRef}
                      onSignatureChange={handleSignatureChange}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Venta"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleForm;