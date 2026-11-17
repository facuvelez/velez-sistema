import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { PriceFlow, PriceFlowTier, MarginMode } from '@/utils/priceFlowCalculator';

export type { PriceFlow, PriceFlowTier, MarginMode } from '@/utils/priceFlowCalculator';

export interface PriceFlowWithTiers extends PriceFlow {
  tiers: PriceFlowTier[];
}

export function usePriceFlow() {
  const queryClient = useQueryClient();
  const { user, authReady } = useAuth();

  const query = useQuery({
    queryKey: ['price-flow', 'default'],
    enabled: authReady && !!user,
    queryFn: async (): Promise<PriceFlowWithTiers | null> => {
      const { data: flow, error: fErr } = await supabase
        .from('price_flows')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();
      if (fErr) {
        console.error('[usePriceFlow] price_flows select error:', fErr);
        throw fErr;
      }
      if (!flow) return null;

      const { data: tiers, error: tErr } = await supabase
        .from('price_flow_tiers')
        .select('*')
        .eq('flow_id', flow.id)
        .order('sort_order');
      if (tErr) {
        console.error('[usePriceFlow] price_flow_tiers select error:', tErr);
        throw tErr;
      }

      return { ...(flow as PriceFlow), tiers: (tiers || []) as PriceFlowTier[] };
    },
  });


  const updateFlow = useMutation({
    mutationFn: async (input: Partial<Omit<PriceFlow, 'id'>> & { id: string }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from('price_flows').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-flow'] });
      toast({ title: 'Flujo actualizado' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const upsertTier = useMutation({
    mutationFn: async (input: Partial<PriceFlowTier> & { flow_id: string }) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from('price_flow_tiers').update(patch).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('price_flow_tiers').insert(input as never);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['price-flow'] }),
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('price_flow_tiers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['price-flow'] }),
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    flow: query.data ?? null,
    isLoading: !authReady || !user || query.isLoading,
    updateFlow,
    upsertTier,
    deleteTier,
  };
}

