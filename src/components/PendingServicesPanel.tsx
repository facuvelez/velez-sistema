
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Calendar, User, FileText, Clock, Edit, Save, X, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormatter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  service_type: string;
  vehicle_info: string;
  total_amount: number;
  amount_delivered: number;
  status: string;
  service_date: string;
  responsible_person: string;
  company_representative?: string;
  notes?: string;
  category: string;
  service_items?: any[];
  created_at: string;
}

interface PendingServicesPanelProps {
  services: Service[];
  clientName: string;
  onEditService?: (serviceId: string) => void;
  onDeleteService?: (serviceId: string) => void;
}

const PendingServicesPanel = ({ services, clientName, onEditService, onDeleteService }: PendingServicesPanelProps) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<{ serviceId: string; itemIndex: number } | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);
  const { updateService, deleteService } = useServices();
  const { toast } = useToast();

  const pendingServices = services.filter(service => 
    service.status === 'pending' && service.amount_delivered === 0
  );

  if (pendingServices.length === 0) {
    return null;
  }

  const toggleItem = (serviceId: string) => {
    setOpenItems(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getServiceTypeLabel = (category: string) => {
    return category === 'venta' ? 'Venta Pendiente' : 'Servicio Pendiente';
  };

  const getServiceTypeColor = (category: string) => {
    return category === 'venta' 
      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  };

  const startEditingQuantity = (serviceId: string, itemIndex: number, currentQuantity: number) => {
    setEditingItem({ serviceId, itemIndex });
    setEditingQuantity(currentQuantity);
  };

  const cancelEditingQuantity = () => {
    setEditingItem(null);
    setEditingQuantity(1);
  };

  const saveQuantity = async (serviceId: string, itemIndex: number) => {
    try {
      const service = pendingServices.find(s => s.id === serviceId);
      if (!service || !service.service_items) return;

      const updatedServiceItems = [...service.service_items];
      const item = updatedServiceItems[itemIndex];
      
      // Update quantity
      const oldQuantity = item.quantity || 1;
      const newQuantity = Math.max(1, editingQuantity);
      updatedServiceItems[itemIndex] = {
        ...item,
        quantity: newQuantity
      };

      // Recalculate price if unitPrice exists
      if (item.unitPrice) {
        const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice || 0;
        updatedServiceItems[itemIndex].price = unitPrice * newQuantity;
      }

      // Recalculate total amount
      const newTotalAmount = updatedServiceItems.reduce((sum, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
        return sum + price;
      }, 0);

      // Update service
      await updateService(serviceId, {
        service_items: updatedServiceItems,
        total_amount: newTotalAmount
      });

      toast({
        title: "Cantidad actualizada",
        description: `Cantidad cambiada de ${oldQuantity} a ${newQuantity}`,
      });

      setEditingItem(null);
      setEditingQuantity(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId, []);
      
      toast({
        title: "Servicio eliminado",
        description: "El servicio pendiente ha sido eliminado correctamente",
      });

      if (onDeleteService) {
        onDeleteService(serviceId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Servicios y Ventas Pendientes
        </CardTitle>
        <CardDescription>
          {clientName} tiene {pendingServices.length} {pendingServices.length === 1 ? 'elemento pendiente' : 'elementos pendientes'} que requieren completar detalles de pago.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingServices.map((service) => {
          const isOpen = openItems.includes(service.id);
          
          return (
            <Collapsible key={service.id} open={isOpen} onOpenChange={() => toggleItem(service.id)}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Badge className={getServiceTypeColor(service.category)}>
                      {getServiceTypeLabel(service.category)}
                    </Badge>
                    <div>
                      <div className="font-medium">{service.service_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(service.total_amount)} • {format(new Date(service.created_at), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="px-4 pb-4">
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Fecha:</span>
                      <span>{format(new Date(service.service_date), 'dd/MM/yyyy', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Responsable:</span>
                      <span>{service.responsible_person}</span>
                    </div>
                  </div>
                  
                  {service.vehicle_info && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Vehículo(s):</span>
                      <span className="ml-2">{service.vehicle_info}</span>
                    </div>
                  )}
                  
                  {service.company_representative && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Representante:</span>
                      <span className="ml-2">{service.company_representative}</span>
                    </div>
                  )}
                  
                  {service.service_items && service.service_items.length > 0 && (
                    <div className="text-sm">
                       <span className="text-muted-foreground font-medium">Detalles:</span>
                       <div className="mt-1 space-y-2">
                           {service.service_items.map((item, index) => {
                             console.log('🔍 DEBUG PANEL - Item:', JSON.stringify(item, null, 2));
                             return (
                             <div key={index} className="ml-4 text-xs bg-muted/50 p-3 rounded">
                               <div className="font-medium">{item.type}</div>
                               {item.vehicle && <div>Vehículo: {item.vehicle}</div>}
                               
                               {/* Quantity Field (read-only) */}
                               <div className="flex items-center gap-2 mt-2">
                                 <span>Cantidad:</span>
                                 <span className="font-medium">{item.quantity || 1}</span>
                               </div>
                               
                               <div>Precio Unitario: {formatCurrency(item.unitPrice || (item.quantity > 0 ? item.price / item.quantity : item.price))}</div>
                               <div>Precio Total: {formatCurrency(item.price)}</div>
                             
                               {/* Campos específicos según el tipo */}
                               {item.marca && <div>Marca: {item.marca}</div>}
                               {item.modelo && <div>Modelo: {item.modelo}</div>}
                               {item.medida && <div>Medida: {item.medida}</div>}
                               {item.tipoNeumatico && <div>Tipo: {item.tipoNeumatico}</div>}
                               {item.material && <div>Material: {item.material}</div>}
                               {item.rodado && <div>Rodado: {item.rodado}</div>}
                               {item.tipoRepuesto && <div>Tipo de repuesto: {item.tipoRepuesto}</div>}
                             </div>
                             );
                           })}
                      </div>
                    </div>
                  )}
                  
                  {service.notes && (
                    <div className="text-sm">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Notas:</span>
                          <p className="mt-1 text-xs bg-muted/50 p-2 rounded">{service.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Creado: {format(new Date(service.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                      <div className="text-lg font-semibold text-primary">
                        Total: {formatCurrency(service.total_amount)}
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            ⚠️ Pendiente de completar
                          </div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            El cliente debe definir método de pago, monto entregado y firma.
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {onEditService && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditService(service.id);
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Completar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(service.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PendingServicesPanel;
