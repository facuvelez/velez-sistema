import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { calculateFinalUnitCost, calculateSubtotal } from '@/utils/supplierCostCalculator';


export interface PurchaseItemInput {
  brand: string | null;
  category: string | null;
  vehicle_type: string | null;
  description: string | null;
  quantity: number;
  list_price: number;
  discount_percent: number;
  freight_percent: number;
}

export interface PurchaseItem extends PurchaseItemInput {
  id: string;
  purchase_id: string;
  final_unit_cost: number;
  subtotal: number;
  created_at: string;
}

export interface SupplierPurchase {
  id: string;
  supplier_id: string;
  purchase_date: string;
  invoice_number: string | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseItem[];
  supplier_name?: string;
}

export interface PurchaseInput {
  supplier_id: string;
  purchase_date: string;
  invoice_number: string | null;
  notes: string | null;
  items: PurchaseItemInput[];
}

export function useSupplierPurchases() {
  const queryClient = useQueryClient();
  const { user, authReady } = useAuth();

  const purchasesQuery = useQuery({
    queryKey: ['supplier-purchases'],
    enabled: authReady && !!user,
    queryFn: async (): Promise<SupplierPurchase[]> => {
      const { data: purchases, error } = await supabase
        .from('supplier_purchases')
        .select('*')
        .order('purchase_date', { ascending: false });
      if (error) {
        console.error('[useSupplierPurchases] purchases select error:', error);
        throw error;
      }

      const { data: items, error: itemsError } = await supabase
        .from('supplier_purchase_items')
        .select('*');
      if (itemsError) {
        console.error('[useSupplierPurchases] items select error:', itemsError);
        throw itemsError;
      }

      const { data: suppliers } = await supabase.from('suppliers').select('id, name');

      return (purchases || []).map((p) => ({
        ...p,
        items: (items || []).filter((it) => it.purchase_id === p.id) as PurchaseItem[],
        supplier_name: suppliers?.find((s) => s.id === p.supplier_id)?.name || '—',
      }));
    },
  });


  const createPurchase = useMutation({
    mutationFn: async (input: PurchaseInput) => {
      const computed = input.items.map((it) => {
        const final_unit_cost = calculateFinalUnitCost(
          it.list_price,
          it.discount_percent,
          0,
          it.freight_percent
        );
        return {
          ...it,
          final_unit_cost,
          subtotal: calculateSubtotal(final_unit_cost, it.quantity),
        };
      });
      const total_amount = computed.reduce((s, it) => s + it.subtotal, 0);

      const { data: purchase, error } = await supabase
        .from('supplier_purchases')
        .insert({
          supplier_id: input.supplier_id,
          purchase_date: input.purchase_date,
          invoice_number: input.invoice_number,
          notes: input.notes,
          total_amount,
        })
        .select()
        .single();
      if (error) throw error;

      if (computed.length > 0) {
        const { error: itemsError } = await supabase
          .from('supplier_purchase_items')
          .insert(computed.map((it) => ({ ...it, purchase_id: purchase.id })));
        if (itemsError) throw itemsError;
      }

      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-purchases'] });
      toast({ title: 'Compra registrada correctamente' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('supplier_purchase_items').delete().eq('purchase_id', id);
      const { error } = await supabase.from('supplier_purchases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-purchases'] });
      toast({ title: 'Compra eliminada' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    purchases: purchasesQuery.data || [],
    isLoading: !authReady || !user || purchasesQuery.isLoading,
    createPurchase,
    deletePurchase,
  };
}
