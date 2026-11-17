import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Appointment {
  id: string;
  client_id: string;
  appointment_date: string;
  service_type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface AppointmentStatsProps {
  appointments: Appointment[];
  clients: Client[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const AppointmentStats = ({ appointments, clients }: AppointmentStatsProps) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

  const [fechaDesde, setFechaDesde] = useState(primerDiaMes);
  const [fechaHasta, setFechaHasta] = useState(hoy);

  const appointmentsFiltrados = useMemo(() => {
    const desde = new Date(`${fechaDesde}T00:00:00`);
    const hasta = new Date(`${fechaHasta}T23:59:59`);
    return appointments.filter(apt => {
      const fecha = new Date(apt.appointment_date);
      return fecha >= desde && fecha <= hasta;
    });
  }, [appointments, fechaDesde, fechaHasta]);

  const porServicio = useMemo(() => {
    const map: Record<string, number> = {};
    appointmentsFiltrados.forEach(apt => {
      map[apt.service_type] = (map[apt.service_type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [appointmentsFiltrados]);

  const porDia = useMemo(() => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const map: Record<string, number> = {};
    dias.forEach(d => map[d] = 0);
    appointmentsFiltrados.forEach(apt => {
      const dia = dias[new Date(apt.appointment_date).getDay()];
      map[dia]++;
    });
    return dias.map(d => ({ name: d, turnos: map[d] }));
  }, [appointmentsFiltrados]);

  const porMes = useMemo(() => {
    const meses: Record<string, number> = {};
    appointmentsFiltrados.forEach(apt => {
      const fecha = new Date(apt.appointment_date);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      meses[key] = (meses[key] || 0) + 1;
    });
    return Object.entries(meses).sort().map(([key, value]) => ({ name: key, turnos: value }));
  }, [appointmentsFiltrados]);

  const topClientes = useMemo(() => {
    const map: Record<string, number> = {};
    appointmentsFiltrados.forEach(apt => {
      const cliente = clients.find(c => c.id === apt.client_id);
      if (cliente) {
        const nombre = `${cliente.first_name} ${cliente.last_name}`;
        map[nombre] = (map[nombre] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [appointmentsFiltrados, clients]);

  const tasaComplecion = useMemo(() => {
    const completados = appointmentsFiltrados.filter(a => a.status === 'completed').length;
    const cancelados = appointmentsFiltrados.filter(a => a.status === 'cancelled').length;
    const total = appointmentsFiltrados.length;
    return {
      completados,
      cancelados,
      pendientes: total - completados - cancelados,
      tasaComplecion: total > 0 ? Math.round((completados / total) * 100) : 0,
      tasaCancelacion: total > 0 ? Math.round((cancelados / total) * 100) : 0,
    };
  }, [appointmentsFiltrados]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Estadísticas de Turnos</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={fechaDesde}
              max={fechaHasta}
              onChange={(e) => setFechaDesde(e.target.value || primerDiaMes)}
              className="w-40 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={fechaHasta}
              max={hoy}
              min={fechaDesde}
              onChange={(e) => setFechaHasta(e.target.value || hoy)}
              className="w-40 h-8 text-sm"
            />
          </div>

          {/* Accesos rápidos */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => { setFechaDesde(hoy); setFechaHasta(hoy); }}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => {
                const lunes = new Date();
                lunes.setDate(new Date().getDate() - new Date().getDay() + 1);
                setFechaDesde(lunes.toISOString().slice(0, 10));
                setFechaHasta(hoy);
              }}>
              Esta semana
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => { setFechaDesde(primerDiaMes); setFechaHasta(hoy); }}>
              Este mes
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => {
                const hace90 = new Date();
                hace90.setDate(hace90.getDate() - 90);
                setFechaDesde(hace90.toISOString().slice(0, 10));
                setFechaHasta(hoy);
              }}>
              Últimos 90 días
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => {
                setFechaDesde(`${new Date().getFullYear()}-01-01`);
                setFechaHasta(hoy);
              }}>
              Este año
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Mostrando {appointmentsFiltrados.length} turno{appointmentsFiltrados.length !== 1 ? 's' : ''} del {fechaDesde.split('-').reverse().join('/')} al {fechaHasta.split('-').reverse().join('/')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total turnos</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{appointmentsFiltrados.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completados</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{tasaComplecion.completados}</p>
            <p className="text-xs text-muted-foreground">{tasaComplecion.tasaComplecion}% del total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cancelados</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{tasaComplecion.cancelados}</p>
            <p className="text-xs text-muted-foreground">{tasaComplecion.tasaCancelacion}% del total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Servicio más frecuente</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold truncate">{porServicio[0]?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{porServicio[0]?.value ?? 0} turnos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Turnos por tipo de servicio</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={porServicio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {porServicio.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Turnos por día de la semana</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porDia}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="turnos" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Evolución de turnos</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porMes}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="turnos" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Clientes más frecuentes (Top 10)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topClientes.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{i + 1}</Badge>
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{c.value} {c.value === 1 ? 'turno' : 'turnos'}</span>
              </div>
            ))}
            {topClientes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin datos para el período seleccionado.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentStats;
