import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LogRow {
  id: string;
  created_at: string;
  cliente: string;
  vehiculo: string | null;
  generado_por_username: string | null;
}

const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
};

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const PresupuestosLog: React.FC = () => {
  console.log('[PresupuestosLog] rendered');
  const [fechaDesde, setFechaDesde] = useState<string>(todayISO());
  const [fechaHasta, setFechaHasta] = useState<string>(todayISO());
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  const { desde, hasta } = useMemo(() => {
    const start = new Date(`${fechaDesde}T00:00:00`);
    const end = new Date(`${fechaHasta}T23:59:59`);
    return { desde: start.toISOString(), hasta: end.toISOString() };
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('presupuestos_log')
        .select('id, created_at, cliente, vehiculo, generado_por_username')
        .gte('created_at', desde)
        .lt('created_at', hasta)
        .order('created_at', { ascending: false });
      console.log('[PresupuestosLog] datos log:', data, 'error:', error, 'rango:', desde, hasta);
      if (!cancelled) {
        if (error) {
          console.error('Error cargando presupuestos_log:', error);
          setRows([]);
        } else {
          setRows((data as LogRow[]) ?? []);
        }
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [desde, hasta]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de presupuestos generados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label>Desde</Label>
            <Input
              type="date"
              value={fechaDesde}
              max={todayISO()}
              onChange={(e) => {
                const val = e.target.value || todayISO();
                setFechaDesde(val);
                if (val > fechaHasta) setFechaHasta(val);
              }}
              className="w-40"
            />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input
              type="date"
              value={fechaHasta}
              max={todayISO()}
              onChange={(e) => {
                const val = e.target.value || todayISO();
                if (val >= fechaDesde) setFechaHasta(val);
              }}
              className="w-40"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{rows.length}</span>{' '}
            presupuesto{rows.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => { setFechaDesde(todayISO()); setFechaHasta(todayISO()); }}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date();
            const lunes = new Date(d);
            lunes.setDate(d.getDate() - d.getDay() + 1);
            setFechaDesde(lunes.toISOString().slice(0, 10));
            setFechaHasta(todayISO());
          }}>
            Esta semana
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date();
            setFechaDesde(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
            setFechaHasta(todayISO());
          }}>
            Este mes
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Fecha y hora</th>
                <th className="text-left p-2">Cliente</th>
                <th className="text-left p-2">Vehículo</th>
                <th className="text-left p-2">Generado por</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Sin presupuestos en esta fecha
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{fmtDateTime(r.created_at)}</td>
                    <td className="p-2">{r.cliente}</td>
                    <td className="p-2">{r.vehiculo || '—'}</td>
                    <td className="p-2">{r.generado_por_username || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PresupuestosLog;
