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
import { formatCurrency, formatNumberForDisplay } from "@/utils/numberFormatter";
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

interface ArregloProcedure {
  subtype: string;
  quantity: number;
  medida: string;
}

interface ServiceItem {
  type: string;
  subtype?: string;
  subtypeQuantity?: number;
  medida?: string;
  procedures?: ArregloProcedure[];
  vehicle: string;
  price: number | string;
  unitPrice?: number | string;
  quantity?: number;
}

interface ServiceFormProps {
  clients: Client[];
  onClose: () => void;
  onSave: (service: any) => void;
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

const ServiceForm = ({ clients, onClose, onSave }: ServiceFormProps) => {
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

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    { type: "", subtype: "", subtypeQuantity: 1, medida: "", procedures: [{ subtype: "", quantity: 1, medida: "" }], vehicle: "", price: "", unitPrice: "", quantity: 1 }
  ]);

  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
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
    { 
      name: "Arreglo", 
      hasQuantity: true,
      subtypes: [
        { name: "Arme", hasQuantity: true },
        { name: "Colocar", hasQuantity: true },
        { name: "Desarme", hasQuantity: true },
        { name: "Desarme y Arme", hasQuantity: true },
        { name: "Sacar", hasQuantity: true },
        { name: "Sacar y Colocar", hasQuantity: true }
      ]
    },
    { name: "Balanceo", hasQuantity: true },
    { 
      name: "Reconstrucción", 
      hasQuantity: true,
      subtypes: [
        { name: "Hombro", hasQuantity: true },
        { name: "Precurado", hasQuantity: true },
        { name: "Recauchutado", hasQuantity: true },
        { name: "Rellenado", hasQuantity: true },
        { name: "Retacado y relleno", hasQuantity: true }
      ]
    },
    { name: "Regulación de comba", hasQuantity: true },
    { name: "Reparación de cámara", hasQuantity: true },
    { name: "Reparación de llanta", hasQuantity: true },
    
    { name: "Rotación", hasQuantity: true },
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
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    
    // Validate client selection first
    if (!data.clientId || !selectedClient) {
      alert("Debe seleccionar un cliente antes de guardar el servicio");
      setIsSubmitting(false);
      return;
    }
    
    // Validate amounts
    const totalAmount = parseFloat(data.amount) || 0;
    const deliveredAmount = parseFloat(data.amountDelivered) || 0;
    
    if (deliveredAmount > totalAmount) {
      alert("El monto entregado no puede ser mayor al monto total");
      setIsSubmitting(false);
      return;
    }

    // Signature is optional - client may leave vehicle and pick up later
    const hasPendingBalance = deliveredAmount < totalAmount && totalAmount > 0;

    // Additional validation for company clients
    if (selectedClient?.type === "Empresa") {
      if (!data.companyRepresentativeFirstName.trim()) {
        form.setError('companyRepresentativeFirstName', {
          type: 'manual',
          message: 'Este campo es obligatorio'
        });
        setIsSubmitting(false);
        return;
      }
      if (!data.companyRepresentativeLastName.trim()) {
        form.setError('companyRepresentativeLastName', {
          type: 'manual',
          message: 'Este campo es obligatorio'
        });
        setIsSubmitting(false);
        return;
      }
    }

    // Validate responsiblePerson for all clients (now mandatory)
    if (!data.responsiblePerson.trim()) {
      form.setError('responsiblePerson', {
        type: 'manual',
        message: 'Este campo es obligatorio'
      });
      setIsSubmitting(false);
      return;
    }

    // Validate required fields for all clients
    if (!data.paymentMethod) {
      form.setError('paymentMethod', {
        type: 'manual',
        message: 'Este campo es obligatorio'
      });
      setIsSubmitting(false);
      return;
    }

    // Validate cheque fields if payment method is cheque or echeq
    if (data.paymentMethod === 'Cheque' || data.paymentMethod === 'Echeq') {
      if (!chequeData.bankName.trim()) {
        alert("El nombre del banco es obligatorio para cheques");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.chequeNumber.trim()) {
        alert("El número de cheque es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.holderName.trim()) {
        alert("El emisor del cheque es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.issuanceDate) {
        alert("La fecha de emisión es obligatoria");
        setIsSubmitting(false);
        return;
      }
      if (!chequeData.paymentDate) {
        alert("La fecha de pago es obligatoria");
        setIsSubmitting(false);
        return;
      }
    }

    // Validate secondary cheque fields if secondary payment method is cheque or echeq
    if (data.secondaryPaymentMethod === 'Cheque' || data.secondaryPaymentMethod === 'Echeq') {
      if (!secondaryChequeData.bankName.trim()) {
        alert("El nombre del banco es obligatorio para el cheque secundario");
        setIsSubmitting(false);
        return;
      }
      if (!secondaryChequeData.chequeNumber.trim()) {
        alert("El número de cheque secundario es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!secondaryChequeData.holderName.trim()) {
        alert("El emisor del cheque secundario es obligatorio");
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
    
    // Validate service items
    const invalidServiceItems = serviceItems.filter(item => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
      const hasValidType = item.type && price > 0;
      const needsSubtype = item.type === "Reconstrucción" && !item.subtype;
      const needsProcedure = item.type === "Arreglo" && !(item.procedures || []).some(p => p.subtype);
      
      return !hasValidType || needsSubtype || needsProcedure;
    });

    if (invalidServiceItems.length > 0) {
      const hasIncompleteSubtype = invalidServiceItems.some(item => 
        (item.type === "Reconstrucción" && !item.subtype) ||
        (item.type === "Arreglo" && !(item.procedures || []).some(p => p.subtype))
      );
      
      if (hasIncompleteSubtype) {
        alert("Debe seleccionar un subtipo/procedimiento para todos los servicios que lo requieran");
      } else {
        alert("Todos los servicios deben tener un tipo válido y un precio mayor a 0");
      }
      setIsSubmitting(false);
      return;
    }

    try {
      if (data.clientId && serviceItems.some(item => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
          const hasValidType = item.type && (item.type !== "Reconstrucción" || item.subtype) && (item.type !== "Arreglo" || (item.procedures || []).some(p => p.subtype));
        return hasValidType && price > 0;
      }) && totalAmount > 0) {
        const serviceType = serviceItems.map(item => {
          if (item.type === "Arreglo" && item.procedures?.length) {
            const procNames = item.procedures.filter(p => p.subtype).map(p => {
              let name = p.subtype;
              if (p.quantity > 1) name += ` x${p.quantity}`;
              return name;
            });
            let arregloLabel = `Arreglo - ${procNames.join(', ')}`;
            if (item.medida) arregloLabel += ` (${item.medida})`;
            return arregloLabel;
          }
          if (item.type === "Reconstrucción" && item.subtype) {
            return `${item.type} - ${item.subtype}`;
          }
          return item.type;
        }).filter(Boolean).join(", ");
        const combinedNotes = data.notes;
        
        // Create a consolidated vehicle string from all unique vehicles
        const uniqueVehicles = [...new Set(serviceItems.map(item => item.vehicle).filter(Boolean))];
        const vehicleInfo = uniqueVehicles.join(", ");
        
        onSave({
          ...data,
          type: serviceType,
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
          serviceItems: serviceItems.filter(item => {
            const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
            const hasValidType = item.type && (item.type !== "Reconstrucción" || item.subtype) && (item.type !== "Arreglo" || (item.procedures || []).some(p => p.subtype));
            return hasValidType && price > 0;
          }),
          signature: hasPendingBalance ? signature : undefined,
          // Include cheque data if payment method is cheque or echeq
          chequeData: (data.paymentMethod === 'Cheque' || data.paymentMethod === 'Echeq') ? chequeData : undefined,
          secondaryChequeData: (data.secondaryPaymentMethod === 'Cheque' || data.secondaryPaymentMethod === 'Echeq') ? secondaryChequeData : undefined
        });
      }
    } catch (error) {
      console.error('Error submitting service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    form.setValue('clientId', client.id.toString());
    setOpen(false);
  };

  const handleServiceItemChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    const newServiceItems = [...serviceItems];
    newServiceItems[index] = { ...newServiceItems[index], [field]: value };
    setServiceItems(newServiceItems);
  };

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { type: "", subtype: "", subtypeQuantity: 1, medida: "", procedures: [{ subtype: "", quantity: 1, medida: "" }], vehicle: "", price: "", unitPrice: "", quantity: 1 }]);
  };

  const removeServiceItem = (index: number) => {
    if (serviceItems.length > 1) {
      setServiceItems(serviceItems.filter((_, i) => i !== index));
    }
  };

  const isCompanyClient = selectedClient?.type === "Empresa";

  // Calculate subtotal for display
  const subtotal = serviceItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
    return sum + price;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Agregar Nuevo Servicio</CardTitle>
              <CardDescription>Registrar un servicio o venta de producto</CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="responsiblePerson"
                  rules={{ required: "Este campo es obligatorio" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Atendido por *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar responsable" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Abel">Abel</SelectItem>
                          <SelectItem value="Antonio">Antonio</SelectItem>
                          <SelectItem value="Facu">Facu</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Gustavo">Gustavo</SelectItem>
                          <SelectItem value="Leo">Leo</SelectItem>
                          <SelectItem value="Matías">Matías</SelectItem>
                        </SelectContent>
                      </Select>
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
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Servicios Realizados *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addServiceItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Servicio
                  </Button>
                </div>
                
                {serviceItems.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Servicio {index + 1}</span>
                      {serviceItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeServiceItem(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                     
                    <div className="space-y-4">
                      {/* Primera fila: Vehículo y Medida */}
                      <div className="grid grid-cols-1 md:grid-cols-[0.6fr,1fr] gap-4">
                        <div className="space-y-2">
                          <Label>Vehículo Asociado *</Label>
                          <Input
                            placeholder="ej. Toyota Corolla 2020"
                            value={item.vehicle}
                            onChange={(e) => {
                              const newItems = [...serviceItems];
                              newItems[index] = { ...newItems[index], vehicle: e.target.value };
                              setServiceItems(newItems);
                            }}
                            className="w-full"
                            autoComplete="off"
                          />
                        </div>

                        {item.type === "Arreglo" && (
                          <div className="space-y-2 w-1/2">
                            <Label>Medida</Label>
                            <Input
                              placeholder="ej. 205/55 R16"
                              value={item.medida || ""}
                              onChange={(e) => {
                                const newItems = [...serviceItems];
                                newItems[index] = { ...newItems[index], medida: e.target.value };
                                setServiceItems(newItems);
                              }}
                              className="w-full"
                              autoComplete="off"
                            />
                          </div>
                        )}
                      </div>

                      {/* Segunda fila: Tipo de servicio y Cantidad */}
                      <div className="grid grid-cols-1 md:grid-cols-[0.42fr,80px] gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Servicio *</Label>
                          <Select
                            value={item.type}
                            onValueChange={(value) => {
                              console.log('🚀 ANTES - item.type:', item.type);
                              console.log('🚀 NUEVO VALUE:', value);
                              console.log('🚀 INDEX:', index);
                              console.log('🚀 serviceItems ANTES:', serviceItems);
                              
                              const newItems = [...serviceItems];
                              const selectedService = serviceTypes.find(s => s.name === value);
                              
                              const newQuantity = selectedService?.hasQuantity ? (item.quantity || 1) : 1;
                              
                              newItems[index] = { 
                                ...newItems[index], 
                                type: value,
                                subtype: "",
                                procedures: [{ subtype: "", quantity: 1, medida: "" }],
                                quantity: newQuantity
                              };
                              
                              if (item.unitPrice) {
                                const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
                                const multiplier = selectedService?.hasQuantity ? newQuantity : 1;
                                const totalPrice = unitPrice * multiplier;
                                newItems[index] = { ...newItems[index], price: totalPrice };
                              }
                              
                              setServiceItems(newItems);
                              
                              console.log('🚀 serviceItems DESPUÉS:', newItems);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar servicio" />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-background border">
                              {serviceTypes.map((type) => (
                                <SelectItem key={type.name} value={type.name}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {item.type === "Arreglo" && (
                            <div className="space-y-2 mt-2">
                              {(item.procedures || [{ subtype: "", quantity: 1, medida: "" }]).map((proc, procIndex) => (
                                <div key={procIndex} className="flex items-end gap-2 p-2 border rounded bg-muted/30">
                                  <div className="flex-1">
                                    <Label className="text-xs">Procedimiento *</Label>
                                    <Select
                                      value={proc.subtype || ""}
                                      onValueChange={(value) => {
                                        const newItems = [...serviceItems];
                                        const procs = [...(newItems[index].procedures || [])];
                                        procs[procIndex] = { ...procs[procIndex], subtype: value };
                                        newItems[index] = { ...newItems[index], procedures: procs, subtype: procs[0]?.subtype || "" };
                                        setServiceItems(newItems);
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar procedimiento" />
                                      </SelectTrigger>
                                      <SelectContent className="z-50 bg-background border">
                                        {serviceTypes.find(s => s.name === "Arreglo")?.subtypes?.map((subtype) => (
                                          <SelectItem key={subtype.name} value={subtype.name}>
                                            {subtype.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Cant.</Label>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newItems = [...serviceItems];
                                          const procs = [...(newItems[index].procedures || [])];
                                          procs[procIndex] = { ...procs[procIndex], quantity: Math.max(1, proc.quantity - 1) };
                                          newItems[index] = { ...newItems[index], procedures: procs };
                                          setServiceItems(newItems);
                                        }}
                                        className="w-6 h-6 p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={proc.quantity}
                                        onChange={(e) => {
                                          const newItems = [...serviceItems];
                                          const procs = [...(newItems[index].procedures || [])];
                                          procs[procIndex] = { ...procs[procIndex], quantity: Math.max(1, parseInt(e.target.value) || 1) };
                                          newItems[index] = { ...newItems[index], procedures: procs };
                                          setServiceItems(newItems);
                                        }}
                                        className="w-10 text-center p-1 text-sm"
                                        autoComplete="off"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newItems = [...serviceItems];
                                          const procs = [...(newItems[index].procedures || [])];
                                          procs[procIndex] = { ...procs[procIndex], quantity: proc.quantity + 1 };
                                          newItems[index] = { ...newItems[index], procedures: procs };
                                          setServiceItems(newItems);
                                        }}
                                        className="w-6 h-6 p-0"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {(item.procedures || []).length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newItems = [...serviceItems];
                                        const procs = [...(newItems[index].procedures || [])];
                                        procs.splice(procIndex, 1);
                                        newItems[index] = { ...newItems[index], procedures: procs, subtype: procs[0]?.subtype || "" };
                                        setServiceItems(newItems);
                                      }}
                                      className="w-6 h-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newItems = [...serviceItems];
                                  const procs = [...(newItems[index].procedures || [])];
                                  procs.push({ subtype: "", quantity: 1, medida: "" });
                                  newItems[index] = { ...newItems[index], procedures: procs };
                                  setServiceItems(newItems);
                                }}
                                className="w-full text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar Procedimiento
                              </Button>
                            </div>
                          )}
                          {item.type === "Reconstrucción" && (
                            <Select
                              value={item.subtype || ""}
                              onValueChange={(value) => {
                                const newItems = [...serviceItems];
                                newItems[index] = { ...newItems[index], subtype: value };
                                setServiceItems(newItems);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar subtipo" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-background border">
                                {serviceTypes.find(s => s.name === "Reconstrucción")?.subtypes?.map((subtype) => (
                                  <SelectItem key={subtype.name} value={subtype.name}>
                                    {subtype.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          {(() => {
                            const selectedService = serviceTypes.find(s => s.name === item.type);
                            return selectedService?.hasQuantity ? (
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newQty = Math.max(1, (item.quantity || 1) - 1);
                                    const newItems = [...serviceItems];
                                    newItems[index] = { ...newItems[index], quantity: newQty };
                                    
                                    const selectedService = serviceTypes.find(s => s.name === item.type);
                                    if (selectedService?.hasQuantity && item.unitPrice) {
                                      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
                                      const totalPrice = unitPrice * newQty;
                                      newItems[index] = { ...newItems[index], price: totalPrice };
                                    }
                                    
                                    setServiceItems(newItems);
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
                                    const newItems = [...serviceItems];
                                    newItems[index] = { ...newItems[index], quantity: newQty };
                                    
                                    const selectedService = serviceTypes.find(s => s.name === item.type);
                                    if (selectedService?.hasQuantity && item.unitPrice) {
                                      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
                                      const totalPrice = unitPrice * newQty;
                                      newItems[index] = { ...newItems[index], price: totalPrice };
                                    }
                                    
                                    setServiceItems(newItems);
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
                                    const newItems = [...serviceItems];
                                    newItems[index] = { ...newItems[index], quantity: newQty };
                                    
                                    const selectedService = serviceTypes.find(s => s.name === item.type);
                                    if (selectedService?.hasQuantity && item.unitPrice) {
                                      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
                                      const totalPrice = unitPrice * newQty;
                                      newItems[index] = { ...newItems[index], price: totalPrice };
                                    }
                                    
                                    setServiceItems(newItems);
                                  }}
                                  className="w-6 h-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="h-10 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">-</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Segunda fila: Precios */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Precio Unitario *</Label>
                          <FormattedInput
                            formatNumbers={true}
                            value={item.unitPrice || ""}
                            onChange={(value) => {
                              const newItems = [...serviceItems];
                              newItems[index] = { ...newItems[index], unitPrice: value };
                              
                              // Calcular automáticamente el precio total
                              const unitPrice = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
                              const selectedService = serviceTypes.find(s => s.name === item.type);
                              const multiplier = selectedService?.hasQuantity ? (item.quantity || 1) : 1;
                              const totalPrice = unitPrice * multiplier;
                              
                              newItems[index] = { ...newItems[index], price: totalPrice };
                              setServiceItems(newItems);
                            }}
                            placeholder="0,00"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <span>Precio del Servicio *</span>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              Auto
                            </span>
                          </Label>
                          <FormattedInput
                            formatNumbers={true}
                            value={item.price}
                            onChange={(value) => {
                              const newItems = [...serviceItems];
                              newItems[index] = { ...newItems[index], price: value };
                              setServiceItems(newItems);
                            }}
                            placeholder="0,00"
                            className="w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Display subtotal with proper dark mode styling */}
                {subtotal > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Subtotal de Servicios:</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                )}
              </div>

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

              {/* Cheque/Echeq fields section - only show when Cheque or Echeq is selected as payment method */}
              {(formData.paymentMethod === 'Cheque' || formData.paymentMethod === 'Echeq') && (
                <div className="space-y-4 p-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Label className="text-base font-semibold text-blue-800 dark:text-blue-200">
                      Información del {formData.paymentMethod} - Método Principal
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
              )}

              {/* Secondary cheque/echeq fields section */}
              {(formData.secondaryPaymentMethod === 'Cheque' || formData.secondaryPaymentMethod === 'Echeq') && showSecondaryPayment && (
                <div className="space-y-4 p-4 border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <Label className="text-base font-semibold text-purple-800 dark:text-purple-200">
                      Información del {formData.secondaryPaymentMethod} - Método Secundario
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
              )}

              {/* Signature section - only show when there's a pending balance */}
              {showSignature && (
                <div className="space-y-4">
                  <div className="p-4 border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <Label className="text-base font-semibold text-yellow-800 dark:text-yellow-200">
                        Firma del cliente reconociendo el saldo pendiente
                      </Label>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                      Firma opcional del cliente para reconocer el saldo pendiente.
                    </p>
                    <SignatureCapture
                      ref={signatureRef}
                      onSignatureChange={handleSignatureChange}
                    />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones generales, garantías, etc..."
                        rows={3}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Servicio"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceForm;
