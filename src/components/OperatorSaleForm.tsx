import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { FormattedInput } from "@/components/ui/formatted-input";
import { useAuth } from "@/contexts/AuthContext";

interface SaleItem {
  type: string;
  vehicle: string;
  price: number | string;
  quantity: number;
  unitPrice: number | string;
  tipoNeumatico?: string;
  marca?: string;
  modelo?: string;
  medida?: string;
  material?: string;
  rodado?: string;
  tipoRepuesto?: string;
  marcaRepuesto?: string;
}

interface OperatorSaleFormProps {
  onClose: () => void;
  onSave: (sale: any) => void;
}

interface FormData {
  clientId: string;
  notes: string;
  responsiblePerson: string;
  companyRepresentativeFirstName: string;
  companyRepresentativeLastName: string;
}

const OperatorSaleForm = ({ onClose, onSave }: OperatorSaleFormProps) => {
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

  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { type: "", vehicle: "", price: "", quantity: 1, unitPrice: "" }
  ]);

  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Cargar clientes al inicializar y refrescar cada vez que se abre el modal
  useEffect(() => {
    fetchClients();
  }, []); // Se ejecuta al montar el componente

  // Calculate total amount from individual sale prices
  useEffect(() => {
    const total = saleItems.reduce((sum, item) => {
      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
      const quantity = item.quantity || 1;
      return sum + (unitPrice * quantity);
    }, 0);
    
    // Update individual item prices
    const updatedItems = saleItems.map(item => {
      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
      const quantity = item.quantity || 1;
      return { ...item, price: unitPrice * quantity };
    });
    setSaleItems(updatedItems);
  }, [saleItems]);

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

      // Validar que haya al menos una venta
      let validItems;
      if (isPriceOptional) {
        // Para operadores y alineadores: solo validar tipo y vehículo
        validItems = saleItems.filter(item => item.type && item.vehicle);
      } else {
        // Para otros roles: validar tipo, vehículo y precio
        validItems = saleItems.filter(item => item.type && item.vehicle && item.unitPrice);
      }
      
      if (validItems.length === 0) {
        alert(isPriceOptional ? "Debe agregar al menos un producto" : "Debe agregar al menos un producto con precio");
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

      const totalAmount = saleItems.reduce((sum, item) => {
        const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
        const quantity = item.quantity || 1;
        return sum + (unitPrice * quantity);
      }, 0);

      const saleType = validItems.map(item => item.type).join(", ");
      const uniqueVehicles = [...new Set(validItems.map(item => item.vehicle))];
      const vehicleInfo = uniqueVehicles.join(", ");

      // Crear venta pendiente (sin método de pago ni firma)
      const saleData = {
        client_id: selectedClient.id,
        service_type: saleType,
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
        category: 'venta'
      };

      await createService(saleData);
      
      toast({
        title: "Venta pendiente creada",
        description: "La venta se registró como pendiente. El cliente debe dirigirse con la secretaria para completar los detalles de pago.",
      });

      onSave(saleData);
      onClose();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la venta pendiente.",
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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Nueva Venta - Operador</CardTitle>
              <CardDescription>Registrar venta pendiente (sin detalles de pago)</CardDescription>
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

              {/* Productos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Productos *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSaleItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Producto
                  </Button>
                </div>

                {saleItems.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
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
                      {/* Primera fila: Tipo de producto, Cantidad y Vehículo */}
                      <div className="grid grid-cols-1 md:grid-cols-[2fr,80px,2fr] gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Producto *</Label>
                          <Select
                            value={item.type}
                            onValueChange={(value) => handleSaleItemChange(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {productTypes.map((product) => (
                                <SelectItem key={product} value={product}>
                                  {product}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newQty = Math.max(1, (item.quantity || 1) - 1);
                                handleSaleItemChange(index, 'quantity', newQty);
                              }}
                              className="w-6 h-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => handleSaleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-10 text-center p-1 text-sm"
                              autoComplete="off"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newQty = (item.quantity || 1) + 1;
                                handleSaleItemChange(index, 'quantity', newQty);
                              }}
                              className="w-6 h-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Vehículo Asociado *</Label>
                          <Input
                            placeholder="ej. Toyota Corolla 2020"
                            value={item.vehicle}
                            onChange={(e) => handleSaleItemChange(index, 'vehicle', e.target.value)}
                            className="w-full"
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {/* Campos específicos por tipo de producto */}
                      {item.type === "Neumáticos" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tipo de Neumático</Label>
                            <Select
                              value={item.tipoNeumatico || ""}
                              onValueChange={(value) => handleSaleItemChange(index, 'tipoNeumatico', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
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

                      {/* Segunda fila: Precios - solo visible para roles que no sean Operator ni Alineador */}
                      {!isPriceOptional && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Precio Unitario *</Label>
                            <FormattedInput
                              formatNumbers={true}
                              value={item.unitPrice || ""}
                              onChange={(value) => handleSaleItemChange(index, 'unitPrice', value)}
                              placeholder="0,00"
                              className="w-full"
                            />
                          </div>
                          
                          <div className="space-y-2">
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
                      )}
                    </div>
                  </div>
                ))}

                {/* Display subtotal - solo visible para roles que no sean Operator ni Alineador */}
                {!isPriceOptional && subtotal > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total de la Venta:</span>
                      <span className="text-green-600">${subtotal.toLocaleString('de-DE')}</span>
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
                  {isSubmitting ? 'Creando...' : 'Crear Venta Pendiente'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorSaleForm;