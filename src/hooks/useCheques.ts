import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Cheque {
  id: string;
  client_id: string;
  service_id?: string;
  debt_payment_id?: string;
  bank_name: string;
  cheque_number: string;
  amount: number;
  issuance_date: string;
  payment_date: string;
  holder_name: string;
  cbu_number?: string;
  status: 'En cartera' | 'Depositado' | 'Cobrado' | 'Rechazado';
  image_url?: string;
  notes?: string;
  cheque_type?: string;
  created_at: string;
  updated_at: string;
  // Related data
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    type: string;
    company_name?: string;
  };
  services?: {
    id: string;
    service_type: string;
    status: string;
    total_amount: number;
    amount_delivered: number;
  };
}

export const useCheques = () => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCheques = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cheques')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            type,
            company_name
          ),
          services:service_id (
            id,
            service_type,
            status,
            total_amount,
            amount_delivered
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheques((data || []) as Cheque[]);
    } catch (error) {
      console.error('Error fetching cheques:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los cheques"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheque = async (chequeData: Omit<Cheque, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cheques')
        .insert(chequeData)
        .select()
        .single();

      if (error) throw error;

      setCheques(prev => [data as Cheque, ...prev]);
      toast({
        title: "Éxito",
        description: "Cheque registrado correctamente"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating cheque:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el cheque"
      });
      throw error;
    }
  };

  const updateCheque = async (id: string, updates: Partial<Cheque>) => {
    try {
      const { data, error } = await supabase
        .from('cheques')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCheques(prev => prev.map(cheque => cheque.id === id ? data as Cheque : cheque));
      toast({
        title: "Éxito",
        description: "Cheque actualizado correctamente"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating cheque:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el cheque"
      });
      throw error;
    }
  };

  const deleteCheque = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cheques')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCheques(prev => prev.filter(cheque => cheque.id !== id));
      toast({
        title: "Éxito",
        description: "Cheque eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting cheque:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el cheque"
      });
      throw error;
    }
  };

  const getChequesByClient = (clientId: string) => {
    return cheques.filter(cheque => cheque.client_id === clientId);
  };

  const getPendingCheques = () => {
    return cheques.filter(cheque => cheque.status === 'En cartera');
  };

  const getUpcomingCheques = (days: number = 3) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return cheques.filter(cheque => {
      const paymentDate = new Date(cheque.payment_date);
      const today = new Date();
      return cheque.status === 'En cartera' && 
             paymentDate >= today && 
             paymentDate <= futureDate;
    });
  };

  const getOverdueCheques = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return cheques.filter(cheque => {
      const paymentDate = new Date(cheque.payment_date);
      paymentDate.setHours(0, 0, 0, 0);
      return cheque.status === 'En cartera' && paymentDate < today;
    });
  };

  const getRejectedCheques = () => {
    return cheques.filter(cheque => cheque.status === 'Rechazado');
  };

  const getChequesByServiceId = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('cheques')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            type,
            company_name
          ),
          services:service_id (
            id,
            service_type,
            status,
            total_amount,
            amount_delivered
          )
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Cheque[];
    } catch (error) {
      console.error('Error fetching cheques by service:', error);
      return [];
    }
  };

  const getChequesByDebtPaymentId = async (debtPaymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('cheques')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            type,
            company_name
          ),
          services:service_id (
            id,
            service_type,
            status,
            total_amount,
            amount_delivered
          )
        `)
        .eq('debt_payment_id', debtPaymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Cheque[];
    } catch (error) {
      console.error('Error fetching cheques by debt payment:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchCheques();
  }, []);

  return {
    cheques,
    loading,
    createCheque,
    updateCheque,
    deleteCheque,
    getChequesByClient,
    getChequesByServiceId,
    getChequesByDebtPaymentId,
    getPendingCheques,
    getUpcomingCheques,
    getOverdueCheques,
    getRejectedCheques,
    refetch: fetchCheques
  };
};