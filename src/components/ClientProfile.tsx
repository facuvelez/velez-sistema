import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { ArrowLeft, Phone, Mail, MapPin, MessageCircle, Plus, Car, Calendar, DollarSign, AlertTriangle, Download, ChevronDown, ChevronUp, Send, Edit, CreditCard, Clock, TrendingUp, TrendingDown, Minus, AlertCircle, Building, User, ShoppingCart, Wrench } from "lucide-react";
import { generateDebtReceiptPDF } from "@/utils/debtReceiptGenerator";
import { generateInvoicePDF } from "@/utils/invoiceGenerator";
import { formatCurrency } from "@/utils/numberFormatter";
import { useToast } from "@/hooks/use-toast";
import { useCheques } from "@/hooks/useCheques";
import { calculateReliabilityScore } from "@/utils/reliabilityScore";
import PaymentTracker from "./PaymentTracker";
import ClientAppointmentHistory from "./clients/ClientAppointmentHistory";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from 'date-fns';
import whatsappWhiteIcon from "@/assets/whatsapp-white-icon.png";

import { Client, Service, Debt, Payment, PaymentPlan } from '@/types/shared';

interface ClientProfileProps {
  clients: Client[];
  services: Service[];
  debts: Debt[];
  payments: Payment[];
  paymentPlans: PaymentPlan[];
  onAddService: () => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onAddPaymentPlan: () => void;
  setPaymentPlans: React.Dispatch<React.SetStateAction<PaymentPlan[]>>;
  selectedClientId?: string;
  onEditClient?: (client: Client) => void;
}

