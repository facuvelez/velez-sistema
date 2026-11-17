import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Producto {
  id: string;
  medida: string;
  marca: string;
  modelo: string;
  precio_actual: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Competidor {
  id: string;
  nombre: string;
  seller_id_mercadolibre: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchProductoCompetidor {
  id: string;
  producto_id: string;
  competidor_id: string;
  publication_id: string;
  titulo_publicacion: string | null;
  confirmado: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrecioCompetencia {
  id: string;
  producto_id: string;
  competidor_id: string;
  publication_id: string;
  titulo_publicacion: string | null;
  precio: number;
  stock_disponible: number | null;
  fecha_relevamiento: string;
  created_at: string;
}

export const usePriceCompetition = () => {
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [matches, setMatches] = useState<MatchProductoCompetidor[]>([]);
  const [precios, setPrecios] = useState<PrecioCompetencia[]>([]);
  const [minByProducto, setMinByProducto] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [p, c, m, pr] = await Promise.all([
      supabase.from('productos').select('*').order('marca').order('medida'),
      supabase.from('competidores').select('*').order('nombre'),
      supabase.from('matches_producto_competidor').select('*'),
      supabase.from('precios_competencia').select('*').order('fecha_relevamiento', { ascending: false }).limit(1000),
    ]);
    if (p.data) setProductos(p.data as Producto[]);
    if (c.data) setCompetidores(c.data as Competidor[]);
    if (m.data) setMatches(m.data as MatchProductoCompetidor[]);
    if (pr.data) setPrecios(pr.data as PrecioCompetencia[]);

    if (p.data) {
      const mins: Record<string, number | null> = {};
      await Promise.all(
        (p.data as Producto[]).map(async (prod) => {
          const { data } = await supabase.rpc('get_producto_min_competencia', { p_producto_id: prod.id });
          mins[prod.id] = (data as number | null) ?? null;
        })
      );
      setMinByProducto(mins);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createProducto = async (p: Omit<Producto, 'id' | 'created_at' | 'updated_at' | 'activo'> & { activo?: boolean }) => {
    const { error } = await supabase.from('productos').insert(p);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Producto creado' });
    fetchAll();
  };

  const updateProducto = async (id: string, patch: Partial<Producto>) => {
    const { error } = await supabase.from('productos').update(patch).eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  const deleteProducto = async (id: string) => {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  const createCompetidor = async (c: Omit<Competidor, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('competidores').insert(c);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Competidor creado' });
    fetchAll();
  };

  const updateCompetidor = async (id: string, patch: Partial<Competidor>) => {
    const { error } = await supabase.from('competidores').update(patch).eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  const deleteCompetidor = async (id: string) => {
    const { error } = await supabase.from('competidores').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  const createMatch = async (m: Omit<MatchProductoCompetidor, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('matches_producto_competidor').insert(m);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Match creado' });
    fetchAll();
  };

  const updateMatch = async (id: string, patch: Partial<MatchProductoCompetidor>) => {
    const { error } = await supabase.from('matches_producto_competidor').update(patch).eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  const deleteMatch = async (id: string) => {
    const { error } = await supabase.from('matches_producto_competidor').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  const getPriceHistory = async (producto_id: string, days = 30): Promise<PrecioCompetencia[]> => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('precios_competencia')
      .select('*')
      .eq('producto_id', producto_id)
      .gte('fecha_relevamiento', since)
      .order('fecha_relevamiento', { ascending: true });
    return (data as PrecioCompetencia[]) ?? [];
  };

  const searchPurchaseSuggestions = async (field: 'medida' | 'marca', query: string): Promise<string[]> => {
    if (!query || query.length < 1) return [];
    const { data } = await supabase
      .from('supplier_purchase_items')
      .select(field)
      .ilike(field, `%${query}%`)
      .limit(20);
    if (!data) return [];
    const uniq = Array.from(new Set(data.map((r: any) => r[field]).filter(Boolean)));
    return uniq.slice(0, 10) as string[];
  };

  return {
    productos, competidores, matches, precios, minByProducto, loading,
    refresh: fetchAll,
    createProducto, updateProducto, deleteProducto,
    createCompetidor, updateCompetidor, deleteCompetidor,
    createMatch, updateMatch, deleteMatch,
    getPriceHistory, searchPurchaseSuggestions,
  };
};
