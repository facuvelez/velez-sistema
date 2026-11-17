import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SupplierExcelTemplate {
  id: string;
  supplier_id: string;
  sheet_name: string | null;
  column_medida: string | null;
  column_codigo: string | null;
  column_descripcion: string | null;
  column_precio: string;
  header_row: number | null;
  created_at: string;
  updated_at: string;
}


export function useExcelTemplate(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier-excel-template', supplierId],
    enabled: !!supplierId,
    queryFn: async (): Promise<SupplierExcelTemplate | null> => {
      const { data, error } = await supabase
        .from('supplier_excel_templates')
        .select('*')
        .eq('supplier_id', supplierId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as SupplierExcelTemplate) || null;
    },
  });
}

export interface SaveExcelTemplateInput {
  supplier_id: string;
  sheet_name: string | null;
  column_medida: string | null;
  column_codigo: string | null;
  column_descripcion: string | null;
  column_precio: string;
  header_row: number | null;
}

export function useSaveExcelTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveExcelTemplateInput) => {
      const { data, error } = await supabase
        .from('supplier_excel_templates')
        .upsert(input, { onConflict: 'supplier_id' })
        .select()
        .single();
      if (error) throw error;
      return data as SupplierExcelTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-excel-template', data.supplier_id] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
