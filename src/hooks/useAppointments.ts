import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Appointment {
  id: string;
  client_id: string;
  appointment_date: string;
  service_type: string;
  vehicle_info?: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  kilometraje?: number;
  client_phone?: string;
  whatsapp_sent?: boolean;
  completed_by_username?: string;
  completed_at?: string;
  deleted_at?: string;
  deleted_by_username?: string;
  created_at: string;
  updated_at: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();
  const { profile } = useAuth();

  const autoCompletarVencidos = async (appointments: Appointment[]) => {
    const ahora = new Date();
    const limite = 120 * 60 * 60 * 1000; // 120 horas en ms

    const vencidos = appointments.filter(apt => {
      if (apt.status !== 'scheduled' && apt.status !== 'confirmed') return false;
      const fechaTurno = new Date(apt.appointment_date);
      const diferencia = ahora.getTime() - fechaTurno.getTime();
      return diferencia > limite;
    });

    if (vencidos.length === 0) return;

    const ids = vencidos.map(a => a.id);
    const completedAt = new Date().toISOString();
    await supabase
      .from('appointments')
      .update({
        status: 'completed',
        completed_by_username: 'Sistema (auto)',
        completed_at: completedAt,
      })
      .in('id', ids);

    setAppointments(prev => prev.map(apt =>
      ids.includes(apt.id)
        ? { ...apt, status: 'completed' as const, completed_by_username: 'Sistema (auto)', completed_at: completedAt }
        : apt
    ));
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (!error && data) {
      const appointments = data as Appointment[];
      setAppointments(appointments);
      await autoCompletarVencidos(appointments);
    }
  };

  const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;

      setAppointments(prev => [data as Appointment, ...prev]);
      toast({
        title: "Éxito",
        description: "Cita programada correctamente",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo programar la cita",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;

      setAppointments(prev => prev.map(a => a.id === appointmentId ? data as Appointment : a));
      
      return data;
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cita",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      const deletedAt = new Date().toISOString();
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          deleted_at: deletedAt,
          deleted_by_username: profile?.username ?? null,
        })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.map(a =>
        a.id === appointmentId
          ? { ...a, status: 'cancelled' as const, deleted_at: deletedAt, deleted_by_username: profile?.username ?? null }
          : a
      ));

      toast({ title: 'Turno cancelado', description: 'El turno quedó registrado como cancelado.' });
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar el turno',
        variant: 'destructive',
      });
    }
  };

  const hardDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.filter(a => a.id !== appointmentId));
      toast({ title: 'Turno eliminado permanentemente' });
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el turno',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    appointments,
    setAppointments,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    hardDeleteAppointment,
  };
};