
import { Client, Service, Debt, Payment } from '@/types/shared';
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, FileText, Truck, Calculator, Ruler, Wrench, Calendar, ArrowLeft, TrendingUp, Route } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import ClientsList from "@/components/ClientsList";
import DebtsList from "@/components/DebtsList";
import ClientForm from "@/components/ClientForm";
import ServiceForm from "@/components/ServiceForm";
import SaleForm from "@/components/SaleForm";
import Dashboard from "@/components/Dashboard";
import AppointmentsList from "@/components/AppointmentsList";
import UserManagement from "@/components/UserManagement";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useCheques } from "@/hooks/useCheques";
import { formatCurrency } from "@/utils/numberFormatter";
import { useToast } from "@/hooks/use-toast";
import ModuleGrid, { Bienvenida, type GrupoModulos } from "@/components/ModuleGrid";

const Index = () => {
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab') || "home";
    return ['cheques', 'analytics'].includes(tab) ? 'home' : tab;
  });
  const [showClientForm, setShowClientForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedClientForSummary, setSelectedClientForSummary] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  // Update activeTab when URL changes; redirect legacy tabs to home
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(['cheques', 'analytics'].includes(tabFromUrl) ? 'home' : tabFromUrl);
    }
  }, [searchParams]);

  // Redirect operators and alineadores to their dedicated dashboard
  if (profile?.role === 'Operator') return <Navigate to="/operator" replace />;
  if (profile?.role === 'Alineador') return <Navigate to="/alineador" replace />;

  // Use database integration
  const {
    clients,
    services,
    debts,
    debtPayments,
    appointments,
    loading,
    createClient,
    createService,
    createDebtPayment,
    updateService,
    updateClient,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    hardDeleteAppointment,
    refetch
  } = useSupabaseSync();
  
  const { createCheque } = useCheques();

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };


  // Helper function to convert UUID to consistent number
  const uuidToNumber = (uuid: string) => {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      const char = uuid.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Transform data for compatibility with existing components
  const transformedClients = clients.map(client => ({
    id: client.id,
    firstName: client.first_name,
    lastName: client.last_name,
    phone: client.phone || "",
    email: client.email || "",
    city: client.address || "",
    type: client.type,
    notes: "",
    createdAt: client.created_at
  }));

  const transformedServices = services.map(service => ({
    id: service.id, // Keep UUID as string
    clientId: service.client_id,
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
    serviceItems: service.service_items,
    category: (service as any).category || 'servicio' // Add category field
  }));

  const transformedDebts = debts.map(debt => ({
    id: debt.id, // Keep UUID as string
    clientId: debt.client_id,
    serviceId: debt.service_id, // Keep UUID as string
    amount: debt.original_amount,
    remainingAmount: debt.remaining_amount,
    dueDate: debt.created_at, // Use creation date as due date for compatibility
    status: (debt as any).status || 'active' as 'active' | 'uncollectible',
    comments: "",
    signature: "",
    createdAt: debt.created_at
  }));

  const transformedPayments = debtPayments.map(payment => ({
    id: payment.id, // Keep UUID as string
    debtId: payment.debt_id, // Keep UUID as string
    amount: payment.amount,
    paymentMethod: payment.payment_method,
    date: payment.payment_date,
    notes: payment.notes || ""
  }));

  // Add client names to payments for reports
  const paymentsWithClientNames = transformedPayments.map(payment => {
    const debt = transformedDebts.find(d => d.id === payment.debtId);
    const client = debt ? transformedClients.find(c => c.id === debt.clientId) : null;
    return {
      ...payment,
      clientName: client ? `${client.firstName} ${client.lastName}` : 'N/A'
    };
  });

  const handleSaveClient = async (clientData: any) => {
    try {
      await createClient({
        first_name: clientData.firstName,
        last_name: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.city,
        type: clientData.type || 'Persona',
        company_name: clientData.companyName,
        tax_id: clientData.taxId
      });
      setShowClientForm(false);
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleSaveService = async (serviceData: any) => {
    try {
      const service = await createService({
        client_id: serviceData.clientId,
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
          client_id: serviceData.clientId,
          service_id: service.id,
          bank_name: serviceData.chequeData.bankName,
          cheque_number: serviceData.chequeData.chequeNumber,
          amount: typeof serviceData.amount === 'string' ? parseFloat(serviceData.amount) : serviceData.amount,
          issuance_date: serviceData.chequeData.issuanceDate,
          payment_date: serviceData.chequeData.paymentDate,
          holder_name: serviceData.chequeData.holderName,
          cbu_number: serviceData.chequeData.cbuNumber || undefined,
          status: serviceData.chequeData.status || 'En cartera',
          notes: serviceData.chequeData.notes || undefined,
          image_url: undefined // TODO: Handle image upload
        });
      }

      // Create secondary cheque record if secondary payment method is cheque
      if (serviceData.secondaryChequeData && serviceData.secondaryPaymentMethod === 'Cheque') {
        await createCheque({
          client_id: serviceData.clientId,
          service_id: service.id,
          bank_name: serviceData.secondaryChequeData.bankName,
          cheque_number: serviceData.secondaryChequeData.chequeNumber,
          amount: typeof serviceData.amount === 'string' ? parseFloat(serviceData.amount) : serviceData.amount,
          issuance_date: serviceData.secondaryChequeData.issuanceDate,
          payment_date: serviceData.secondaryChequeData.paymentDate,
          holder_name: serviceData.secondaryChequeData.holderName,
          cbu_number: serviceData.secondaryChequeData.cbuNumber || undefined,
          status: serviceData.secondaryChequeData.status || 'En cartera',
          notes: serviceData.secondaryChequeData.notes || undefined,
          image_url: undefined // TODO: Handle image upload
        });
      }

      toast({
        title: "Nuevo servicio creado",
        description: "El servicio se ha registrado exitosamente",
      });
      
      // Delay closing the form to allow the toast to be visible
      setTimeout(() => {
        setShowServiceForm(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el servicio",
        variant: "destructive"
      });
    }
  };

  const handleSaveSale = async (saleData: any) => {
    try {
      const sale = await createService({
        client_id: saleData.clientId,
        service_date: saleData.date,
        service_type: saleData.type,
        vehicle_info: saleData.vehicle,
        notes: saleData.notes,
        total_amount: saleData.amount,
        amount_delivered: saleData.amountDelivered,
        payment_method: saleData.paymentMethod,
        // Only include secondary payment method if it's actually provided and not null/empty
        secondary_payment_method: saleData.secondaryPaymentMethod || undefined,
        status: saleData.status,
        responsible_person: saleData.responsiblePerson,
        company_representative: saleData.companyRepresentative,
        signature_data: saleData.signature,
        service_items: saleData.serviceItems,
        category: 'venta' // Mark as sale
      });

      // Create cheque records if payment method is cheque
      if (saleData.chequeData && saleData.paymentMethod === 'Cheque') {
        await createCheque({
          client_id: saleData.clientId,
          service_id: sale.id,
          bank_name: saleData.chequeData.bankName,
          cheque_number: saleData.chequeData.chequeNumber,
          amount: typeof saleData.amount === 'string' ? parseFloat(saleData.amount) : saleData.amount,
          issuance_date: saleData.chequeData.issuanceDate,
          payment_date: saleData.chequeData.paymentDate,
          holder_name: saleData.chequeData.holderName,
          cbu_number: saleData.chequeData.cbuNumber || undefined,
          status: saleData.chequeData.status || 'En cartera',
          notes: saleData.chequeData.notes || undefined,
          image_url: undefined // TODO: Handle image upload
        });
      }

      // Create secondary cheque record if secondary payment method is cheque
      if (saleData.secondaryChequeData && saleData.secondaryPaymentMethod === 'Cheque') {
        await createCheque({
          client_id: saleData.clientId,
          service_id: sale.id,
          bank_name: saleData.secondaryChequeData.bankName,
          cheque_number: saleData.secondaryChequeData.chequeNumber,
          amount: typeof saleData.amount === 'string' ? parseFloat(saleData.amount) : saleData.amount,
          issuance_date: saleData.secondaryChequeData.issuanceDate,
          payment_date: saleData.secondaryChequeData.paymentDate,
          holder_name: saleData.secondaryChequeData.holderName,
          cbu_number: saleData.secondaryChequeData.cbuNumber || undefined,
          status: saleData.secondaryChequeData.status || 'En cartera',
          notes: saleData.secondaryChequeData.notes || undefined,
          image_url: undefined // TODO: Handle image upload
        });
      }

      setShowSaleForm(false);
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Dashboard simplificado para el rol Administracion: solo 4 accesos directos
  if (profile?.role === 'Administracion') {
    const tabParam = searchParams.get('tab');

    if (tabParam === 'appointments') {
      return (
        <div className="min-h-screen bg-background">
          <AppHeader />
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <AppointmentsList
              appointments={appointments}
              clients={clients}
              onCreateAppointment={createAppointment}
              onUpdateAppointment={updateAppointment}
              onDeleteAppointment={deleteAppointment}
              onHardDeleteAppointment={hardDeleteAppointment}
            />
          </div>
        </div>
      );
    }

    const grupos: GrupoModulos[] = [
      {
        titulo: 'Taller y servicio',
        modulos: [
          { title: 'Turnos', desc: 'Agenda de alineación y servicios', icon: Calendar, to: '/?tab=appointments' },
          { title: 'Taller', desc: 'Órdenes de trabajo en curso', icon: Wrench, to: '/taller' },
          { title: 'Comparador de medidas', desc: 'Equivalencias y reemplazos de cubiertas', icon: Ruler, to: '/comparador' },
        ],
      },
      {
        titulo: 'Ventas',
        modulos: [
          { title: 'Presupuestador', desc: 'Armá y enviá presupuestos', icon: FileText, to: '/presupuesto' },
          ...(hasRole('Administrator') ? [{ title: 'Competencia', desc: 'Nuestros precios vs MercadoLibre', icon: TrendingUp, to: '/competencia' }] : []),
        ],
      },
      {
        titulo: 'Logística',
        modulos: [
          { title: 'Comisionistas', desc: 'Recorridos y quién conviene para cada envío', icon: Route, to: '/comisionistas' },
        ],
      },
    ];
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto max-w-6xl px-4 py-8">
          <Bienvenida nombre={profile?.username} />
          <ModuleGrid grupos={grupos} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />


      <div className="container mx-auto max-w-7xl px-3 py-6 sm:px-4">
        {/* Main Content */}
        <div>
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="mb-8 overflow-x-auto">
                <TabsList>
                  <TabsTrigger value="home" className="px-4">
                    Inicio
                  </TabsTrigger>
                  <TabsTrigger value="appointments" className="px-4">
                    Turnos
                  </TabsTrigger>
                  {hasRole('Administrator') && (
                    <TabsTrigger value="clients" className="px-4">
                      Clientes
                    </TabsTrigger>
                  )}
                  {hasRole('Administrator') && (
                    <TabsTrigger value="users" className="px-4">
                      <Settings className="mr-1.5 h-4 w-4" />
                      Usuarios
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="home" className="mt-0">
                <Bienvenida nombre={profile?.username} />
                <ModuleGrid
                  grupos={[
                    {
                      titulo: 'Ventas y precios',
                      modulos: [
                        { title: 'Presupuestador', desc: 'Armá y enviá presupuestos por WhatsApp', icon: FileText, to: '/presupuesto' },
                        { title: 'Proveedores', desc: 'Marcas, descuentos y listas', icon: Truck, to: '/suppliers' },
                        { title: 'Precios', desc: 'Simulador de flujos de precio', icon: Calculator, to: '/price-flows' },
                        ...(hasRole('Administrator') ? [{ title: 'Competencia', desc: 'Nuestros precios vs MercadoLibre', icon: TrendingUp, to: '/competencia' }] : []),
                      ],
                    },
                    {
                      titulo: 'Taller y servicio',
                      modulos: [
                        { title: 'Taller', desc: 'Órdenes de trabajo en curso', icon: Wrench, to: '/taller' },
                        { title: 'Comparador de medidas', desc: 'Equivalencias y reemplazos de cubiertas', icon: Ruler, to: '/comparador' },
                      ],
                    },
                    {
                      titulo: 'Logística',
                      modulos: [
                        { title: 'Comisionistas', desc: 'Recorridos y quién conviene para cada envío', icon: Route, to: '/comisionistas' },
                      ],
                    },
                  ]}
                />
              </TabsContent>


              <TabsContent value="dashboard">
                <Dashboard clients={transformedClients} services={transformedServices} debts={transformedDebts} payments={transformedPayments} />
              </TabsContent>

              <TabsContent value="clients">
                <ClientsList 
                  clients={transformedClients} 
                  originalClients={clients}
                  services={transformedServices}
                  debts={transformedDebts}
                  payments={transformedPayments}
                  setClients={() => {}} 
                  updateClient={updateClient}
                />
              </TabsContent>


              <TabsContent value="debts">
                <DebtsList 
                  debts={transformedDebts} 
                  clients={transformedClients} 
                  services={transformedServices} 
                  payments={transformedPayments}
                  originalDebts={debts}
                  setDebts={() => {}}
                  setPayments={() => {}}
                  onAddPayment={createDebtPayment}
                  
                />
              </TabsContent>

              <TabsContent value="appointments">
                <AppointmentsList
                  appointments={appointments}
                  clients={clients}
                  onCreateAppointment={createAppointment}
                  onUpdateAppointment={updateAppointment}
                  onDeleteAppointment={deleteAppointment}
              onHardDeleteAppointment={hardDeleteAppointment}
                />
              </TabsContent>

              {/* Tabs Cheques and Estadísticas removed per user request */}

              {hasRole('Administrator') && (
                <TabsContent value="users">
                  <UserManagement />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        {/* Modals */}
        {showClientForm && (
          <ClientForm 
            onClose={() => setShowClientForm(false)}
            onSave={handleSaveClient}
          />
        )}

        {showServiceForm && (
          <ServiceForm 
            clients={transformedClients}
            onClose={() => setShowServiceForm(false)}
            onSave={handleSaveService}
          />
        )}

        {showSaleForm && (
          <SaleForm 
            clients={transformedClients}
            onClose={() => setShowSaleForm(false)}
            onSave={handleSaveSale}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
