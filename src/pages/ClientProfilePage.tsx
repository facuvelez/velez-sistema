import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClientProfile from "@/components/ClientProfile";
import ServiceForm from "@/components/ServiceForm";
import PaymentPlanForm from "@/components/PaymentPlanForm";
import EditClientForm from "@/components/EditClientForm";
import EditServiceForm from "@/components/EditServiceForm";
import PendingServicesPanel from "@/components/PendingServicesPanel";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useCheques } from "@/hooks/useCheques";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ClientProfilePage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showPaymentPlanForm, setShowPaymentPlanForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  
  // Use database integration
  const {
    clients,
    services,
    debts,
    debtPayments,
    loading,
    createService,
    createDebtPayment,
    updateClient,
    updateService,
    refetch
  } = useSupabaseSync();
  
  const { createCheque } = useCheques();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando perfil del cliente...</p>
        </div>
      </div>
    );
  }

  // Find the client by the UUID from the URL params
  console.log('Looking for clientId:', clientId);
  console.log('Available clients:', clients.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })));
  
  const client = clients.find(c => c.id === clientId);
  console.log('Found client:', client);
  
  if (!client) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h2>
          <p className="text-gray-600 mb-4">El cliente que busca no existe o ha sido eliminado.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Transform data for compatibility with existing ClientProfile component
  const transformedClients = clients.map(c => ({
    id: c.id, // Keep UUID as string
    firstName: c.first_name,
    lastName: c.last_name,
    phone: c.phone || "",
    email: c.email || "",
    city: c.address || "",
    type: c.type,
    notes: c.notes || "",
    taxId: c.tax_id || "",
    createdAt: c.created_at
  }));

  // Find the transformed client ID for the current client
  const currentTransformedClient = transformedClients.find(tc => tc.id === clientId);

  const transformedServices = services
    .filter(s => s.client_id === clientId) // Filter by current client UUID
    .map(s => {
      // Buscar si existe una deuda asociada a este servicio
      const associatedDebt = debts.find(d => d.service_id === s.id);
      
      // Determinar el estado real basado en la existencia y estado de la deuda
      let realStatus = s.status;
      if (!associatedDebt || associatedDebt.remaining_amount <= 0) {
        // Si no hay deuda o la deuda está pagada completamente, el estado es "paid"
        realStatus = 'paid';
      } else if (associatedDebt.remaining_amount > 0) {
        // Si hay deuda pendiente, determinar si es "pending" o "partial"
        realStatus = s.amount_delivered > 0 ? 'partial' : 'pending';
      }
      
      return {
        id: s.id, // Keep service UUID as string
        clientId: s.client_id, // Keep client ID as string
        date: s.service_date,
        type: s.service_type,
        vehicle: s.vehicle_info || "",
        notes: s.notes || "",
        amount: s.total_amount,
        amountDelivered: s.amount_delivered,
        paymentMethod: s.payment_method,
        secondaryPaymentMethod: s.secondary_payment_method,
        status: realStatus, // Usar el estado real calculado
        responsiblePerson: s.responsible_person,
        companyRepresentative: s.company_representative,
        signature: s.signature_data,
        serviceItems: s.service_items as any,
        category: (s as any).category || 'servicio' // Add category field
      };
    });

  const transformedDebts = debts
    .filter(d => d.client_id === clientId) // Filter by current client UUID
    .map(d => ({
      id: d.id, // Keep debt UUID as string
      clientId: d.client_id, // Keep client ID as string
      serviceId: d.service_id, // Keep service UUID as string
      amount: d.original_amount,
      remainingAmount: d.remaining_amount,
      dueDate: d.created_at, // Use creation date as due date for compatibility
      status: d.remaining_amount > 0 ? "pending" : "paid",
      comments: "",
      signature: "",
      createdAt: d.created_at
    }));

  const transformedPayments = debtPayments
    .filter(p => {
      // Find if this payment belongs to a debt of the current client
      const debt = debts.find(d => d.id === p.debt_id);
      return debt?.client_id === clientId;
    })
    .map(p => ({
      id: p.id, // Keep payment UUID as string
      debtId: p.debt_id, // Keep debt UUID as string
      amount: p.amount,
      paymentMethod: p.payment_method,
      date: p.payment_date,
      notes: p.notes || ""
    }));

  const handleAddService = () => {
    setShowServiceForm(true);
  };

  const handleSaveService = async (serviceData: any) => {
    try {
      const service = await createService({
        client_id: clientId!, // Use the actual UUID
        service_date: serviceData.date,
        service_type: serviceData.type,
        vehicle_info: serviceData.vehicle,
        notes: serviceData.notes,
        total_amount: serviceData.amount,
        amount_delivered: serviceData.amountDelivered,
        payment_method: serviceData.paymentMethod,
        // Only include secondary payment method if it's actually provided and not null/empty
        secondary_payment_method: serviceData.secondaryPaymentMethod || undefined,
        status: serviceData.status,
        responsible_person: serviceData.responsiblePerson,
        company_representative: serviceData.companyRepresentative,
        signature_data: serviceData.signature,
        service_items: serviceData.serviceItems,
        category: 'servicio' // Mark as service
      });

      // Create cheque records if payment method is cheque
      if (serviceData.chequeData && serviceData.paymentMethod === 'Cheque') {
        await createCheque({
          client_id: clientId!,
          service_id: service.id,
          bank_name: serviceData.chequeData.bankName,
          cheque_number: serviceData.chequeData.chequeNumber,
          amount: serviceData.amount,
          issuance_date: serviceData.chequeData.issuanceDate,
          payment_date: serviceData.chequeData.paymentDate,
          holder_name: serviceData.chequeData.holderName,
          cbu_number: serviceData.chequeData.cbuNumber || undefined,
          status: serviceData.chequeData.status,
          notes: serviceData.chequeData.notes || undefined,
          image_url: undefined // TODO: Handle image upload
        });
      }

      // Create secondary cheque record if secondary payment method is cheque
      if (serviceData.secondaryChequeData && serviceData.secondaryPaymentMethod === 'Cheque') {
        await createCheque({
          client_id: clientId!,
          service_id: service.id,
          bank_name: serviceData.secondaryChequeData.bankName,
          cheque_number: serviceData.secondaryChequeData.chequeNumber,
          amount: serviceData.amount, // You might want to split amounts
          issuance_date: serviceData.secondaryChequeData.issuanceDate,
          payment_date: serviceData.secondaryChequeData.paymentDate,
          holder_name: serviceData.secondaryChequeData.holderName,
          cbu_number: serviceData.secondaryChequeData.cbuNumber || undefined,
          status: serviceData.secondaryChequeData.status,
          notes: serviceData.secondaryChequeData.notes || undefined,
          image_url: undefined // TODO: Handle image upload
        });
      }

      setShowServiceForm(false);
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleAddPayment = async (paymentData: any) => {
    try {
      console.log('🔍 DEBUG: Adding payment with data:', paymentData);
      console.log('🔍 DEBUG: Available debts:', debts.map(d => ({ id: d.id, client_id: d.client_id, remaining_amount: d.remaining_amount })));
      
      // Find the original debt UUID - paymentData.debtId should already be the UUID string
      const originalDebt = debts.find(d => {
        return d.client_id === clientId && d.id === paymentData.debtId;
      });
      
      console.log('🔍 DEBUG: Found original debt:', originalDebt);
      
      if (originalDebt) {
        const result = await createDebtPayment({
          debt_id: originalDebt.id,
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod as any,
          payment_date: paymentData.date,
          notes: paymentData.notes
        });
        
        console.log('🔍 DEBUG: Payment created successfully:', result);
        
        // Force a data refresh to update the UI
        await refetch();
        
        // Return the payment ID so it can be linked to cheque if needed
        return result;
      } else {
        console.error('🚨 Could not find original debt for payment:', paymentData);
        console.error('🚨 Available debt IDs:', debts.map(d => d.id));
        console.error('🚨 Looking for debt ID:', paymentData.debtId);
        throw new Error('No se pudo encontrar la deuda original');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error; // Re-throw to show error in PaymentTracker
    }
  };

  const handleAddPaymentPlan = () => {
    setShowPaymentPlanForm(true);
  };

  const handleSavePaymentPlan = (paymentPlan: any) => {
    // TODO: Implement payment plan creation in database
    setShowPaymentPlanForm(false);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
  };

  const handleSaveEditedClient = async (updatedClient: any) => {
    if (updateClient) {
      try {
        // Transform the client data back to database format
        const dbUpdates = {
          first_name: updatedClient.firstName,
          last_name: updatedClient.lastName,
          phone: updatedClient.phone,
          email: updatedClient.email,
          address: updatedClient.city,
          tax_id: updatedClient.taxId,
          type: updatedClient.type || 'Persona',
          notes: updatedClient.notes || null, // Add notes field mapping
          // For companies, store the company name in the appropriate field
          ...(updatedClient.type === 'Empresa' ? {
            company_name: updatedClient.firstName,
            first_name: updatedClient.firstName
          } : {})
        };
        
        await updateClient(clientId!, dbUpdates);
        setEditingClient(null);
      } catch (error) {
        console.error('Failed to update client:', error);
      }
    }
  };

  const handleEditService = (serviceId: string) => {
    // Find the service in the database format
    const service = services.find(s => s.id === serviceId);
    console.log('🔍 DEBUG handleEditService - Raw service from DB:', JSON.stringify(service, null, 2));
    
    if (service) {
      // Transform to the format expected by EditServiceForm
      const transformedService = {
        id: parseInt(service.id, 36),
        clientId: parseInt(service.client_id, 36),
        date: service.service_date,
        type: service.service_type,
        vehicle: service.vehicle_info || "",
        notes: service.notes || "",
        amount: service.total_amount,
        amountDelivered: service.amount_delivered,
        paymentMethod: service.payment_method,
        secondaryPaymentMethod: service.secondary_payment_method,
        status: service.status,
        responsiblePerson: service.responsible_person,
        companyRepresentative: service.company_representative,
        signature: service.signature_data,
        service_items: service.service_items, // Keep original structure
        category: (service as any).category || 'servicio'
      };
      
      console.log('🔍 DEBUG handleEditService - Transformed service:', JSON.stringify(transformedService, null, 2));
      setEditingService(transformedService);
    }
  };

  const handleSaveEditedService = async (updatedService: any) => {
    if (updateService) {
      try {
        // Transform back to database format
        const dbUpdates = {
          service_date: updatedService.date,
          service_type: updatedService.type,
          vehicle_info: updatedService.vehicle,
          notes: updatedService.notes,
          total_amount: updatedService.amount,
          amount_delivered: updatedService.amountDelivered,
          payment_method: updatedService.paymentMethod,
          secondary_payment_method: updatedService.secondaryPaymentMethod || undefined,
          status: updatedService.status,
          responsible_person: updatedService.responsiblePerson,
          company_representative: updatedService.companyRepresentative,
          signature_data: updatedService.signature,
          service_items: updatedService.serviceItems
        };
        
        // Find the original service UUID
        const originalService = services.find(s => parseInt(s.id, 36) === updatedService.id);
        if (originalService) {
          await updateService(originalService.id, dbUpdates);
        }
        setEditingService(null);
      } catch (error) {
        console.error('Failed to update service:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <PendingServicesPanel 
        services={services.filter(s => s.client_id === clientId).map(s => ({
          ...s,
          vehicle_info: s.vehicle_info || "",
          notes: s.notes || "",
          responsible_person: s.responsible_person || "",
          category: (s as any).category || 'servicio'
        }))}
        clientName={`${client.first_name} ${client.last_name}`}
        onEditService={handleEditService}
      />
      
      <ClientProfile
        clients={transformedClients}
        services={transformedServices}
        debts={transformedDebts}
        payments={transformedPayments}
        paymentPlans={[]} // Empty for now until payment plans are implemented
        onAddService={handleAddService}
        onAddPayment={handleAddPayment}
        onAddPaymentPlan={handleAddPaymentPlan}
        setPaymentPlans={() => {}} // Empty function for now
        selectedClientId={currentTransformedClient?.id} // Pass the client UUID string directly
        onEditClient={handleEditClient}
      />
      
      {showServiceForm && (
        <ServiceForm 
          clients={transformedClients}
          onClose={() => setShowServiceForm(false)}
          onSave={handleSaveService}
        />
      )}

      {showPaymentPlanForm && (
        <PaymentPlanForm
          clients={transformedClients}
          services={transformedServices}
          onClose={() => setShowPaymentPlanForm(false)}
          onSave={handleSavePaymentPlan}
        />
      )}

      {editingClient && (
        <EditClientForm
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleSaveEditedClient}
        />
      )}

      {editingService && (
        <EditServiceForm
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleSaveEditedService}
          clientType={client.type}
        />
      )}
    </div>
  );
};

export default ClientProfilePage;
