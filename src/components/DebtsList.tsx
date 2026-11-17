import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, DollarSign, FileText, Download, Eye, Calendar, Search, Ban, Info } from "lucide-react";
import PaymentTracker from "./PaymentTracker";
import { generateDebtReceiptPDF } from "@/utils/debtReceiptGenerator";
import { formatCurrency } from "@/utils/numberFormatter";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { supabase } from "@/integrations/supabase/client";

import { Client, Service, Debt, Payment } from '@/types/shared';

interface DebtsListProps {
  debts: Debt[];
  clients: Client[];
  services: Service[];
  payments: Payment[];
  originalDebts: any[]; // Original debt data with UUIDs
  setDebts: (debts: Debt[]) => void;
  setPayments: (payments: Payment[]) => void;
  onAddPayment: (paymentData: { debt_id: string; amount: number; payment_method: any; payment_date: string; notes?: string }) => Promise<any>;
}

const DebtsList = ({ debts, clients, services, payments, originalDebts, setDebts, setPayments, onAddPayment }: DebtsListProps) => {
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUncollectible, setShowUncollectible] = useState(false);
  const [sortBy, setSortBy] = useState<"urgency" | "amount">("urgency");

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getService = (serviceId: string) => {
    return services.find(s => s.id === serviceId);
  };

  const getServiceDetails = (service: Service | undefined) => {
    if (!service?.serviceItems) {
      return { 
        serviceText: service?.type || '', 
        hasQuantity: false 
      };
    }
    
    try {
      const items = Array.isArray(service.serviceItems) ? service.serviceItems : [];
      
      if (items.length === 0) {
        return { 
          serviceText: service.type, 
          hasQuantity: false 
        };
      }
      
      // If there's only one item, show type with quantity
      if (items.length === 1) {
        const item = items[0];
        const quantity = item.quantity || 0;
        return {
          serviceText: quantity > 0 ? `${item.type} (${quantity})` : item.type,
          hasQuantity: quantity > 0
        };
      }
      
      // If there are multiple items, show them as a list
      const servicesList = items.map(item => {
        const quantity = item.quantity || 0;
        return quantity > 0 ? `${item.type} (${quantity})` : item.type;
      }).join(', ');
      
      return {
        serviceText: servicesList,
        hasQuantity: items.some(item => (item.quantity || 0) > 0)
      };
    } catch (error) {
      return { 
        serviceText: service.type, 
        hasQuantity: false 
      };
    }
  };

  const getDebtPayments = (debtId: string) => {
    return payments.filter(p => p.debtId === debtId);
  };

  const getRemainingBalance = (debt: Debt) => {
    const debtPayments = getDebtPayments(debt.id);
    const totalPaid = debtPayments.reduce((sum, payment) => sum + payment.amount, 0);
    return debt.amount - totalPaid;
  };

  const getDebtStatus = (debt: Debt) => {
    // If debt is manually marked as uncollectible, return special status
    if (debt.status === 'uncollectible') {
      return { status: 'uncollectible', label: 'Incobrable', variant: 'destructive' as const };
    }

    // Find the corresponding service to get the service date
    const correspondingService = services.find(service => service.id === debt.serviceId);
    if (!correspondingService) {
      return { status: 'current', label: 'Al día', variant: 'secondary' as const };
    }
    
    const serviceDate = new Date(correspondingService.date);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - serviceDate.getFullYear()) * 12 + (today.getMonth() - serviceDate.getMonth());
    
    // Auto-mark as uncollectible after 18 months
    if (monthsDiff >= 18) {
      return { status: 'uncollectible', label: 'Incobrable', variant: 'destructive' as const };
    } 
    // Mark as past due (Vencidas) after 3 months - very overdue
    else if (monthsDiff >= 3) {
      return { status: 'pastdue', label: 'Vencida', variant: 'destructive' as const };
    }
    // Mark as overdue (Por Vencer) between 1-2 months
    else if (monthsDiff >= 1) {
      return { status: 'overdue', label: 'Por Vencer', variant: 'destructive' as const };
    }
    // Current/good standing
    else {
      return { status: 'current', label: 'Al día', variant: 'secondary' as const };
    }
  };

  const sendWhatsAppReminder = (clientId: string, debt: Debt) => {
    const client = getClient(clientId);
    if (!client) return;

    const service = getService(debt.serviceId);
    const remainingBalance = getRemainingBalance(debt);
    
    // Check if it's a service or product based on category
    const isProduct = (service as any)?.category === 'venta';
    const category = isProduct ? 'Producto' : 'Servicio';
    
    // Get the first service item for additional details
    const serviceItems = (service as any)?.service_items || [];
    const firstItem = serviceItems.length > 0 ? serviceItems[0] : null;
    
    // Build the message with the new format
    let message = `Hola ${client.firstName}, como estas? 😎\n`;
    message += `Te enviamos un recordatorio de saldo pendiente, agradeceríamos que puedas ponerte al día cuando te sea posible.\n`;
    message += `Para cualquier consulta, no dudes en contactarnos.\n`;
    message += `¡Gracias por confiar en nosotros!\n\n`;
    
    message += `- ${category}: ${service?.type || 'N/A'}\n`;
    
    // Add brand if available
    if (firstItem) {
      const brand = firstItem.marca || firstItem.marcaRepuesto;
      if (brand) {
        message += `- Marca: ${brand}\n`;
      }
      
      // Add quantity if available
      if (firstItem.quantity) {
        message += `- Cantidad: ${firstItem.quantity}\n`;
      }
    }
    
    message += `- Vehículo: ${service?.vehicle || 'N/A'}\n`;
    message += `- Monto total: ${formatCurrency(debt.amount)}\n`;
    message += `- Saldo pendiente: ${formatCurrency(remainingBalance)}`;
    
    const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleAddPayment = async (payment: Omit<Payment, 'id'>) => {
    // Find the original debt UUID for the database using the uuidToNumber hash
    const uuidToNumber = (uuid: string) => {
      let hash = 0;
      for (let i = 0; i < uuid.length; i++) {
        const char = uuid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };

    // Find original debt by matching the debt ID directly
    const originalDebt = originalDebts.find(d => d.id === payment.debtId);
    if (!originalDebt) return;

    try {
      await onAddPayment({
        debt_id: originalDebt.id,
        amount: payment.amount,
        payment_method: payment.paymentMethod as any,
        payment_date: payment.date,
        notes: payment.notes || undefined
      });
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const handleDownloadReceipt = async (debt: Debt) => {
    try {
      const client = getClient(debt.clientId);
      if (!client) {
        console.error('Client not found');
        return;
      }
      
      // Fetch service directly from database to ensure we have latest data including signature_data
      const { data: service, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', debt.serviceId)
        .single();
      
      if (error || !service) {
        console.error('Error fetching service:', error);
        return;
      }
      
      // Find payments for this specific debt
      const debtPayments = getDebtPayments(debt.id);
      
      // Transform payments to the format expected by the PDF generator
      const formattedPayments = debtPayments.map(payment => ({
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        date: payment.date
      }));

      // Create enriched debt object with service signature
      const enrichedDebt = {
        ...debt,
        signature: service.signature_data || undefined
      };

      // Create enriched service object with all required data
      const enrichedService = {
        id: service.id,
        type: service.service_type,
        date: service.service_date,
        vehicle: service.vehicle_info || '',
        notes: service.notes || '',
        paymentMethod: service.payment_method,
        secondaryPaymentMethod: service.secondary_payment_method,
        amountDelivered: service.amount_delivered,
        responsiblePerson: service.responsible_person,
        companyRepresentative: service.company_representative,
        service_items: service.service_items as any
      };
      
      await generateDebtReceiptPDF(enrichedDebt, client, enrichedService, formattedPayments);
    } catch (error) {
      console.error('Error in handleDownloadReceipt:', error);
    }
  };

  // Filter debts based on search term and uncollectible toggle
  const filteredDebts = debts.filter(debt => {
    // Filter by uncollectible status first
    if (!showUncollectible && debt.status === 'uncollectible') return false;
    
    if (!searchTerm.trim()) return true;
    
    const client = getClient(debt.clientId);
    const service = getService(debt.serviceId);
    
    if (!client || !service) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const clientName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const serviceType = service.type.toLowerCase();
    const vehicle = service.vehicle?.toLowerCase() || '';
    
    return clientName.includes(searchLower) || 
           serviceType.includes(searchLower) || 
           vehicle.includes(searchLower);
  });

  // Calculate stats (excluding uncollectible debts from overdue/due soon counts)
  const activeDebts = filteredDebts.filter(d => d.status !== 'uncollectible');
  const pastDueDebts = activeDebts.filter(d => getDebtStatus(d).status === 'pastdue');
  const overdueDebts = activeDebts.filter(d => getDebtStatus(d).status === 'overdue');
  const uncollectibleDebts = filteredDebts.filter(d => getDebtStatus(d).status === 'uncollectible');
  const totalAmount = activeDebts.reduce((sum, debt) => sum + getRemainingBalance(debt), 0);

  // Group debts by client
  const debtsByClient = filteredDebts.reduce((groups: { [key: number]: Debt[] }, debt) => {
    const clientId = debt.clientId;
    if (!groups[clientId]) {
      groups[clientId] = [];
    }
    groups[clientId].push(debt);
    return groups;
  }, {});

  // Sort clients by debt priority or amount
  const sortedClientGroups = Object.entries(debtsByClient).sort(([clientIdA, debtsA], [clientIdB, debtsB]) => {
    if (sortBy === "amount") {
      // Sort by total debt amount (higher first)
      const totalA = debtsA.reduce((sum, debt) => sum + getRemainingBalance(debt), 0);
      const totalB = debtsB.reduce((sum, debt) => sum + getRemainingBalance(debt), 0);
      return totalB - totalA;
    } else {
      // Sort by urgency/priority
      const getHighestPriority = (debts: Debt[]) => {
        const priorities = debts.map(debt => {
          const status = getDebtStatus(debt);
          // When showing uncollectible, prioritize them at the top
          const statusPriority = showUncollectible 
            ? { 'uncollectible': 6, 'overdue': 5, 'pastdue': 4, 'current': 2 }
            : { 'overdue': 5, 'pastdue': 4, 'current': 2, 'uncollectible': 1 };
          return statusPriority[status.status] || 1;
        });
        return Math.max(...priorities);
      };
      
      return getHighestPriority(debtsB) - getHighestPriority(debtsA);
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Info Tooltip */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">Gestión de Deudas</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm p-4">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-sm">Al día</p>
                  <p className="text-xs text-muted-foreground">Deudas con menos de 1 mes desde la fecha del servicio.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm">Por Vencer</p>
                  <p className="text-xs text-muted-foreground">Deudas entre 1 y 2 meses desde la fecha del servicio.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm">Vencida</p>
                  <p className="text-xs text-muted-foreground">Deudas con 3 o más meses (hasta 17 meses) desde el servicio. Requieren atención urgente.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm">Incobrable</p>
                  <p className="text-xs text-muted-foreground">Deudas con 18+ meses desde el servicio o marcadas manualmente como incobrables.</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Search Bar and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar deudas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(value: "urgency" | "amount") => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px] text-sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgency">Por urgencia</SelectItem>
            <SelectItem value="amount">Por monto total</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-2 justify-end sm:justify-start">
          <Switch
            id="show-uncollectible"
            checked={showUncollectible}
            onCheckedChange={setShowUncollectible}
          />
          <Label htmlFor="show-uncollectible" className="text-xs sm:text-sm whitespace-nowrap">
            Mostrar incobrables
          </Label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">{pastDueDebts.length}</div>
            <div className="text-xs sm:text-sm text-red-600 dark:text-red-300">Vencidas</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400">{overdueDebts.length}</div>
            <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-300">Por vencer</div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-400">{uncollectibleDebts.length}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">Incobrables</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{activeDebts.length}</div>
            <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">Activas</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 sm:col-span-1 col-span-2">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalAmount)}</div>
            <div className="text-xs sm:text-sm text-green-600 dark:text-green-300">Total pendiente</div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Debt List - Compact Design */}
      <div className="space-y-2 sm:space-y-3">
        {sortedClientGroups.length === 0 ? (
          <Card className="dark:bg-gray-800/50 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">No hay deudas pendientes</p>
            </CardContent>
          </Card>
        ) : (
          sortedClientGroups.map(([clientId, clientDebts]) => {
            const client = getClient(clientId);
            if (!client) return null;

            // Sort debts within each client group by priority (uncollectible at bottom)
            const sortedClientDebts = clientDebts.sort((a, b) => {
              const statusA = getDebtStatus(a);
              const statusB = getDebtStatus(b);
              const statusPriority = { 'overdue': 3, 'current': 2, 'uncollectible': 1 };
              return (statusPriority[statusB.status] || 1) - (statusPriority[statusA.status] || 1);
            });

            const clientTotalDebt = clientDebts.filter(d => d.status === 'active').reduce((sum, debt) => sum + getRemainingBalance(debt), 0);
            const mostUrgentStatus = sortedClientDebts.find(d => d.status === 'active') ? getDebtStatus(sortedClientDebts.find(d => d.status === 'active')!) : null;

            return (
              <Card 
                key={clientId} 
                className={`dark:bg-gray-800/50 dark:border-gray-700 hover:shadow-md transition-all animate-fade-in ${
                  mostUrgentStatus?.status === 'overdue' 
                    ? 'border-l-4 border-l-orange-500' 
                    : mostUrgentStatus?.status === 'uncollectible'
                    ? 'border-l-4 border-l-gray-500'
                    : 'border-l-4 border-l-green-500'
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Compact Client Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {client.firstName} {client.lastName}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-0.5"
                      >
                        {clientDebts.length} deuda{clientDebts.length > 1 ? 's' : ''}
                      </Badge>
                      {mostUrgentStatus && (
                        <Badge variant={mostUrgentStatus.variant} className="text-xs px-2 py-0.5">
                          {mostUrgentStatus.label}
                        </Badge>
                      )}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(clientTotalDebt)}
                    </div>
                  </div>

                  {/* Compact Debt Details */}
                  <div className="space-y-2">
                     {sortedClientDebts.map((debt) => {
                       const service = getService(debt.serviceId);
                       const status = getDebtStatus(debt);
                       const remainingBalance = getRemainingBalance(debt);
                       const hasSignature = service?.signature || debt.signature;
                       const isUncollectible = debt.status === 'uncollectible';

                       if (!service) return null;

                       return (
                          <div key={debt.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg transition-colors ${
                            isUncollectible 
                              ? 'bg-gray-100 dark:bg-gray-800/30 opacity-60' 
                              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}>
                            {/* Service Info - Compact */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className={`font-medium text-xs sm:text-sm truncate ${
                                  isUncollectible 
                                    ? 'text-gray-500 dark:text-gray-400' 
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {service.type}
                                </span>
                                <Badge variant={status.variant} className="text-[10px] sm:text-xs px-1.5 py-0">
                                  {status.label}
                                </Badge>
                                {hasSignature && (
                                  <Badge variant="outline" className="text-[10px] sm:text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-300 px-1.5 py-0">
                                    <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                    Firmado
                                  </Badge>
                                )}
                                {isUncollectible && (
                                  <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0">
                                    <Ban className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                    No Confiable
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  {new Date(service.date).toLocaleDateString()}
                                </span>
                                {service.vehicle && (
                                  <span className="truncate">{service.vehicle}</span>
                                )}
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                              <div className="text-left sm:text-right">
                                <div className={`font-bold text-sm sm:text-base ${
                                  isUncollectible 
                                    ? 'text-gray-500 dark:text-gray-400 line-through' 
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {formatCurrency(remainingBalance)}
                                </div>
                              </div>
                              
                               <div className="flex items-center gap-1">
                                 {!isUncollectible && client.phone && (
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => sendWhatsAppReminder(debt.clientId, debt)}
                                     className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                   >
                                     <img src={whatsappIcon} alt="WhatsApp" className="h-3 w-3 sm:h-[14px] sm:w-[14px]" />
                                   </Button>
                                 )}
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                      onClick={() => setSelectedDebt(debt)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                 <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Gestión de Deuda - {client.firstName} {client.lastName}</DialogTitle>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    {/* Debt Info */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Servicio</p>
                                        <p className="font-medium">{getServiceDetails(service).serviceText}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Fecha</p>
                                        <p className="font-medium">{new Date(service.date).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Vehículo</p>
                                        <p className="font-medium">{service.vehicle || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Monto original</p>
                                        <p className="font-medium">{formatCurrency(debt.amount)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Saldo pendiente</p>
                                        <p className="font-bold text-red-600">{formatCurrency(remainingBalance)}</p>
                                      </div>
                                    </div>

                                    {/* Client Signature */}
                                    {hasSignature && (
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Firma del Cliente</h4>
                                        <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                                          <img 
                                            src={service.signature || debt.signature} 
                                            alt="Firma del cliente" 
                                            className="max-w-full h-auto"
                                            style={{ maxHeight: '150px' }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Payment Tracker */}
                                    <PaymentTracker
                                      debtId={debt.id}
                                      totalAmount={debt.amount}
                                      payments={getDebtPayments(debt.id)}
                                      onAddPayment={handleAddPayment}
                                      clientId={(() => {
                                        const uuidToNumber = (uuid: string) => {
                                          let hash = 0;
                                          for (let i = 0; i < uuid.length; i++) {
                                            const char = uuid.charCodeAt(i);
                                            hash = ((hash << 5) - hash) + char;
                                            hash = hash & hash; // Convert to 32bit integer
                                          }
                                          return Math.abs(hash);
                                        };
                                        const originalDebt = originalDebts.find(od => od.id === debt.id);
                                        return originalDebt?.client_id;
                                      })()}
                                      serviceId={(() => {
                                        const uuidToNumber = (uuid: string) => {
                                          let hash = 0;
                                          for (let i = 0; i < uuid.length; i++) {
                                            const char = uuid.charCodeAt(i);
                                            hash = ((hash << 5) - hash) + char;
                                            hash = hash & hash; // Convert to 32bit integer
                                          }
                                          return Math.abs(hash);
                                        };
                                        const originalDebt = originalDebts.find(od => od.id === debt.id);
                                        return originalDebt?.service_id;
                                      })()}
                                    />

                                     {/* Action Buttons */}
                                     <div className="flex gap-2 flex-wrap">
                                       <Button
                                         variant="outline"
                                         onClick={() => handleDownloadReceipt(debt)}
                                         className="flex-1"
                                       >
                                         <Download className="h-4 w-4 mr-2" />
                                         Descargar Comprobante
                                       </Button>
                                       {!debt.status || debt.status === 'active' ? (
                                          <>
                                            {client.phone && (
                                              <Button
                                                variant="outline"
                                                onClick={() => sendWhatsAppReminder(debt.clientId, debt)}
                                                className="flex-1"
                                              >
                                                <img src={whatsappIcon} alt="WhatsApp" className="h-[18px] w-[18px] mr-2" />
                                                Enviar Recordatorio
                                              </Button>
                                            )}
                                          </>
                                       ) : (
                                         <Badge variant="destructive" className="px-4 py-2">
                                           <Ban className="h-4 w-4 mr-2" />
                                           Deuda Incobrable
                                         </Badge>
                                       )}
                                     </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DebtsList;