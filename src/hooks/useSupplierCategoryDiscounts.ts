import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  CATEGORIA_TODOS_LOS_ARTICULOS,
  SUPPLIER_CATEGORIES,
} from '@/lib/supplierCategories';

export interface SupplierCategoryDiscount {
  id: string;
  supplier_id: string;
  category: string;
  brand: string | null;
  /** @deprecated usar subcategoria/origen/construccion */
  segment: string | null;
  subcategoria: string | null;
  origen: string | null;
  construccion: string | null;
  discount_percent_1: number;
  discount_percent_2: number | null;
  discount_percent_3: number | null;
  discount_percent_4: number | null;
  discount_percent_5: number | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORIAS_DESCUENTO_BASE = [
  CATEGORIA_TODOS_LOS_ARTICULOS,
  ...SUPPLIER_CATEGORIES,
];

export function useSupplierCategoryDiscounts() {
  const queryClient = useQueryClient();
  const { user, authReady } = useAuth();

  const query = useQuery({
    queryKey: ['supplier_category_discounts'],
    enabled: authReady && !!user,
    queryFn: async (): Promise<SupplierCategoryDiscount[]> => {
      const { data, error } = await supabase
        .from('supplier_category_discounts')
        .select('*')
        .order('category');
      if (error) throw error;
      return (data || []) as SupplierCategoryDiscount[];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['supplier_category_discounts'] });

  const upsertDiscount = useMutation({
    mutationFn: async (
      input: Partial<SupplierCategoryDiscount> & {
        supplier_id: string;
        category: string;
        subcategoria?: string | null;
        origen?: string | null;
        construccion?: string | null;
      }
    ) => {
      const payload = {
        supplier_id: input.supplier_id,
        category: input.category.trim(),
        brand: input.brand?.trim() ? input.brand.trim() : null,
        subcategoria: input.subcategoria?.trim() ? input.subcategoria.trim() : null,
        origen: input.origen?.trim() ? input.origen.trim() : null,
        construccion: input.construccion?.trim() ? input.construccion.trim() : null,
        discount_percent_1: input.discount_percent_1 ?? 0,
        discount_percent_2: input.discount_percent_2 ?? null,
        discount_percent_3: input.discount_percent_3 ?? null,
        discount_percent_4: input.discount_percent_4 ?? null,
        discount_percent_5: input.discount_percent_5 ?? null,
      };
      if (input.id) {
        const { error } = await supabase
          .from('supplier_category_discounts')
          .update(payload)
          .eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('supplier_category_discounts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: (e: Error) =>
      toast({ title: 'No se pudo guardar el descuento', description: e.message, variant: 'destructive' }),
  });

  const deleteDiscount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplier_category_discounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Descuento eliminado' });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    discounts: query.data || [],
    isLoading: query.isLoading,
    upsertDiscount,
    deleteDiscount,
  };
}
