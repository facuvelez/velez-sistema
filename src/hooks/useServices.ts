import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type PaymentMethod = 'Efectivo' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Transferencia Bancaria' | 'Cheque' | 'Echeq';
type ServiceStatus = 'pending' | 'partial' | 'paid';

export interface Service {
  id: string;
  client_id: string;
  service_date: string;
  service_type: string;
  vehicle_info?: string;
  notes?: string;
  total_amount: number;
  amount_delivered: number;
  payment_method: PaymentMethod;
  secondary_payment_method?: PaymentMethod;
  status: ServiceStatus;
  responsible_person?: string;
  company_representative?: string;
  signature_data?: string;
  service_items?: any;
  created_at: string;
  updated_at: string;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const { toast } = useToast();

  const fetchServices = async () => {
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    if (!error && data) setServices(data);
  };

  const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (error) throw error;

      setServices(prev => [data, ...prev]);
      toast({
        title: "Éxito",
        description: "Servicio creado correctamente",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el servicio",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;

      setServices(prev => prev.map(s => s.id === serviceId ? data : s));
      
      return data;
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el servicio",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteService = async (serviceId: string, debts: any[]) => {
    try {
      // Check if service has associated debts
      const serviceDebts = debts.filter(d => d.service_id === serviceId);
      
      if (serviceDebts.length > 0) {
        toast({
          title: "Error", 
          description: "No se puede eliminar un servicio con deudas pendientes",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      });
      
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el servicio",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    services,
    setServices,
    fetchServices,
    createService,
    updateService,
    deleteService,
  };
};