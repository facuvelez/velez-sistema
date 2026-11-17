import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExtractedItem } from '@/utils/excelPriceListParser';

export interface SupplierPriceList {
  id: string;
  supplier_brand_id: string;
  name: string;
  vehicle_type: string | null;
  source: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierPriceListItem {
  id: string;
  price_list_id: string;
  medida: string | null;
  codigo: string | null;
  descripcion: string | null;
  precio: number;
  stock: string | null;
  created_at: string;
}

export function usePriceListsByBrand(brandId: string | null) {
  return useQuery({
    queryKey: ['supplier-price-lists', brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<SupplierPriceList[]> => {
      const { data, error } = await supabase
        .from('supplier_price_lists')
        .select('*')
        .eq('supplier_brand_id', brandId as string)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SupplierPriceList[];
    },
  });
}

export function usePriceListItems(listId: string | null) {
  return useQuery({
    queryKey: ['supplier-price-list-items', listId],
    enabled: !!listId,
    queryFn: async (): Promise<SupplierPriceListItem[]> => {
      const { data, error } = await supabase
        .from('supplier_price_list_items')
        .select('*')
        .eq('price_list_id', listId as string)
        .order('medida');
      if (error) throw error;
      return (data || []) as SupplierPriceListItem[];
    },
  });
}

export interface ComparisonSnapshotInput {
  supplierBrandId: string;
  vehicleType: string;
  name: string;
  items: ExtractedItem[];
}

export function useSaveComparisonSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ supplierBrandId, vehicleType, name, items }: ComparisonSnapshotInput) => {
      const { data: list, error } = await supabase
        .from('supplier_price_lists')
        .insert({
          supplier_brand_id: supplierBrandId,
          name,
          vehicle_type: vehicleType,
          source: 'comparador',
        })
        .select()
        .single();
      if (error) throw error;

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('supplier_price_list_items').insert(
          items.map((it) => ({
            price_list_id: list.id,
            medida: it.medida,
            codigo: it.codigo,
            descripcion: it.descripcion,
            precio: it.precio,
          }))
        );
        if (itemsError) throw itemsError;
      }
      return list as SupplierPriceList;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-price-lists', vars.supplierBrandId] });
    },
  });
}

/** Una lista se considera vencida si tiene más de 2 meses. */
export function isListaVencida(uploadedAt: string): boolean {
  const d = new Date(uploadedAt);
  const limite = new Date();
  limite.setMonth(limite.getMonth() - 2);
  return d < limite;
}
