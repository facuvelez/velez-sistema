import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DebtCancellationStats {
  average_days: number | null;
  total_paid_debts: number;
  category: 'rapido' | 'normal' | 'lento' | 'sin_historial';
}

export const useDebtCancellationStats = (clientId: string) => {
  const [stats, setStats] = useState<DebtCancellationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: rpcError } = await supabase.rpc(
        'get_client_avg_debt_cancellation_days',
        { client_uuid: clientId }
      );

      if (rpcError) throw rpcError;
      
      // The RPC function returns data nested under the function name
      const statsData = (data as any)?.get_client_avg_debt_cancellation_days || data;
      setStats(statsData as DebtCancellationStats);
    } catch (err: any) {
      console.error('Error fetching debt cancellation stats:', err);
      setError(err.message || 'Error al obtener estadísticas de cancelación');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [clientId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};