const ClientProfile = ({ clients, services, debts, payments, paymentPlans, onAddService, onAddPayment, onAddPaymentPlan, setPaymentPlans, selectedClientId, onEditClient }: ClientProfileProps) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getChequesByServiceId, getChequesByDebtPaymentId } = useCheques();
  const [expandedDebts, setExpandedDebts] = useState<string[]>([]);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [selectedCheque, setSelectedCheque] = useState<any>(null);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<any>(null);
  
  // Use selectedClientId prop if provided, otherwise fall back to URL param
  const client = selectedClientId 
    ? clients.find(c => c.id === selectedClientId)
    : clients.find(c => c.id === clientId);
  
  console.log('=== DEBUG: ClientProfile Data ===');
  console.log('Selected client ID:', selectedClientId);
  console.log('URL client ID:', clientId);
  console.log('Available clients:', clients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })));
  console.log('Found client:', client);
  console.log('Services count:', services.length);
  console.log('Debts count:', debts.length);
  console.log('Payments count:', payments.length);
  
  // Calculate oldest active debt
  const getOldestDebt = () => {
    if (!client) return null;
    
    const clientDebts = debts.filter(debt => debt.clientId === client.id && debt.remainingAmount > 0);
    if (clientDebts.length === 0) return null;
    
    // Find the service with the oldest date that has an active debt
    const oldestDebt = clientDebts.reduce((oldest, debt) => {
      const debtService = services.find(s => s.id === debt.serviceId);
      const oldestService = services.find(s => s.id === oldest.serviceId);
      
      if (!debtService || !oldestService) return oldest;
      
      return new Date(debtService.date) < new Date(oldestService.date) ? debt : oldest;
    });
    
    const debtService = services.find(s => s.id === oldestDebt.serviceId);
    if (!debtService) return null;
    
    const daysOld = differenceInDays(new Date(), new Date(debtService.date));
    
    return {
      daysOld,
      amount: oldestDebt.remainingAmount,
      serviceDate: debtService.date,
      serviceType: debtService.type
    };
  };
  
  const oldestDebt = getOldestDebt();

  if (!client) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h2>
          <Button onClick={() => navigate('/?tab=clients')}>Volver a Clientes</Button>
        </div>
      </div>
    );
  }

  const clientServices = services.filter(s => s.clientId === client.id);
  const clientDebts = debts.filter(d => d.clientId === client.id);
  const clientPaymentPlans = paymentPlans.filter(p => p.clientId === client.id);
  
  console.log('=== DEBUG: Filtered Data ===');
  console.log('All debts from props:', debts);
  console.log('Client services:', clientServices.map(s => ({ id: s.id, status: s.status, type: s.type })));
  console.log('Client debts:', clientDebts.map(d => ({ 
    id: d.id, 
    serviceId: d.serviceId, 
    amount: d.amount, 
    remainingAmount: d.remainingAmount,
    status: d.status 
  })));
  console.log('Client payments:', payments.filter(p => {
    const debt = clientDebts.find(d => d.id === p.debtId);
    return debt?.clientId === client.id;
  }).map(p => ({ id: p.id, debtId: p.debtId, amount: p.amount, date: p.date })));
  
  // Filter uncollectible debts for this client
  const uncollectibleDebts = clientDebts.filter(d => d.status === 'uncollectible');
  
  // Debug logging for reliability score inconsistencies
  if (client && (client.firstName === 'Velez' || client.firstName.includes('Velez'))) {
    console.log('=== DEBUG: ClientProfile - Velez Client ===');
    console.log('Client:', client.firstName, client.lastName);
    console.log('Client services:', clientServices.length);
    console.log('Client debts:', clientDebts.length);
    console.log('Filtered payments:', payments.filter(p => {
      const debt = clientDebts.find(d => d.id === p.debtId);
      return debt !== undefined && debt.clientId === client.id;
    }).length);
    console.log('Uncollectible debts:', uncollectibleDebts.length);
    console.log('Services data:', clientServices.map(s => ({ id: s.id, status: s.status, date: s.date })));
    console.log('Debts data:', clientDebts.map(d => ({ id: d.id, status: d.status, remainingAmount: d.remainingAmount })));
    console.log('Payments data:', payments.filter(p => {
      const debt = clientDebts.find(d => d.id === p.debtId);
      return debt !== undefined && debt.clientId === client.id;
    }).map(p => ({ id: p.id, debtId: p.debtId, amount: p.amount, date: p.date })));
  }
  
  // Calculate reliability score with CORRECTED payment mapping
  const reliabilityScore = calculateReliabilityScore(
    clientServices.map(s => ({
      id: s.id,
      date: s.date,
      status: s.status as 'pending' | 'partial' | 'paid',
      amount: s.amount,
      amountDelivered: s.amountDelivered || 0
    })),
    payments.filter(p => {
      const debt = clientDebts.find(d => d.id === p.debtId);
      return debt !== undefined && debt.clientId === client.id;
    }).map(p => {
      const debt = clientDebts.find(d => d.id === p.debtId);
      return {
        serviceId: debt?.serviceId || p.debtId, // Use actual serviceId from debt
        date: p.date,
        amount: p.amount
      };
    }),
    uncollectibleDebts.map(d => ({
      id: d.id.toString(),
      service_id: d.serviceId.toString(),
      status: 'uncollectible' as const
    }))
  );

  // Debug logging for reliability score result
  if (client && (client.firstName === 'Velez' || client.firstName.includes('Velez'))) {
    console.log('ClientProfile reliability score result:', reliabilityScore);
    console.log('=== END DEBUG: ClientProfile ===');
  }
  
  // Calculate average payment delay for services that had debts and were fully paid
  const calculateAveragePaymentDelay = () => {
    console.log('=== DEBUG: Average Payment Delay Calculation (Corrected Logic) ===');
    
    // Only consider services that HAD debts (not immediate cash payments)
    const servicesWithDebts = clientServices.filter(service => {
      const serviceDebt = clientDebts.find(d => d.serviceId === service.id);
      return serviceDebt !== undefined; // Service had/has a debt record
    });
    
    console.log('Services with debts:', servicesWithDebts.map(s => ({ id: s.id, status: s.status, type: s.type })));
    
    // From those, only take the ones that are now fully paid
    const fullyPaidServicesWithDebts = servicesWithDebts.filter(s => s.status === 'paid');
    console.log('Fully paid services (that had debts):', fullyPaidServicesWithDebts.length);
    
    if (fullyPaidServicesWithDebts.length === 0) {
      console.log('No services with debts that are fully paid - returning null');
      return null;
    }

    const paymentDelays = fullyPaidServicesWithDebts.map(service => {
      console.log(`\n--- Processing service ${service.id}: ${service.type} ---`);
      console.log('Service date:', service.date);
      
      // Find the debt for this service
      const serviceDebt = clientDebts.find(d => d.serviceId === service.id);
      console.log('Service debt:', serviceDebt);
      
      // Find all payments for this debt
      const debtPayments = payments.filter(p => {
        const debt = clientDebts.find(d => d.id === p.debtId);
        return debt?.serviceId === service.id;
      });
      console.log('Debt payments:', debtPayments);
      
      if (debtPayments.length === 0) {
        console.log('No payments found - this should not happen for paid services');
        return 0;
      }

      // Sort payments by date to find when debt was fully settled
      const sortedPayments = debtPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let cumulativeAmount = 0;
      let fullPaymentDate = null;
      
      for (const payment of sortedPayments) {
        cumulativeAmount += payment.amount;
        console.log(`Payment on ${payment.date}: $${payment.amount} (cumulative: $${cumulativeAmount} / debt: $${serviceDebt.amount})`);
        
        if (cumulativeAmount >= serviceDebt.amount) {
          fullPaymentDate = payment.date;
          console.log(`Debt fully paid on: ${fullPaymentDate}`);
          break;
        }
      }
      
      if (!fullPaymentDate) {
        console.log('Could not determine full payment date');
        return 0;
      }

      // Calculate days between service date and full payment date
      const serviceDate = new Date(service.date);
      const paymentDate = new Date(fullPaymentDate);
      const diffTime = paymentDate.getTime() - serviceDate.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      console.log(`Service: ${service.date} → Full payment: ${fullPaymentDate} = ${diffDays} days`);
      
      return diffDays;
    });

    console.log('\n=== SUMMARY ===');
    console.log('Payment delays array:', paymentDelays);
    
    if (paymentDelays.length === 0) {
      return null;
    }
    
    const totalDays = paymentDelays.reduce((sum, days) => sum + days, 0);
    const average = Math.round(totalDays / paymentDelays.length * 100) / 100; // Round to 2 decimals
    
    console.log(`Total days: ${totalDays}`);
    console.log(`Services counted: ${paymentDelays.length}`);
    console.log(`Average payment delay: ${average} days`);
    
    return average;
  };

  const averagePaymentDelay = calculateAveragePaymentDelay();
  
  // Get color class for payment delay
  const getPaymentDelayColor = (days: number) => {
    if (days <= 5) {
      return "text-green-600 dark:text-green-400";
    } else if (days <= 15) {
      return "text-orange-600 dark:text-orange-400";
    } else {
      return "text-red-600 dark:text-red-400";
    }
  };
  
  // Use debt data directly from database with remaining amounts
  const debtBalances = clientDebts.map(debt => {
    const debtPayments = payments.filter(p => p.debtId === debt.id);
    return {
      ...debt,
      remainingBalance: debt.remainingAmount, // Use database value
      payments: debtPayments
    };
  });

  // Function to determine debt status based on service date
  const getDebtStatus = (debt: Debt) => {
    const correspondingService = services.find(service => service.id === debt.serviceId);
    if (!correspondingService) return debt.status;
    
    const serviceDate = new Date(correspondingService.date);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - serviceDate.getFullYear()) * 12 + (today.getMonth() - serviceDate.getMonth());
    
    // If debt has remaining balance and service is older than 6 months, mark as overdue
    if (debt.remainingAmount > 0 && monthsDiff >= 6) {
      return 'overdue';
    }
    
    return debt.status;
  };

  const outstandingDebts = debtBalances.filter(debt => debt.remainingBalance > 0);
  const totalOutstanding = outstandingDebts.reduce((sum, debt) => sum + debt.remainingBalance, 0);

  // Extract unique vehicles from services
  const vehicles = [...new Set(clientServices.map(s => s.vehicle).filter(v => v && v.trim() !== ''))];

  const handleWhatsAppClick = () => {
    const message = `Hola ${client.firstName}, espero que estés bien. Te contacto desde nuestro taller para cualquier consulta que puedas tener.`;
    const phoneNumber = client.phone.replace(/\D/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendReceiptWhatsApp = (debt: Debt) => {
    if (!client.phone) {
      toast({
        title: "Error",
        description: "El cliente no tiene número de teléfono registrado",
        variant: "destructive"
      });
      return;
    }

    const service = services.find(s => s.id === debt.serviceId);
    const debtBalance = debtBalances.find(d => d.id === debt.id);
    
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
    message += `- Monto total: ${formatCurrency(service?.amount || debt.amount)}\n`;
    
    if (debtBalance && debtBalance.remainingBalance > 0) {
      message += `- Saldo pendiente: ${formatCurrency(debtBalance.remainingBalance)}`;
    } else {
      message += `- Estado: Pagado completamente`;
    }

    const phoneNumber = client.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp abierto",
      description: "Se ha abierto WhatsApp con el mensaje del comprobante"
    });
  };

  const handleSendReceiptEmail = (debt: Debt) => {
    if (!client.email) {
      toast({
        title: "Error",
        description: "El cliente no tiene email registrado",
        variant: "destructive"
      });
      return;
    }

    const service = services.find(s => s.id === debt.serviceId);
    const debtBalance = debtBalances.find(d => d.id === debt.id);
    const serviceItems = (service as any)?.service_items || [];
    const firstItem = serviceItems.length > 0 ? serviceItems[0] : null;
    
    const subject = `Recordatorio de saldo pendiente - ${client.firstName} ${client.lastName}`;
    
    let body = `Hola ${client.firstName}, como estas? 😎\n`;
    body += `Te enviamos un recordatorio de saldo pendiente, agradeceríamos que puedas ponerte al día cuando te sea posible.\n`;
    body += `Para cualquier consulta, no dudes en contactarnos.\n`;
    body += `¡Gracias por confiar en nosotros!\n\n`;
    
    if (service) {
      // Determine if it's a product or service based on the type
      const isProduct = service.type.toLowerCase().includes('neumático') || 
                       service.type.toLowerCase().includes('llanta') || 
                       service.type.toLowerCase().includes('producto') ||
                       service.type.toLowerCase().includes('repuesto');
      
      // Always show the type (Product or Service)
      body += `- Tipo de ${isProduct ? 'Producto' : 'servicio'}: ${service.type}\n`;
      
      // Add marca if it exists
      if (firstItem?.marca) {
        body += `- Marca: ${firstItem.marca}\n`;
      }
      
      // Add additional fields if they exist
      if (firstItem?.modelo) {
        body += `- Modelo: ${firstItem.modelo}\n`;
      }
      
      if (firstItem?.medida) {
        body += `- Medida: ${firstItem.medida}\n`;
      }
      
      // Use actual quantity from service items if available
      if (firstItem?.quantity) {
        body += `- Cantidad: ${firstItem.quantity}\n`;
      } else {
        body += `- Cantidad: 1\n`; // Default to 1 if not specified
      }
      
      // Add unit price if available
      if (firstItem?.unitPrice) {
        body += `- P. Unit: ${formatCurrency(typeof firstItem.unitPrice === 'string' ? parseFloat(firstItem.unitPrice) : firstItem.unitPrice)}\n`;
      }
      
      body += `- Vehículo: ${service.vehicle}\n`;
    }
    
    body += `- Monto total: ${formatCurrency(service?.amount || debt.amount)}\n`;
    if (debtBalance && debtBalance.remainingBalance > 0) {
      body += `- Saldo pendiente: ${formatCurrency(debtBalance.remainingBalance)}\n`;
    }

    const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    
    toast({
      title: "Email abierto",
      description: "Se ha abierto su cliente de email con el comprobante"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'partial': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'transfer': return 'Transferencia';
      case 'card': return 'Tarjeta';
      case 'check': return 'Cheque';
      default: return method;
    }
  };

  const formatCuitCuil = (taxId: string) => {
    if (!taxId) return '';
    // Remove any existing formatting
    const cleanTaxId = taxId.replace(/[-\s]/g, '');
    // Add proper formatting: XX-XXXXXXXX-X
    if (cleanTaxId.length === 11) {
      return `${cleanTaxId.slice(0, 2)}-${cleanTaxId.slice(2, 10)}-${cleanTaxId.slice(10)}`;
    }
    return taxId; // Return original if not 11 digits
  };

  const toggleDebtExpansion = (debtId: string) => {
    setExpandedDebts(prev => 
      prev.includes(debtId) 
        ? prev.filter(id => id !== debtId)
        : [...prev, debtId]
    );
  };

  const toggleServiceExpansion = (serviceId: string) => {
    setExpandedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleDownloadReceipt = async (debt: Debt) => {
    try {
      console.log('=== DEBUG FIRMA ===');
      console.log('Debt service ID:', debt.serviceId);
      
      // Fetch service directly from database to ensure we have latest data including signature_data
      const { data: service, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', debt.serviceId)
        .single();
      
      if (error) {
        console.error('Error fetching service:', error);
        toast({
          title: "Error",
          description: "No se pudo obtener la información del servicio",
          variant: "destructive",
        });
        return;
      }
      
      if (!service) {
        console.error('Service not found');
        return;
      }
      
      console.log('Service found:', service.id);
      console.log('Service signature_data exists:', !!service.signature_data);
      console.log('Service signature_data length:', service.signature_data?.length || 0);
      console.log('Service signature_data preview:', service.signature_data?.substring(0, 50));
      
      // Find payments for this specific debt
      const debtPayments = payments.filter(p => p.debtId === debt.id);
      
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
      
      console.log('Enriched debt signature exists:', !!enrichedDebt.signature);
      console.log('Enriched debt signature length:', enrichedDebt.signature?.length || 0);

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
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  const handleDownloadServiceInvoice = (service: Service) => {
    // Find related payments for this service through debts
    const serviceDebt = debtBalances.find(d => d.serviceId === service.id);
    const servicePayments = serviceDebt ? serviceDebt.payments : [];
    
    // Map payments to the format expected by the invoice generator
    const mappedPayments = servicePayments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      date: payment.date,
      notes: payment.notes
    }));
    
    // Map service to include all necessary fields for the PDF
    console.log('🔍 DEBUG ClientProfile - Original service for PDF:', {
      id: service.id,
      amount_delivered: (service as any).amount_delivered,
      amountDelivered: service.amountDelivered,
      amount: service.amount
    });
    
    const serviceForPDF = {
      ...service,
      clientId: client.id, // Use string ID directly
      amount_delivered: service.amountDelivered, // Map from camelCase to snake_case
      responsiblePerson: service.responsiblePerson,
      companyRepresentative: service.companyRepresentative,
      serviceItems: service.serviceItems || []
    };
    
    generateInvoicePDF(serviceForPDF, client, mappedPayments);
    toast({
      title: "Factura descargada",
      description: `Factura del ${service.category === 'venta' ? 'producto' : 'servicio'} #${service.id} descargada exitosamente`
    });
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-full sm:px-6">
      {/* Header - Optimizado para móvil */}
      <div className="mb-4 sm:mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/?tab=clients')}
          className="mb-3 sm:mb-4 -ml-2 sm:ml-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Clientes
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Cliente desde {new Date(client.createdAt).toLocaleDateString()}</p>
            {averagePaymentDelay !== null && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className={`text-sm font-medium ${getPaymentDelayColor(averagePaymentDelay)} block`}>
                    Tiempo Promedio de Pago: {averagePaymentDelay} días
                  </span>
                  <p className="text-xs text-muted-foreground">(Basado en deudas completamente pagadas)</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleWhatsAppClick}
              className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#128C7E] text-white border-0 h-11"
            >
              <img src={whatsappWhiteIcon} alt="WhatsApp" className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            {client.email && (
              <Button 
                variant="outline" 
                onClick={() => {
                  const subject = `Consulta desde ${client.firstName} ${client.lastName}`;
                  const body = `Estimado equipo,\n\nEspero que estén bien. Me contacto para...`;
                  const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.open(mailtoUrl, '_blank');
                  toast({
                    title: "Email abierto",
                    description: "Se ha abierto su cliente de email"
                  });
                }}
                className="flex-1 sm:flex-initial text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-11"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 sm:gap-6 lg:gap-32">
        {/* Left Column - Optimizado para móvil */}
        <div className="space-y-4 sm:space-y-6">
          {/* Client Info */}
          <Card className="border-primary/10">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-base sm:text-lg">Información del Cliente</CardTitle>
                {onEditClient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditClient(client)}
                    className="w-full sm:w-auto text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm sm:text-base break-all">{client.phone}</span>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Mail className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm sm:text-base break-all">{client.email}</span>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">{client.city}</span>
              </div>
              
              {client.taxId && (
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">CUIT/CUIL:</span>
                  <span className="font-mono text-sm break-all">{formatCuitCuil(client.taxId)}</span>
                </div>
              )}
              
              {client.notes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-primary/10">
                  <p className="text-sm font-medium mb-1">Observaciones:</p>
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Oldest Debt Section - Optimizado para móvil */}
          <Card className="border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-5 w-5 flex-shrink-0" />
                Deuda más longeva
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oldestDebt ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                        oldestDebt.daysOld >= 540 ? 'text-red-600 dark:text-red-400' :
                        oldestDebt.daysOld >= 90 ? 'text-red-600 dark:text-red-400' :
                        oldestDebt.daysOld >= 30 ? 'text-orange-600 dark:text-orange-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                      <span className="font-medium text-lg">
                        {oldestDebt.daysOld} días
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      oldestDebt.daysOld >= 540 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                      oldestDebt.daysOld >= 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                      oldestDebt.daysOld >= 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {oldestDebt.daysOld >= 540 ? 'Incobrable' :
                       oldestDebt.daysOld >= 90 ? 'Vencida' :
                       oldestDebt.daysOld >= 30 ? 'Por Vencer' :
                       'Al día'}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2 bg-muted/30 p-3 rounded-lg">
                    <p className="flex flex-col sm:flex-row sm:gap-1">
                      <strong className="text-foreground">Servicio:</strong> {oldestDebt.serviceType}
                    </p>
                    <p className="flex flex-col sm:flex-row sm:gap-1">
                      <strong className="text-foreground">Fecha:</strong> {new Date(oldestDebt.serviceDate).toLocaleDateString()}
                    </p>
                    <p className="flex flex-col sm:flex-row sm:gap-1">
                      <strong className="text-foreground">Monto pendiente:</strong> {formatCurrency(oldestDebt.amount)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <span className="text-green-600">✓</span>
                    No hay deudas pendientes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
      
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Plans Section */}
          {clientPaymentPlans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500 dark:text-white" />
                  Planes de Pago
                </CardTitle>
                <CardDescription>
                  Planes de pago activos para este cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientPaymentPlans.map((plan) => (
                    <Card key={plan.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">Plan #{plan.id}</h3>
                            <p className="text-sm text-gray-600">Total: {formatCurrency(plan.totalAmount)}</p>
                            <p className="text-sm text-gray-600">{plan.installments.length} cuotas</p>
                          </div>
                          <Button
                            onClick={() => handleDownloadReceipt({ ...plan, serviceId: plan.serviceId, clientId: plan.clientId } as any)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {plan.installments.map((installment, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div>
                                <span className="font-medium">Cuota {index + 1}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                  {formatCurrency(installment.amount)} - Vence: {new Date(installment.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge className={getStatusColor(installment.status)}>
                                {getStatusText(installment.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {plan.comments && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <p className="text-sm text-blue-700 dark:text-blue-300">{plan.comments}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Debts Section */}
          <Card className="bg-gradient-to-br from-card via-card to-muted/30 border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-background rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <span className="bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent font-bold">
                  Deudas Detalladas
                </span>
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {outstandingDebts.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
                    <span className="text-destructive font-bold text-lg">
                      Total Pendiente: {formatCurrency(totalOutstanding)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-green-600 font-semibold">Sin deudas pendientes</span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {debtBalances.length > 0 ? (
                <div className="space-y-3">
                  {debtBalances.map((debt) => (
                    <Card key={debt.id} className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-destructive/5">
                      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-destructive to-destructive/70"></div>
                      <Collapsible 
                        open={expandedDebts.includes(debt.id)} 
                        onOpenChange={() => toggleDebtExpansion(debt.id)}
                      >
                          <CollapsibleTrigger asChild>
                           <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-muted/50 hover:to-destructive/5 transition-all duration-300 pb-3 sm:pb-2">
                             <div className="flex flex-col gap-3">
                               <div className="flex-1 pl-2 sm:pl-4">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-full bg-destructive/10">
                                      <AlertTriangle className="h-4 w-4 text-destructive" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                      Deuda #{debt.id.slice(-8)}
                                    </h3>
                                  </div>
                                   <div className="flex flex-wrap items-center gap-2">
                                     <Badge className={`${getStatusColor(getDebtStatus(debt))} font-semibold px-3 py-1 text-xs sm:text-sm`}>
                                       {getStatusText(getDebtStatus(debt))}
                                     </Badge>
                                     <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                                       expandedDebts.includes(debt.id) ? 'rotate-180' : ''
                                     }`} />
                                   </div>
                                </div>
                                 {(() => {
                                   const correspondingService = services.find(s => s.id === debt.serviceId);
                                   return (
                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                                       <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                         <div className="flex items-center gap-2 mb-0.5">
                                           <Calendar className="h-3 w-3 text-primary" />
                                           <span className="text-xs font-medium text-muted-foreground">Fecha del Servicio</span>
                                         </div>
                                         <p className="font-semibold text-sm sm:text-base">{correspondingService ? new Date(correspondingService.date).toLocaleDateString() : new Date(debt.createdAt).toLocaleDateString()}</p>
                                       </div>
                                       
                                       <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                         <div className="flex items-center gap-2 mb-0.5">
                                           <CreditCard className="h-3 w-3 text-blue-500" />
                                           <span className="text-xs font-medium text-muted-foreground">Método de Pago</span>
                                         </div>
                                         <p className="font-semibold text-sm">{correspondingService?.paymentMethod || 'N/A'}</p>
                                       </div>
                                       
                                       {correspondingService?.secondaryPaymentMethod && (
                                         <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                           <div className="flex items-center gap-2 mb-0.5">
                                             <CreditCard className="h-3 w-3 text-purple-500" />
                                             <span className="text-xs font-medium text-muted-foreground">Método Secundario</span>
                                           </div>
                                           <p className="font-semibold text-sm">{correspondingService.secondaryPaymentMethod}</p>
                                         </div>
                                       )}
                                       
                                       <div className="p-2 rounded-lg bg-gradient-to-r from-background to-green-50 dark:to-green-950/30 border border-green-200 dark:border-green-800">
                                         <div className="flex items-center gap-2 mb-0.5">
                                           <DollarSign className="h-3 w-3 text-green-600" />
                                           <span className="text-xs font-medium text-muted-foreground">Monto Total</span>
                                         </div>
                                         <p className="font-bold text-base text-green-600">{formatCurrency(correspondingService?.amount || debt.amount)}</p>
                                       </div>
                                       
                                       <div className="p-2 rounded-lg bg-gradient-to-r from-background to-blue-50 dark:to-blue-950/30 border border-blue-200 dark:border-blue-800">
                                         <div className="flex items-center gap-2 mb-0.5">
                                           <TrendingUp className="h-3 w-3 text-blue-600" />
                                           <span className="text-xs font-medium text-muted-foreground">Monto Entregado</span>
                                         </div>
                                         <p className="font-bold text-base text-blue-600">{formatCurrency(correspondingService?.amountDelivered || 0)}</p>
                                       </div>
                                       
                                       <div className="p-2 rounded-lg bg-gradient-to-r from-destructive/10 to-destructive/20 border border-destructive/30">
                                         <div className="flex items-center gap-2 mb-0.5">
                                           <AlertCircle className="h-4 w-4 text-destructive" />
                                           <span className="text-xs font-bold text-destructive">Saldo Pendiente</span>
                                         </div>
                                         <p className="font-bold text-lg text-destructive">{formatCurrency(debt.remainingBalance)}</p>
                                       </div>
                                       
                                       {client.type === 'Empresa' && (
                                         <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                           <div className="flex items-center gap-2 mb-0.5">
                                             <Building className="h-3 w-3 text-orange-500" />
                                             <span className="text-xs font-medium text-muted-foreground">Representante</span>
                                           </div>
                                           <p className="font-semibold text-sm">{correspondingService?.companyRepresentative || 'N/A'}</p>
                                         </div>
                                       )}
                                       
                                       <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                         <div className="flex items-center gap-2 mb-0.5">
                                           <User className="h-3 w-3 text-indigo-500" />
                                           <span className="text-xs font-medium text-muted-foreground">Atendido por</span>
                                         </div>
                                         <p className="font-semibold text-sm">{correspondingService?.responsiblePerson || 'N/A'}</p>
                                       </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                                
                                {/* Action Buttons - Optimizados para móvil */}
                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pl-2 sm:pl-4 pt-3 border-t">
                                 {debt.remainingBalance > 0 && (
                                   <Button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setSelectedDebtForPayment(debt);
                                     }}
                                     size="sm"
                                     className="col-span-2 sm:col-span-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-9"
                                   >
                                     <DollarSign className="h-4 w-4 mr-2" />
                                     Saldar Deuda
                                   </Button>
                                 )}
                                 <Button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDownloadReceipt(debt);
                                   }}
                                   size="sm"
                                   variant="outline"
                                   className="hover:bg-primary/10 hover:border-primary transition-all duration-300 h-10 sm:h-9"
                                 >
                                   <Download className="h-4 w-4 mr-2" />
                                   <span className="hidden sm:inline">Descargar</span>
                                   <span className="sm:hidden">PDF</span>
                                 </Button>
                                 {client.phone && (
                                   <Button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleSendReceiptWhatsApp(debt);
                                     }}
                                     size="sm"
                                     className="bg-[#25D366] hover:bg-[#128C7E] text-white border-0 transition-all duration-300 h-10 sm:h-9"
                                   >
                                     <img src={whatsappWhiteIcon} alt="WhatsApp" className="h-4 w-4 mr-2" />
                                     <span className="hidden sm:inline">WhatsApp</span>
                                     <span className="sm:hidden">WA</span>
                                   </Button>
                                 )}
                                 {client.email && (
                                   <Button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleSendReceiptEmail(debt);
                                     }}
                                     size="sm"
                                     variant="outline"
                                     className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 h-10 sm:h-9"
                                   >
                                     <Send className="h-4 w-4 mr-2" />
                                     Email
                                   </Button>
                                 )}
                               </div>
                             </div>
                           </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {/* Comments */}
                            {debt.comments && (
                              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border">
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Comentarios:</p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-200">{debt.comments}</p>
                              </div>
                            )}

                            {/* Service Details for Debt */}
                            {(() => {
                              const correspondingService = services.find(s => s.id === debt.serviceId);
                              return correspondingService ? (
                                <div className="mb-4">
                                  <h4 className="font-medium mb-3">Detalles del {correspondingService.category === 'venta' ? 'Producto' : 'Servicio'}:</h4>
                                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                      <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                                        <span className="ml-2">{correspondingService.type}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Fecha:</span>
                                        <span className="ml-2">{new Date(correspondingService.date).toLocaleDateString()}</span>
                                      </div>
                                      {correspondingService.vehicle && (
                                        <div>
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Vehículo:</span>
                                          <span className="ml-2">{correspondingService.vehicle}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Método de Pago:</span>
                                          <span className="ml-2">{correspondingService.paymentMethod}</span>
                                        </div>
                                        {correspondingService.paymentMethod === 'Cheque' && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                              console.log('Clicked Datos del Cheque button');
                                              // Use the clientId from URL params to find services and then cheques
                                              const realClientId = clientId || selectedClientId?.toString();
                                              console.log('Real client ID:', realClientId);
                                              console.log('Corresponding service:', correspondingService);
                                              
                                              if (realClientId) {
                                                const allServices = await supabase
                                                  .from('services')
                                                  .select('id')
                                                  .eq('client_id', realClientId)
                                                  .eq('service_type', correspondingService.type)
                                                  .eq('service_date', correspondingService.date);
                                                
                                                console.log('Services found:', allServices);
                                                
                                                if (allServices.data?.[0]) {
                                                  console.log('Service ID:', allServices.data[0].id);
                                                  const cheques = await getChequesByServiceId(allServices.data[0].id);
                                                  console.log('Cheques found:', cheques);
                                                  if (cheques.length > 0) {
                                                    console.log('Setting selected cheque:', cheques[0]);
                                                    setSelectedCheque(cheques[0]);
                                                  } else {
                                                    console.log('No cheques found for this service');
                                                  }
                                                } else {
                                                  console.log('No matching service found');
                                                }
                                              } else {
                                                console.log('No real client ID found');
                                              }
                                            }}
                                            className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                          >
                                            <CreditCard className="h-4 w-4 mr-1" />
                                            Datos del cheque
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Service Items for Debt */}
                                    {correspondingService.serviceItems && correspondingService.serviceItems.length > 0 && (
                                      <div>
                                        <h5 className="font-medium mb-2">
                                          {correspondingService.category === 'venta' ? 'Productos:' : 'Servicios:'}
                                        </h5>
                                        <div className="space-y-2">
                                          {correspondingService.serviceItems.map((item, index) => (
                                            <div key={index} className={`p-3 rounded border ${
                                              correspondingService.category === 'venta' 
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            }`}>
                                              <div className="flex justify-between items-start mb-2">
                                                <div>
                                                  <p className={`font-medium ${
                                                    correspondingService.category === 'venta' 
                                                      ? 'text-green-800 dark:text-green-300' 
                                                      : 'text-blue-800 dark:text-blue-300'
                                                  }`}>{item.type}</p>
                                                  {item.vehicle && (
                                                    <p className={`text-xs ${
                                                      correspondingService.category === 'venta' 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : 'text-blue-600 dark:text-blue-400'
                                                    }`}>{item.vehicle}</p>
                                                  )}
                                                </div>
                                                <div className="text-right">
                                                  <p className={`text-xs ${
                                                    correspondingService.category === 'venta' 
                                                      ? 'text-green-700 dark:text-green-300' 
                                                      : 'text-blue-700 dark:text-blue-300'
                                                  }`}>Cant: {item.quantity || 1}</p>
                                                  <p className={`font-semibold ${
                                                    correspondingService.category === 'venta' 
                                                      ? 'text-green-800 dark:text-green-300' 
                                                      : 'text-blue-800 dark:text-blue-300'
                                                  }`}>{formatCurrency(item.price)}</p>
                                                </div>
                                              </div>

                                              {/* Información específica por tipo de producto */}
                                              {correspondingService.category === 'venta' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                  {/* Neumáticos */}
                                                  {item.type === "Neumáticos" && (
                                                    <>
                                                      {(item as any).marca && (
                                                        <div>
                                                          <span className="font-medium text-green-700 dark:text-green-300">Marca:</span>
                                                          <span className="ml-1 text-green-600 dark:text-green-400">{(item as any).marca}</span>
                                                        </div>
                                                      )}
                                                      {(item as any).modelo && (
                                                        <div>
                                                          <span className="font-medium text-green-700 dark:text-green-300">Modelo:</span>
                                                          <span className="ml-1 text-green-600 dark:text-green-400">{(item as any).modelo}</span>
                                                        </div>
                                                      )}
                                                      {(item as any).medida && (
                                                        <div>
                                                          <span className="font-medium text-green-700 dark:text-green-300">Medida:</span>
                                                          <span className="ml-1 text-green-600 dark:text-green-400">{(item as any).medida}</span>
                                                        </div>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Llantas */}
                                                  {item.type === "Llantas" && (
                                                    <>
                                                      {(item as any).material && (
                                                        <div>
                                                          <span className="font-medium text-green-700 dark:text-green-300">Material:</span>
                                                          <span className="ml-1 text-green-600 dark:text-green-400">{(item as any).material}</span>
                                                        </div>
                                                      )}
                                                      {(item as any).rodado && (
                                                        <div>
                                                          <span className="font-medium text-green-700 dark:text-green-300">Rodado:</span>
                                                          <span className="ml-1 text-green-600 dark:text-green-400">{(item as any).rodado}</span>
                                                        </div>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Repuestos */}
                                                  {item.type === "Repuestos" && (
                                                    <>
                                                      {(item as any).tipoRepuesto && (
                                                        <div>
                                                          <span className="font-medium text-green-700 dark:text-green-300">Tipo:</span>
                                                          <span className="ml-1 text-green-600 dark:text-green-400">{(item as any).tipoRepuesto}</span>
                                                        </div>
                                                      )}
                                                      {(item as any).marcaRepuesto && (
                                                        <div>
                                                          <span className="font-medium text-green-700 dark:text-green-300">Marca:</span>
                                                          <span className="ml-1 text-green-600 dark:text-green-400">{(item as any).marcaRepuesto}</span>
                                                        </div>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Precio unitario para ventas */}
                                                  {(item as any).unitPrice && (
                                                    <div>
                                                      <span className="font-medium text-green-700 dark:text-green-300">P. Unit:</span>
                                                      <span className="ml-1 text-green-600 dark:text-green-400">{formatCurrency((item as any).unitPrice)}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null;
                            })()}

                             {/* Payment History */}
                             <div className="mb-4">
                              <h4 className="font-medium mb-3">Historial de Pagos:</h4>
                              {debt.payments.length > 0 ? (
                                <div className="border border-border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/50">
                                        <TableHead className="text-foreground font-medium">Fecha</TableHead>
                                        <TableHead className="text-foreground font-medium">Importe</TableHead>
                                        <TableHead className="text-foreground font-medium">Método</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {debt.payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                          <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                          <TableCell className="font-medium text-green-600">{formatCurrency(payment.amount)}</TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <span>{getPaymentMethodText(payment.paymentMethod)}</span>
                                              {payment.paymentMethod === 'Cheque' && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={async () => {
                                                    // Buscar cheques por service_id
                                                    const cheques = await getChequesByServiceId(debt.serviceId);
                                                    
                                                    // Filtrar por monto
                                                    const matchingCheque = cheques.find(c => 
                                                      c.amount === payment.amount
                                                    );
                                                    
                                                    if (matchingCheque) {
                                                      setSelectedCheque(matchingCheque);
                                                    } else {
                                                      toast({
                                                        title: "Sin detalles del cheque",
                                                        description: "Este pago fue registrado como cheque pero no se guardaron los detalles. Puede registrarlos desde la sección de Cheques.",
                                                        variant: "default"
                                                      });
                                                    }
                                                  }}
                                                  className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                >
                                                  <CreditCard className="h-4 w-4 mr-1" />
                                                  Ver Datos
                                                </Button>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No hay pagos registrados</p>
                              )}
                            </div>

                            {/* Digital Signature */}
                            {(() => {
                              const correspondingService = services.find(s => s.id === debt.serviceId);
                              return correspondingService?.signature ? (
                                <div>
                                  <h4 className="font-medium mb-2">Firma Digital del Cliente:</h4>
                                  <div className="border rounded p-2 bg-gray-50 dark:bg-gray-800">
                                    <img 
                                      src={correspondingService.signature} 
                                      alt="Firma del cliente"
                                      className="max-w-full h-20 object-contain"
                                    />
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay deudas registradas</p>
              )}
            </CardContent>
          </Card>

          {/* Service History */}
          <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-bold">
                  Historial de Servicios y Ventas
                </span>
              </CardTitle>
              <CardDescription className="text-base mt-2 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-semibold">Total de registros: <span className="text-primary">{clientServices.length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-semibold">Ingresos totales: <span className="text-green-600">{formatCurrency(clientServices.reduce((sum, s) => sum + (s.amountDelivered || 0), 0))}</span></span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {clientServices.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    // Group services by month and year
                    const servicesByMonth = clientServices
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .reduce((groups, service) => {
                        const serviceDate = new Date(service.date);
                        const monthKey = `${serviceDate.getFullYear()}-${String(serviceDate.getMonth() + 1).padStart(2, '0')}`;
                        const monthName = serviceDate.toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long' 
                        });
                        
                        if (!groups[monthKey]) {
                          groups[monthKey] = {
                            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                            services: []
                          };
                        }
                        groups[monthKey].services.push(service);
                        return groups;
                      }, {} as Record<string, { name: string; services: any[] }>);

                    return Object.entries(servicesByMonth)
                      .sort(([a], [b]) => b.localeCompare(a)) // Sort months in descending order
                      .map(([monthKey, monthData]) => (
                        <Collapsible key={monthKey} defaultOpen={Object.keys(servicesByMonth).indexOf(monthKey) === 0}>
                          <CollapsibleTrigger asChild>
                            <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-primary/5 via-card to-primary/10 hover:from-primary/10 hover:to-primary/15 cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg">
                              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50"></div>
                              <CardHeader className="pb-4 pl-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-full bg-primary/20">
                                      <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                                        {monthData.name}
                                      </h3>
                                      <Badge variant="secondary" className="text-sm font-semibold mt-1">
                                        {monthData.services.length} registro{monthData.services.length !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                  </div>
                                   <div className="flex items-center gap-3">
                                     <div className="text-right">
                                       <div className="text-sm text-muted-foreground">Ingresos del mes</div>
                                       <div className="text-lg font-bold text-green-600">
                                         {formatCurrency(monthData.services.reduce((sum, s) => sum + (s.amountDelivered || 0), 0))}
                                       </div>
                                     </div>
                                     <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 data-[state=open]:rotate-180" />
                                   </div>
                                </div>
                              </CardHeader>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-16 mt-3 ml-6">
                              {monthData.services.map((service) => (
                                <Card key={service.id} className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
                                  <div className={`absolute left-0 top-0 w-1 h-full ${
                                    service.category === 'venta' 
                                      ? 'bg-gradient-to-b from-green-500 to-green-600' 
                                      : 'bg-gradient-to-b from-blue-500 to-blue-600'
                                  }`}></div>
                                  <Collapsible 
                                    open={expandedServices.includes(service.id)} 
                                    onOpenChange={() => toggleServiceExpansion(service.id)}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <CardHeader 
                                        className="cursor-pointer hover:bg-gradient-to-r hover:from-muted/50 hover:to-primary/5 transition-all duration-300 pb-2 pl-6"
                                      >
                                         <div className="flex justify-between items-start">
                                           <div className="flex-1">
                                             <div className="flex items-center gap-3 mb-2">
                                               <div className="flex items-center gap-2">
                                                 <div className={`p-2 rounded-full ${
                                                   service.category === 'venta' 
                                                     ? 'bg-green-500/20' 
                                                     : 'bg-blue-500/20'
                                                 }`}>
                                                   {service.category === 'venta' ? (
                                                     <ShoppingCart className="h-4 w-4 text-green-600" />
                                                   ) : (
                                                     <Wrench className="h-4 w-4 text-blue-600" />
                                                   )}
                                                 </div>
                                                 <h4 className="text-lg font-bold">
                                                   {service.category === 'venta' ? 'Venta' : 'Servicio'} #{service.id.slice(-8)}
                                                 </h4>
                                               </div>
                                               <Badge className={`${getStatusColor(service.status)} font-semibold px-3 py-1`}>
                                                 {getStatusText(service.status)}
                                               </Badge>
                                                <Badge variant="outline" className={`font-semibold px-3 py-1 ${
                                                  service.category === 'venta' 
                                                    ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30' 
                                                    : 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                                                }`}>
                                                  {service.category === 'venta' ? 'Producto' : 'Servicio'}
                                                </Badge>
                                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                                                  expandedServices.includes(service.id) ? 'rotate-180' : ''
                                                }`} />
                                             </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                               <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                                 <div className="flex items-center gap-2 mb-0.5">
                                                   <Calendar className="h-3 w-3 text-primary" />
                                                   <span className="text-xs font-medium text-muted-foreground">Fecha del Servicio</span>
                                                 </div>
                                                 <p className="font-semibold text-base">{new Date(service.date).toLocaleDateString()}</p>
                                               </div>
                                               
                                               <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                                 <div className="flex items-center gap-2 mb-0.5">
                                                   <CreditCard className="h-3 w-3 text-blue-500" />
                                                   <span className="text-xs font-medium text-muted-foreground">Método de Pago</span>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                   <p className="font-semibold text-sm">{service.paymentMethod}</p>
                                                   {service.paymentMethod === 'Cheque' && (
                                                     <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={async (e) => {
                                                         e.stopPropagation();
                                                         const originalServices = await supabase
                                                           .from('services')
                                                           .select('id')
                                                           .eq('client_id', clientId || selectedClientId?.toString())
                                                           .eq('service_type', service.type)
                                                           .eq('service_date', service.date);
                                                         
                                                         if (originalServices.data?.[0]) {
                                                           const cheques = await getChequesByServiceId(originalServices.data[0].id);
                                                           if (cheques.length > 0) {
                                                             setSelectedCheque(cheques[0]);
                                                           }
                                                         }
                                                       }}
                                                       className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300"
                                                     >
                                                       <CreditCard className="h-4 w-4 mr-1" />
                                                       Ver Cheque
                                                     </Button>
                                                   )}
                                                 </div>
                                               </div>
                                               
                                               {service.secondaryPaymentMethod && (
                                                 <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                                   <div className="flex items-center gap-2 mb-0.5">
                                                     <CreditCard className="h-3 w-3 text-purple-500" />
                                                     <span className="text-xs font-medium text-muted-foreground">Método Secundario</span>
                                                   </div>
                                                   <p className="font-semibold text-sm">{service.secondaryPaymentMethod}</p>
                                                 </div>
                                               )}
                                               
                                               <div className="p-2 rounded-lg bg-gradient-to-r from-background to-green-50 dark:to-green-950/30 border border-green-200 dark:border-green-800">
                                                 <div className="flex items-center gap-2 mb-0.5">
                                                   <DollarSign className="h-3 w-3 text-green-600" />
                                                   <span className="text-xs font-medium text-muted-foreground">Monto Total</span>
                                                 </div>
                                                 <p className="font-bold text-base text-green-600">{formatCurrency(service.amount)}</p>
                                               </div>
                                               
                                               <div className="p-2 rounded-lg bg-gradient-to-r from-background to-blue-50 dark:to-blue-950/30 border border-blue-200 dark:border-blue-800">
                                                 <div className="flex items-center gap-2 mb-0.5">
                                                   <TrendingUp className="h-3 w-3 text-blue-600" />
                                                   <span className="text-xs font-medium text-muted-foreground">Monto Entregado</span>
                                                 </div>
                                                 <p className="font-bold text-base text-blue-600">{formatCurrency(service.amountDelivered || 0)}</p>
                                               </div>
                                               
                                               {client.type === 'Empresa' && (
                                                 <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                                   <div className="flex items-center gap-2 mb-0.5">
                                                     <Building className="h-3 w-3 text-orange-500" />
                                                     <span className="text-xs font-medium text-muted-foreground">Representante</span>
                                                   </div>
                                                   <p className="font-semibold text-sm">{service.companyRepresentative || 'N/A'}</p>
                                                 </div>
                                               )}
                                               
                                               <div className="p-2 rounded-lg bg-gradient-to-r from-background to-muted/30 border">
                                                 <div className="flex items-center gap-2 mb-0.5">
                                                   <User className="h-3 w-3 text-indigo-500" />
                                                   <span className="text-xs font-medium text-muted-foreground">Atendido por</span>
                                                 </div>
                                                 <p className="font-semibold text-sm">{service.responsiblePerson || 'N/A'}</p>
                                               </div>
                                             </div>
                                           </div>
                                           <div className="flex flex-col gap-3 ml-6">
                                             <Button
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleDownloadServiceInvoice(service);
                                               }}
                                               size="sm"
                                               variant="outline"
                                               className="hover:bg-primary/10 hover:border-primary transition-all duration-300 transform hover:scale-105"
                                             >
                                               <Download className="h-4 w-4 mr-2" />
                                               Descargar
                                             </Button>
                                           </div>
                                         </div>
                                      </CardHeader>
                                    </CollapsibleTrigger>
                                    
                                    <CollapsibleContent>
                                      <CardContent className="pt-0">
                                        {/* Service Details */}
                                        <div className="space-y-4">
                                          {/* Basic Information */}
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                                              {service.secondaryPaymentMethod && (
                                                <div>
                                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago Secundario</p>
                                                  <p className="text-sm dark:text-gray-200">{service.secondaryPaymentMethod}</p>
                                                </div>
                                              )}
                                            </div>

                                          {/* Service Items */}
                                          {service.serviceItems && service.serviceItems.length > 0 && (
                                            <div>
                                              <h4 className="font-medium mb-2">
                                                {service.category === 'venta' ? 'Productos Vendidos' : 'Detalles del Servicio'}
                                              </h4>
                                               <div className="space-y-3">
                                                 {service.serviceItems.map((item, index) => (
                                                   <div key={index} className={`p-4 rounded-lg border ${
                                                     service.category === 'venta' 
                                                       ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                                       : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                   }`}>
                                                     {/* Encabezado del producto */}
                                                     <div className="flex justify-between items-start mb-3">
                                                       <div>
                                                         <h5 className={`font-semibold text-lg ${
                                                           service.category === 'venta' 
                                                             ? 'text-green-800 dark:text-green-300' 
                                                             : 'text-blue-800 dark:text-blue-300'
                                                         }`}>{item.type}</h5>
                                                          {item.vehicle && (
                                                            <div>
                                                              <span className="font-medium text-green-700 dark:text-green-300">Vehículo:</span>
                                                              <span className={`ml-2 text-sm ${
                                                                service.category === 'venta' 
                                                                  ? 'text-green-600 dark:text-green-400' 
                                                                  : 'text-blue-600 dark:text-blue-400'
                                                              }`}>{item.vehicle}</span>
                                                            </div>
                                                          )}
                                                       </div>
                                                       <div className="text-right">
                                                         <p className={`text-sm font-medium ${
                                                           service.category === 'venta' 
                                                             ? 'text-green-700 dark:text-green-300' 
                                                             : 'text-blue-700 dark:text-blue-300'
                                                         }`}>Cantidad: {item.quantity || 1}</p>
                                                         <p className={`font-bold text-lg ${
                                                           service.category === 'venta' 
                                                             ? 'text-green-800 dark:text-green-300' 
                                                             : 'text-blue-800 dark:text-blue-300'
                                                         }`}>{formatCurrency(item.price)}</p>
                                                       </div>
                                                     </div>

                                                     {/* Información específica por tipo de producto */}
                                                     {service.category === 'venta' && (
                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                         {/* Neumáticos */}
                                                         {item.type === "Neumáticos" && (
                                                           <>
                                                             {(item as any).marca && (
                                                               <div>
                                                                 <span className="font-medium text-green-700 dark:text-green-300">Marca:</span>
                                                                 <span className="ml-2 text-green-600 dark:text-green-400">{(item as any).marca}</span>
                                                               </div>
                                                             )}
                                                             {(item as any).modelo && (
                                                               <div>
                                                                 <span className="font-medium text-green-700 dark:text-green-300">Modelo:</span>
                                                                 <span className="ml-2 text-green-600 dark:text-green-400">{(item as any).modelo}</span>
                                                               </div>
                                                             )}
                                                             {(item as any).medida && (
                                                               <div>
                                                                 <span className="font-medium text-green-700 dark:text-green-300">Medida:</span>
                                                                 <span className="ml-2 text-green-600 dark:text-green-400">{(item as any).medida}</span>
                                                               </div>
                                                             )}
                                                           </>
                                                         )}

                                                         {/* Llantas */}
                                                         {item.type === "Llantas" && (
                                                           <>
                                                             {(item as any).material && (
                                                               <div>
                                                                 <span className="font-medium text-green-700 dark:text-green-300">Material:</span>
                                                                 <span className="ml-2 text-green-600 dark:text-green-400">{(item as any).material}</span>
                                                               </div>
                                                             )}
                                                             {(item as any).rodado && (
                                                               <div>
                                                                 <span className="font-medium text-green-700 dark:text-green-300">Rodado:</span>
                                                                 <span className="ml-2 text-green-600 dark:text-green-400">{(item as any).rodado}</span>
                                                               </div>
                                                             )}
                                                           </>
                                                         )}

                                                         {/* Repuestos */}
                                                         {item.type === "Repuestos" && (
                                                           <>
                                                             {(item as any).tipoRepuesto && (
                                                               <div>
                                                                 <span className="font-medium text-green-700 dark:text-green-300">Tipo:</span>
                                                                 <span className="ml-2 text-green-600 dark:text-green-400">{(item as any).tipoRepuesto}</span>
                                                               </div>
                                                             )}
                                                             {(item as any).marcaRepuesto && (
                                                               <div>
                                                                 <span className="font-medium text-green-700 dark:text-green-300">Marca:</span>
                                                                 <span className="ml-2 text-green-600 dark:text-green-400">{(item as any).marcaRepuesto}</span>
                                                               </div>
                                                             )}
                                                           </>
                                                         )}

                                                         {/* Precio unitario para ventas */}
                                                         {(item as any).unitPrice && (
                                                           <div>
                                                             <span className="font-medium text-green-700 dark:text-green-300">Precio Unitario:</span>
                                                             <span className="ml-2 text-green-600 dark:text-green-400">{formatCurrency((item as any).unitPrice)}</span>
                                                           </div>
                                                         )}
                                                       </div>
                                                     )}
                                                   </div>
                                                 ))}
                                               </div>
                                            </div>
                                          )}

                                          {/* Notes */}
                                          {service.notes && (
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border">
                                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Notas:</p>
                                              <p className="text-sm text-yellow-700 dark:text-yellow-200">{service.notes}</p>
                                            </div>
                                          )}

                                            {/* Payment History for Service */}
                                            {(() => {
                                              // Find the debt associated with this service
                                              const serviceDebt = debtBalances.find(d => d.serviceId === service.id);
                                              if (serviceDebt && serviceDebt.payments.length > 0) {
                                                return (
                                                   <div className="mt-4">
                                                    <h4 className="text-sm font-medium text-foreground mb-3">Historial de Pagos:</h4>
                                                    <div className="border border-border rounded-lg overflow-hidden">
                                                      <Table>
                                                         <TableHeader>
                                                           <TableRow className="bg-muted/50">
                                                             <TableHead className="text-foreground font-medium">Fecha</TableHead>
                                                             <TableHead className="text-foreground font-medium">Importe</TableHead>
                                                             <TableHead className="text-foreground font-medium">Método</TableHead>
                                                           </TableRow>
                                                         </TableHeader>
                                                         <TableBody>
                                                           {serviceDebt.payments.map((payment) => (
                                                             <TableRow key={payment.id}>
                                                               <TableCell className="text-foreground">
                                                                 {new Date(payment.date).toLocaleDateString()}
                                                               </TableCell>
                                                               <TableCell className="font-medium text-green-600 dark:text-green-400">
                                                                 {formatCurrency(payment.amount)}
                                                               </TableCell>
                                                               <TableCell className="text-foreground">
                                                                 <div className="flex items-center gap-2">
                                                                   <span>{getPaymentMethodText(payment.paymentMethod)}</span>
                                                                    {payment.paymentMethod === 'Cheque' && (
                                                                      <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={async () => {
                                                                          // Buscar cheques por service_id
                                                                          const cheques = await getChequesByServiceId(serviceDebt.serviceId);
                                                                          
                                                                          // Filtrar por monto
                                                                          const matchingCheque = cheques.find(c => 
                                                                            c.amount === payment.amount
                                                                          );
                                                                          
                                                                          if (matchingCheque) {
                                                                            setSelectedCheque(matchingCheque);
                                                                          } else {
                                                                            toast({
                                                                              title: "Sin detalles del cheque",
                                                                              description: "Este pago fue registrado como cheque pero no se guardaron los detalles. Puede registrarlos desde la sección de Cheques.",
                                                                              variant: "default"
                                                                            });
                                                                          }
                                                                        }}
                                                                        className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                      >
                                                                        <CreditCard className="h-4 w-4 mr-1" />
                                                                        Ver Datos
                                                                      </Button>
                                                                    )}
                                                                 </div>
                                                               </TableCell>
                                                            </TableRow>
                                                          ))}
                                                        </TableBody>
                                                      </Table>
                                                    </div>
                                                    {serviceDebt.payments.some(p => p.notes) && (
                                                      <div className="mt-2 text-xs text-muted-foreground">
                                                        {serviceDebt.payments.filter(p => p.notes).map((payment, index) => (
                                                          <p key={index}>• {payment.notes}</p>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })()}

                                           {/* Digital Signature */}
                                           {service.signature && (
                                             <div className="mt-4">
                                               <h4 className="font-medium mb-2">Firma Digital del Cliente:</h4>
                                               <div className="border rounded p-2 bg-gray-50 dark:bg-gray-800">
                                                 <img 
                                                   src={service.signature} 
                                                   alt="Firma del cliente"
                                                   className="max-w-full h-20 object-contain"
                                                 />
                                               </div>
                                             </div>
                                           )}
                                         </div>
                                      </CardContent>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </Card>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 dark:text-white mx-auto mb-3" />
                  <p className="text-gray-500">Sin servicios registrados</p>
                  <Button 
                    onClick={onAddService}
                    variant="outline" 
                    className="mt-3"
                  >
                    Agregar Primer Servicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment History */}
      <Card className="mt-4 sm:mt-6 border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Historial de turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientAppointmentHistory clientId={client.id} />
        </CardContent>
      </Card>

      {/* Payment Tracker Dialog */}
      {selectedDebtForPayment && (
        <Dialog open={!!selectedDebtForPayment} onOpenChange={() => setSelectedDebtForPayment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pagar Deuda - {client.firstName} {client.lastName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Detalles de la Deuda</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Monto Total:</span>
                    <p className="font-medium">{formatCurrency(services.find(s => s.id === selectedDebtForPayment.serviceId)?.amount || selectedDebtForPayment.amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Saldo Pendiente:</span>
                    <p className="font-medium text-red-600">{formatCurrency(selectedDebtForPayment.remainingBalance)}</p>
                  </div>
                </div>
              </div>
              
              <PaymentTracker
                debtId={selectedDebtForPayment.id}
                totalAmount={selectedDebtForPayment.amount}
                payments={selectedDebtForPayment.payments || []}
                onAddPayment={onAddPayment}
                clientId={clientId || selectedClientId?.toString()}
                serviceId={(() => {
                  const correspondingService = services.find(s => s.id === selectedDebtForPayment.serviceId);
                  return correspondingService ? correspondingService.id.toString() : undefined;
                })()}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para mostrar datos del cheque */}
      {selectedCheque && (
        <Dialog open={!!selectedCheque} onOpenChange={() => setSelectedCheque(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Datos del Cheque</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Banco:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCheque.bank_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Número de Cheque:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCheque.cheque_number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Titular:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCheque.holder_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Monto:</span>
                  <p className="text-gray-900 dark:text-gray-100 font-bold">{formatCurrency(selectedCheque.amount)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de Emisión:</span>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(selectedCheque.issuance_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de Pago:</span>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(selectedCheque.payment_date).toLocaleDateString()}</p>
                </div>
                {selectedCheque.cbu_number && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">CBU:</span>
                    <p className="text-gray-900 dark:text-gray-100 font-mono">{selectedCheque.cbu_number}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                  <Badge 
                    variant={selectedCheque.status === 'Cobrado' ? 'default' : 
                            selectedCheque.status === 'Rechazado' ? 'destructive' : 'secondary'}
                  >
                    {selectedCheque.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de Registro:</span>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(selectedCheque.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedCheque.notes && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Observaciones:</span>
                  <p className="text-gray-900 dark:text-gray-100 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedCheque.notes}</p>
                </div>
              )}
              
              {selectedCheque.image_url && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Imagen del Cheque:</span>
                  <div className="mt-2">
                    <img 
                      src={selectedCheque.image_url} 
                      alt="Imagen del cheque" 
                      className="max-w-full h-auto border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientProfile;
