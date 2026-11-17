import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type PaymentMethod = 'Efectivo' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Transferencia Bancaria' | 'Cheque' | 'Echeq';

export interface Debt {
  id: string;
  client_id: string;
  service_id: string;
  original_amount: number;
  remaining_amount: number;
  status: 'active' | 'uncollectible';
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const { toast } = useToast();

  const fetchDebts = async () => {
    const { data, error } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
    if (!error && data) setDebts(data as Debt[]);
  };

  const fetchDebtPayments = async () => {
    const { data, error } = await supabase.from('debt_payments').select('*').order('created_at', { ascending: false });
    if (!error && data) setDebtPayments(data);
  };

  const createDebtPayment = async (paymentData: Omit<DebtPayment, 'id' | 'created_at'>) => {
    try {
      // Find the debt to validate payment amount
      const debt = debts.find(d => d.id === paymentData.debt_id);
      if (!debt) {
        throw new Error('Deuda no encontrada');
      }

      // Calculate total payments for this debt
      const existingPayments = debtPayments.filter(p => p.debt_id === paymentData.debt_id);
      const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingBalance = debt.remaining_amount;
      
      // Validate payment amount (only allow overpayment for cheques)
      if (paymentData.payment_method !== 'Cheque' && paymentData.amount > remainingBalance) {
        toast({
          title: "Error",
          description: `El monto del pago ($${paymentData.amount.toLocaleString()}) no puede ser mayor al saldo pendiente ($${remainingBalance.toLocaleString()})`,
          variant: "destructive"
        });
        throw new Error(`El monto del pago no puede ser mayor al saldo pendiente`);
      }

      const { data, error } = await supabase
        .from('debt_payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;

      setDebtPayments(prev => [data, ...prev]);
      
      // Refresh debts to get updated remaining_amount from database
      await fetchDebts();
      
      toast({
        title: "Éxito",
        description: "Pago registrado correctamente",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el pago",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelDebt = async (debtId: string) => {
    try {
      // Use the database function to cancel debt and sync service
      const { error } = await supabase.rpc('cancel_debt', {
        debt_id_param: debtId
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Deuda cancelada correctamente",
      });
      
    } catch (error: any) {
      console.error('Error canceling debt:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la deuda",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markDebtUncollectible = async (debtId: string) => {
    try {
      const { error } = await supabase
        .from('debts')
        .update({ status: 'uncollectible' })
        .eq('id', debtId);

      if (error) throw error;

      // Refresh debts list
      await fetchDebts();

      toast({
        title: "Éxito",
        description: "Deuda marcada como incobrable",
      });
      
    } catch (error: any) {
      console.error('Error marking debt as uncollectible:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar la deuda como incobrable",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    debts,
    debtPayments,
    setDebts,
    setDebtPayments,
    fetchDebts,
    fetchDebtPayments,
    createDebtPayment,
    cancelDebt,
    markDebtUncollectible,
  };
};