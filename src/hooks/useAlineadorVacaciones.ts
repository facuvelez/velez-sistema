import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Vacacion {
  id: string;
  fecha_desde: string; // YYYY-MM-DD
  fecha_hasta: string; // YYYY-MM-DD
  motivo: string | null;
  created_at: string;
  created_by_username: string | null;
}

export const useAlineadorVacaciones = () => {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVacaciones = useCallback(async () => {
    const { data, error } = await supabase
      .from("alineador_vacaciones")
      .select("*")
      .order("fecha_desde", { ascending: true });
    if (!error && data) setVacaciones(data as Vacacion[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVacaciones();
    const channel = supabase
      .channel("alineador_vacaciones_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alineador_vacaciones" },
        () => fetchVacaciones()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVacaciones]);

  return { vacaciones, loading, refetch: fetchVacaciones };
};

// Helpers
export const parseDateLocal = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isDateInVacaciones = (date: Date, vacaciones: Vacacion[]): Vacacion | null => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  for (const v of vacaciones) {
    const from = parseDateLocal(v.fecha_desde).getTime();
    const to = parseDateLocal(v.fecha_hasta).getTime();
    if (d >= from && d <= to) return v;
  }
  return null;
};

export const rangesOverlap = (aFrom: string, aTo: string, bFrom: string, bTo: string) => {
  return aFrom <= bTo && bFrom <= aTo;
};

export const getVacacionDates = (vacaciones: Vacacion[]): Date[] => {
  const dates: Date[] = [];
  for (const v of vacaciones) {
    const from = parseDateLocal(v.fecha_desde);
    const to = parseDateLocal(v.fecha_hasta);
    const cur = new Date(from);
    while (cur.getTime() <= to.getTime()) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return dates;
};

export const formatDateDMY = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};
