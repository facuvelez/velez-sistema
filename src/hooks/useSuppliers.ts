import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';


export interface SupplierBrand {
  id: string;
  supplier_id: string;
  brand: string;
  display_brand: string | null;
  /** @deprecated usar subcategoria/origen/construccion */
  segment: string | null;
  subcategoria: string | null;
  origen: string | null;
  construccion: string | null;
  category: string | null;
  vehicle_types: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  notes_updated_at: string | null;
  province: string | null;
  categories: string[];
  currency: string;
  exchange_rate: number | null;
  exchange_rate_source: string;
  exchange_rate_updated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brands?: SupplierBrand[];
  /** Max uploaded_at across all brands' price lists; null if none. */
  lastPriceUpdate?: string | null;
}

export type SupplierInput = Omit<
  Supplier,
  'id' | 'created_at' | 'updated_at' | 'brands' | 'lastPriceUpdate' | 'province' | 'currency' | 'exchange_rate' | 'exchange_rate_source' | 'exchange_rate_updated_at' | 'notes_updated_at'
> & {
  province?: string | null;
  currency?: string;
  exchange_rate?: number | null;
  exchange_rate_source?: string;
  exchange_rate_updated_at?: string | null;
};

export function useSuppliers() {
  const queryClient = useQueryClient();
  const { user, authReady } = useAuth();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    enabled: authReady && !!user,
    queryFn: async (): Promise<Supplier[]> => {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) {
        console.error('[useSuppliers] suppliers select error:', error);
        throw error;
      }

      const { data: brands, error: brandsError } = await supabase
        .from('supplier_brands')
        .select('*');
      if (brandsError) {
        console.error('[useSuppliers] supplier_brands select error:', brandsError);
        throw brandsError;
      }

      const { data: priceLists, error: listsError } = await supabase
        .from('supplier_price_lists')
        .select('supplier_brand_id, uploaded_at');
      if (listsError) {
        console.error('[useSuppliers] supplier_price_lists select error:', listsError);
        throw listsError;
      }

      const brandToSupplier = new Map<string, string>();
      (brands || []).forEach((b) => brandToSupplier.set(b.id, b.supplier_id));

      const lastBySupplier = new Map<string, string>();
      (priceLists || []).forEach((l) => {
        const supplierId = brandToSupplier.get(l.supplier_brand_id);
        if (!supplierId || !l.uploaded_at) return;
        const current = lastBySupplier.get(supplierId);
        if (!current || l.uploaded_at > current) lastBySupplier.set(supplierId, l.uploaded_at);
      });

      return (suppliers || []).map((s) => ({
        ...s,
        brands: (brands || []).filter((b) => b.supplier_id === s.id),
        lastPriceUpdate: lastBySupplier.get(s.id) ?? null,
      }));
    },
  });


  const createSupplier = useMutation({
    mutationFn: async (input: SupplierInput) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Proveedor creado correctamente' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...input }: Partial<SupplierInput> & { id: string }) => {
      const payload: Record<string, unknown> = { ...input };
      if ('notes' in input) {
        payload.notes_updated_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Proveedor actualizado' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('supplier_brands').delete().eq('supplier_id', id);
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Proveedor eliminado' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addBrand = useMutation({
    mutationFn: async (
      input: Omit<
        SupplierBrand,
        | 'id'
        | 'created_at'
        | 'updated_at'
        | 'vehicle_types'
        | 'display_brand'
        | 'segment'
        | 'subcategoria'
        | 'origen'
        | 'construccion'
      > & {
        vehicle_types?: string[];
        display_brand?: string | null;
        subcategoria?: string | null;
        origen?: string | null;
        construccion?: string | null;
      }
    ) => {
      const { data, error } = await supabase
        .from('supplier_brands')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Marca agregada' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateBrand = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Omit<SupplierBrand, 'created_at' | 'updated_at'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('supplier_brands')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Marca actualizada' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplier_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    suppliers: suppliersQuery.data || [],
    isLoading: !authReady || !user || suppliersQuery.isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addBrand,
    updateBrand,
    deleteBrand,
  };
}
