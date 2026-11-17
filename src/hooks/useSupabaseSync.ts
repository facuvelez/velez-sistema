import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClients } from './useClients';
import { useServices } from './useServices';
import { useDebts } from './useDebts';
import { useAppointments } from './useAppointments';

export const useSupabaseSync = () => {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const clientsHook = useClients();
  const servicesHook = useServices();
  const debtsHook = useDebts();
  const appointmentsHook = useAppointments();

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Ejecutar cada fetch de forma independiente para que un error
      // en uno no cancele los demás
      await Promise.allSettled([
        clientsHook.fetchClients(),
        servicesHook.fetchServices(),
        debtsHook.fetchDebts(),
        debtsHook.fetchDebtPayments(),
        appointmentsHook.fetchAppointments(),
      ]);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced create service with debt refresh
  const createService = async (serviceData: any) => {
    const result = await servicesHook.createService(serviceData);
    // Refresh debts as they might have been auto-created
    await debtsHook.fetchDebts();
    return result;
  };

  // Enhanced create debt payment with sync
  const createDebtPayment = async (paymentData: any) => {
    const result = await debtsHook.createDebtPayment(paymentData);
    
    // Execute debt calculations fix to ensure consistency
    try {
      await supabase.rpc('fix_debt_calculations');
    } catch (error) {
      console.log('Note: fix_debt_calculations function not available or permission denied');
    }
    
    // Refresh debts and services as they are automatically updated by database triggers
    await Promise.all([
      debtsHook.fetchDebts(),
      servicesHook.fetchServices()
    ]);
    return result;
  };

  // Enhanced update service with debt refresh
  const updateService = async (serviceId: string, updates: any) => {
    const result = await servicesHook.updateService(serviceId, updates);
    // Refresh debts as they might have been updated
    await debtsHook.fetchDebts();
    return result;
  };

  // Enhanced cancel debt with service refresh
  const cancelDebt = async (debtId: string) => {
    await debtsHook.cancelDebt(debtId);
    // Refresh data to get updated states
    await Promise.all([
      debtsHook.fetchDebts(),
      servicesHook.fetchServices()
    ]);
  };

  // Enhanced mark debt uncollectible with refresh
  const markDebtUncollectible = async (debtId: string) => {
    await debtsHook.markDebtUncollectible(debtId);
    // Refresh data to get updated states
    await Promise.all([
      debtsHook.fetchDebts(),
      servicesHook.fetchServices()
    ]);
  };

  // Enhanced delete client with validation
  const deleteClient = async (clientId: string) => {
    await clientsHook.deleteClient(clientId, servicesHook.services, debtsHook.debts);
  };

  // Enhanced delete service with validation
  const deleteService = async (serviceId: string) => {
    await servicesHook.deleteService(serviceId, debtsHook.debts);
  };

  // Sync all data - for manual refresh
  const syncAllData = async () => {
    try {
      setLoading(true);
      
      // First, execute debt calculations fix to ensure consistency
      try {
        await supabase.rpc('fix_debt_calculations');
      } catch (error) {
        console.log('Note: fix_debt_calculations function not available or permission denied');
      }
      
      await Promise.all([
        clientsHook.fetchClients(),
        servicesHook.fetchServices(), 
        debtsHook.fetchDebts(),
        appointmentsHook.fetchAppointments(),
        debtsHook.fetchDebtPayments()
      ]);
      
      toast({
        title: "Éxito",
        description: "Todos los datos han sido sincronizados",
      });
    } catch (error: any) {
      console.error('Error syncing data:', error);
      toast({
        title: "Error",
        description: "Error al sincronizar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Set up real-time subscriptions
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        clientsHook.fetchClients();
      })
      .subscribe();

    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        // When services change, refresh both services and debts to keep them in sync
        servicesHook.fetchServices();
        debtsHook.fetchDebts();
      })
      .subscribe();

    const debtsSubscription = supabase
      .channel('debts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => {
        // When debts change, refresh both debts and services to keep them in sync
        debtsHook.fetchDebts();
        servicesHook.fetchServices();
      })
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debt_payments' }, () => {
        // When a payment is made, we need to refresh both payments, debts AND services
        // because the service status should automatically update via database triggers
        const fetchPaymentsAndSync = async () => {
          await debtsHook.fetchDebtPayments();
          // Also refresh debts and services to show updated status
          debtsHook.fetchDebts();
          servicesHook.fetchServices();
        };
        fetchPaymentsAndSync();
      })
      .subscribe();

    const appointmentsSubscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        appointmentsHook.fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(clientsSubscription);
      supabase.removeChannel(servicesSubscription);
      supabase.removeChannel(debtsSubscription);
      supabase.removeChannel(paymentsSubscription);
      supabase.removeChannel(appointmentsSubscription);
    };
  }, []);

  return {
    // Data
    clients: clientsHook.clients,
    services: servicesHook.services,
    debts: debtsHook.debts,
    debtPayments: debtsHook.debtPayments,
    appointments: appointmentsHook.appointments,
    loading,
    
    // Client operations
    createClient: clientsHook.createClient,
    updateClient: clientsHook.updateClient,
    deleteClient,
    
    // Service operations
    createService,
    updateService,
    deleteService,
    
    // Debt operations
    createDebtPayment,
    cancelDebt,
    markDebtUncollectible,
    
    // Appointment operations
    createAppointment: appointmentsHook.createAppointment,
    updateAppointment: appointmentsHook.updateAppointment,
    deleteAppointment: appointmentsHook.deleteAppointment,
    hardDeleteAppointment: appointmentsHook.hardDeleteAppointment,
    
    // Utilities
    syncAllData,
    refetch: fetchData
  };
};
