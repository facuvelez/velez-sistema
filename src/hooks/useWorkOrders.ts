import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WorkOrder {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  client_name: string;
  client_phone: string | null;
  vehicle_info: string;
  tasks: string[];
  notes: string | null;
  status: 'pending' | 'in_progress' | 'ready_align' | 'completed';
  requires_alignment: boolean;
  created_by: string | null;
  created_by_username: string | null;
  completed_by_operator: string | null;
  completed_by_operator_username: string | null;
  completed_operator_at: string | null;
  completed_by_aligner: string | null;
  completed_by_aligner_username: string | null;
  completed_aligner_at: string | null;
  whatsapp_sent: boolean;
}

export interface NewWorkOrderInput {
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  vehicle_info: string;
  tasks: string[];
  notes?: string | null;
  requires_alignment: boolean;
}

export const useWorkOrders = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('work_orders' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('Error cargando work_orders:', error);
    } else {
      setOrders(((data as unknown) as WorkOrder[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('work_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const interval = setInterval(fetchOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const createWorkOrder = async (input: NewWorkOrderInput) => {
    const { data, error } = await supabase
      .from('work_orders' as any)
      .insert({
        client_id: input.client_id ?? null,
        client_name: input.client_name.trim(),
        client_phone: input.client_phone?.trim() || null,
        vehicle_info: input.vehicle_info.trim(),
        tasks: input.tasks,
        notes: input.notes?.trim() || null,
        requires_alignment: input.requires_alignment,
        status: 'pending',
        created_by: profile?.user_id ?? null,
        created_by_username: profile?.username ?? null,
      })
      .select()
      .single();
    if (error) {
      console.error('Error creando orden:', error);
      toast({ title: 'Error', description: 'No se pudo crear la orden', variant: 'destructive' });
      throw error;
    }
    toast({ title: 'Orden creada', description: 'La orden se envió al taller' });
    return data as unknown as WorkOrder;
  };

  const updateStatus = async (
    order: WorkOrder,
    newStatus: WorkOrder['status'],
    operatorName?: string
  ) => {
    const patch: Record<string, any> = { status: newStatus };
    const now = new Date().toISOString();
    const actorName = operatorName ?? profile?.username ?? null;
    const actorId = profile?.user_id ?? null;

    if (
      (newStatus === 'ready_align' || (newStatus === 'completed' && !order.requires_alignment)) &&
      !order.completed_operator_at
    ) {
      patch.completed_by_operator = actorId;
      patch.completed_by_operator_username = actorName;
      patch.completed_operator_at = now;
    }

    if (newStatus === 'completed' && order.requires_alignment) {
      patch.completed_by_aligner = actorId;
      patch.completed_by_aligner_username = actorName;
      patch.completed_aligner_at = now;
    }

    const { error } = await supabase
      .from('work_orders' as any)
      .update(patch)
      .eq('id', order.id);
    if (error) {
      console.error('Error actualizando estado:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
      throw error;
    }
  };

  return { orders, loading, createWorkOrder, updateStatus, refetch: fetchOrders };
};
