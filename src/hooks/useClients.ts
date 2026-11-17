import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ClientType = 'Persona' | 'Empresa';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: ClientType;
  company_name?: string;
  tax_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (!error && data) setClients(data);
  };

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data, ...prev]);
      toast({
        title: "Éxito",
        description: "Cliente creado correctamente",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === clientId ? data : c));
      
      toast({
        title: "Éxito",
        description: "Cliente actualizado correctamente",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteClient = async (clientId: string, services: any[], debts: any[]) => {
    try {
      // Check if client has services or debts
      const clientServices = services.filter(s => s.client_id === clientId);
      const clientDebts = debts.filter(d => d.client_id === clientId);
      
      if (clientServices.length > 0 || clientDebts.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar un cliente con servicios o deudas pendientes",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== clientId));
      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente",
      });
      
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    clients,
    setClients,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
};