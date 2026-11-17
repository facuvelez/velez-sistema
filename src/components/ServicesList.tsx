
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Car, DollarSign, Search, Download } from "lucide-react";
import { generateInvoicePDF } from "@/utils/invoiceGenerator";
import EditServiceForm from "./EditServiceForm";

import { Client, Service } from '@/types/shared';

interface ServicesListProps {
  services: Service[];
  clients: Client[];
  setServices: (services: Service[]) => void;
}

const ServicesList = ({ services, clients, setServices }: ServicesListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingService, setEditingService] = useState<Service | null>(null);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Cliente Desconocido";
  };

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const handleDownloadInvoice = (service: Service) => {
    const client = getClient(service.clientId);
    if (client && service.status === 'paid') {
      generateInvoicePDF(service, client);
    }
  };

  const handleEditService = (updatedService: any) => {
    setServices(services.map(service => 
      service.id === updatedService.id ? updatedService : service
    ));
    setEditingService(null);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      getClientName(service.clientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || service.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'partial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'partial': return 'Parcial';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar servicios por cliente, tipo o vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoComplete="off"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 z-50">
              <SelectItem value="all">Todos los Servicios</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg dark:text-white">{service.type}</CardTitle>
                    <CardDescription className="dark:text-gray-300">{getClientName(service.clientId)}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {getStatusText(service.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-blue-500 dark:text-white" />
                  <span>{new Date(service.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                  <Car className="h-4 w-4 text-purple-500" />
                  <span>{service.vehicle}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">${service.amount}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ({service.paymentMethod}
                    {service.secondaryPaymentMethod && `, ${service.secondaryPaymentMethod}`})
                  </span>
                </div>

                {service.notes && (
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <p className="text-gray-700 dark:text-gray-200">{service.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditingService(service)}
                  >
                    Editar Servicio
                  </Button>
                  
                  {service.status === 'paid' ? (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleDownloadInvoice(service)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar Factura
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1">
                          <Button 
                            size="sm" 
                            className="w-full bg-gray-400 cursor-not-allowed"
                            disabled
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar Factura
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Disponible solo cuando el servicio esté completamente pagado</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg dark:text-gray-400">No se encontraron servicios</p>
            <p className="text-gray-400 dark:text-gray-500">Intente ajustar los términos de búsqueda o filtros</p>
          </div>
        )}

        {/* Edit Service Modal */}
        {editingService && (
          <EditServiceForm 
            service={editingService as any}
            onClose={() => setEditingService(null)}
            onSave={(updatedService: any) => handleEditService(updatedService)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default ServicesList;
