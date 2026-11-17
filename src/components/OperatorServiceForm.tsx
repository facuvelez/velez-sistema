import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormattedInput } from "@/components/ui/formatted-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Check, ChevronsUpDown, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { handleNameInput } from "@/utils/textFormatters";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

interface OperatorServiceFormProps {
  onClose: () => void;
  onSave: (service: any) => void;
}

interface FormData {
  clientId: string;
  notes: string;
  responsiblePerson: string;
  companyRepresentativeFirstName: string;
  companyRepresentativeLastName: string;
}

const OperatorServiceForm = ({ onClose, onSave }: OperatorServiceFormProps) => {
  const { clients, fetchClients } = useClients();
  const { createService } = useServices();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user is operator or aligner (prices are optional for them)
  const isPriceOptional = profile?.role === 'Operator' || profile?.role === 'Alineador';
  
  const form = useForm<FormData>({
    defaultValues: {
      clientId: "",
      notes: "",
      responsiblePerson: "",
      companyRepresentativeFirstName: "",
      companyRepresentativeLastName: ""
    }
  });

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    { type: "", subtype: "", subtypeQuantity: 1, medida: "", procedures: [{ subtype: "", quantity: 1, medida: "" }], vehicle: "", price: "", unitPrice: "", quantity: 1 }
  ]);

  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Cargar clientes al inicializar y refrescar cada vez que se abre el modal
  useEffect(() => {
    fetchClients();
  }, []); // Se ejecuta al montar el componente

  // Calculate total amount from individual service prices
  useEffect(() => {
    const total = serviceItems.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
      return sum + price;
    }, 0);
  }, [serviceItems]);

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
    { name: "Balanceo", hasQuantity: false },
    { name: "Reparación de cámara", hasQuantity: true },
    { name: "Reparación de llanta", hasQuantity: true },
    
    { name: "Rotación", hasQuantity: true },
    { name: "Vulcanizado", hasQuantity: true }
  ];

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Validaciones básicas
      if (!selectedClient) {
        alert("Debe seleccionar un cliente");
        setIsSubmitting(false);
        return;
      }

      if (!data.responsiblePerson.trim()) {
        form.setError('responsiblePerson', {
          type: 'manual',
          message: 'Este campo es obligatorio'
        });
        setIsSubmitting(false);
        return;
      }

      // Validar procedimientos para Arreglo
      const missingProcedure = serviceItems.some(item => item.type === "Arreglo" && !(item.procedures || []).some(p => p.subtype));
      if (missingProcedure) {
        alert("Debe seleccionar al menos un procedimiento para todos los servicios de Arreglo");
        setIsSubmitting(false);
        return;
      }

      // Validar que haya al menos un servicio
      let validItems;
      if (isPriceOptional) {
        // Para operadores y alineadores: solo validar tipo y vehículo
        validItems = serviceItems.filter(item => item.type && item.vehicle);
      } else {
        // Para otros roles: validar tipo, vehículo y precio
        validItems = serviceItems.filter(item => item.type && item.vehicle && item.price);
      }
      
      if (validItems.length === 0) {
        alert(isPriceOptional ? "Debe agregar al menos un servicio" : "Debe agregar al menos un servicio con precio");
        setIsSubmitting(false);
        return;
      }

      // Validación para empresas
      if (selectedClient?.type === "Empresa") {
        if (!data.companyRepresentativeFirstName.trim() || !data.companyRepresentativeLastName.trim()) {
          alert("Debe ingresar el nombre del representante de la empresa");
          setIsSubmitting(false);
          return;
        }
      }

      const totalAmount = serviceItems.reduce((sum, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
        return sum + price;
      }, 0);

      const serviceType = validItems.map(item => {
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
        return item.type;
      }).join(", ");
      const uniqueVehicles = [...new Set(validItems.map(item => item.vehicle))];
      const vehicleInfo = uniqueVehicles.join(", ");

      // Crear servicio pendiente (sin método de pago ni firma)
      const serviceData = {
        client_id: selectedClient.id,
        service_type: serviceType,
        vehicle_info: vehicleInfo,
        notes: data.notes,
        total_amount: totalAmount,
        amount_delivered: 0, // Operario no maneja pagos
        payment_method: 'Efectivo' as const, // Valor por defecto, será cambiado por secretaria
        status: 'pending' as const,
        service_date: new Date().toISOString().split('T')[0],
        responsible_person: data.responsiblePerson,
        company_representative: selectedClient?.type === "Empresa" 
          ? `${data.companyRepresentativeFirstName} ${data.companyRepresentativeLastName}` 
          : null,
        service_items: validItems,
        category: 'servicio'
      };

      await createService(serviceData);
      
      toast({
        title: "Servicio pendiente creado",
        description: "El servicio se registró como pendiente. El cliente debe dirigirse con la secretaria para completar los detalles de pago.",
      });

      onSave(serviceData);
      onClose();
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el servicio pendiente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSelect = (client: any) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Nuevo Servicio - Operador</CardTitle>
              <CardDescription>Registrar servicio pendiente (sin detalles de pago)</CardDescription>
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
                        ? `${selectedClient.first_name} ${selectedClient.last_name} ${selectedClient.type ? `(${selectedClient.type})` : ''}`
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
                              value={`${client.first_name} ${client.last_name}`}
                              onSelect={() => handleClientSelect(client)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.first_name} {client.last_name} {client.type && `(${client.type})`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {isCompanyClient && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyRepresentativeFirstName"
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona Responsable *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de quien atendió al cliente"
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

              {/* Servicios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar servicio" />
                            </SelectTrigger>
                            <SelectContent>
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
                                      <SelectContent>
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

                      {/* Segunda fila: Precios - solo visible para roles que no sean Operator ni Alineador */}
                      {!isPriceOptional && (
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
                                const selectedService = serviceTypes.find(s => s.name === item.type);
                                const multiplier = selectedService?.hasQuantity ? (item.quantity || 1) : 1;
                                const totalPrice = value * multiplier;
                                
                                newItems[index] = { ...newItems[index], price: totalPrice };
                                setServiceItems(newItems);
                              }}
                              placeholder="0"
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
                              onChange={(value) => {}}
                              readOnly
                              className="w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Display subtotal - solo visible para roles que no sean Operator ni Alineador */}
                {!isPriceOptional && serviceItems.some(item => item.price) && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Subtotal de Servicios:</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        ${serviceItems.reduce((sum, item) => {
                          const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
                          return sum + price;
                        }, 0).toLocaleString('de-DE')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones, detalles adicionales..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Creando...' : 'Crear Servicio Pendiente'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorServiceForm;