import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Comisionista, Recorrido } from './types';

// Las tablas nuevas todavía no están en los tipos generados de Supabase.
const db = supabase as any;

const KEY = ['comisionistas'];

export function useComisionistas() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const [c, r] = await Promise.all([
        db.from('comisionistas').select('*').order('nombre'),
        db.from('comisionista_recorridos').select('*').order('nombre'),
      ]);
      if (c.error) throw c.error;
      if (r.error) throw r.error;
      return {
        comisionistas: (c.data ?? []) as Comisionista[],
        recorridos: ((r.data ?? []) as any[]).map((x) => ({
          ...x,
          dias: x.dias ?? [],
          paradas: x.paradas ?? [],
          geometria: x.geometria ?? [],
          costo_aprox: x.costo_aprox === null ? null : Number(x.costo_aprox),
        })) as Recorrido[],
      };
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const guardarComisionista = useMutation({
    mutationFn: async (c: Partial<Comisionista> & { nombre: string }) => {
      const { id, ...rest } = c;
      const res = id
        ? await db.from('comisionistas').update(rest).eq('id', id)
        : await db.from('comisionistas').insert(rest);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });

  const borrarComisionista = useMutation({
    mutationFn: async (id: string) => {
      const res = await db.from('comisionistas').delete().eq('id', id);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });

  const guardarRecorrido = useMutation({
    mutationFn: async (r: Partial<Recorrido> & { comisionista_id: string; nombre: string }) => {
      const { id, ...rest } = r;
      const res = id
        ? await db.from('comisionista_recorridos').update(rest).eq('id', id)
        : await db.from('comisionista_recorridos').insert(rest);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });

  const borrarRecorrido = useMutation({
    mutationFn: async (id: string) => {
      const res = await db.from('comisionista_recorridos').delete().eq('id', id);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });

  return {
    comisionistas: query.data?.comisionistas ?? [],
    recorridos: query.data?.recorridos ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    guardarComisionista,
    borrarComisionista,
    guardarRecorrido,
    borrarRecorrido,
  };
}
