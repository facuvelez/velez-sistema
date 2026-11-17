import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppointmentCard from "./AppointmentCard";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  id: string;
  client_id: string;
  appointment_date: string;
  service_type: string;
  vehicle_info?: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  deleted_at?: string;
  deleted_by_username?: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AppointmentListViewProps {
  appointments: Appointment[];
  clients: Client[];
  onWhatsAppReminder: (appointment: Appointment) => void;
  onStatusChange: (appointmentId: string, newStatus: string, extra?: Record<string, any>) => Promise<void>;
  onDelete: (appointmentId: string) => Promise<void>;
  onHardDelete?: (appointmentId: string) => Promise<void>;
}

const AppointmentListView = ({
  appointments,
  clients,
  onWhatsAppReminder,
  onStatusChange,
  onDelete,
  onHardDelete,
}: AppointmentListViewProps) => {
  const { hasRole } = useAuth();
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const mesActual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [mesesExpandidos, setMesesExpandidos] = useState<Record<string, boolean>>({
    [mesActual]: true,
  });

  const toggleMes = (mesKey: string) => {
    setMesesExpandidos(prev => ({ ...prev, [mesKey]: !prev[mesKey] }));
  };

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  const appointmentsFiltrados = appointments.filter(apt => {
    const cliente = getClient(apt.client_id);
    const nombreCliente = cliente ? `${cliente.first_name} ${cliente.last_name}`.toLowerCase() : '';
    const matchEstado = filtroEstado === 'todos' || apt.status === filtroEstado;
    const matchServicio = filtroServicio === 'todos' || apt.service_type === filtroServicio;
    const matchBusqueda = busqueda === '' ||
      nombreCliente.includes(busqueda.toLowerCase()) ||
      apt.vehicle_info?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchServicio && matchBusqueda;
  });

  const hace6Meses = new Date();
  hace6Meses.setMonth(hace6Meses.getMonth() - 6);

  const appointmentsUltimos6Meses = appointmentsFiltrados.filter(apt =>
    new Date(apt.appointment_date) >= hace6Meses
  );

  const appointmentsOrdenados = [...appointmentsUltimos6Meses].sort((a, b) =>
    new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
  );

  const appointmentsPorMes = appointmentsOrdenados.reduce((groups, apt) => {
    const fecha = new Date(apt.appointment_date);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(apt);
    return groups;
  }, {} as Record<string, typeof appointmentsOrdenados>);

  const mesesOrdenados = Object.keys(appointmentsPorMes).sort((a, b) => b.localeCompare(a));

  const nombreMes = (key: string) => {
    const [year, month] = key.split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
    return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  const hayFiltros = filtroEstado !== 'todos' || filtroServicio !== 'todos' || busqueda !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por cliente o vehículo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:w-64 h-8 text-sm"
        />
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="scheduled">Programada</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroServicio} onValueChange={setFiltroServicio}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los servicios</SelectItem>
            <SelectItem value="Alineado">Alineado</SelectItem>
            <SelectItem value="Balanceo">Balanceo</SelectItem>
            <SelectItem value="Rotación">Rotación</SelectItem>
            <SelectItem value="Cambio de neumáticos">Cambio de neumáticos</SelectItem>
          </SelectContent>
        </Select>
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setFiltroEstado('todos'); setFiltroServicio('todos'); setBusqueda(''); }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {mesesOrdenados.map(mesKey => {
        const esMesActual = mesKey === mesActual;
        const expandido = mesesExpandidos[mesKey] ?? false;
        const turnosDelMes = appointmentsPorMes[mesKey];

        return (
          <div key={mesKey}>
            <button
              type="button"
              onClick={() => toggleMes(mesKey)}
              className="w-full flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity"
            >
              <h3 className={`text-sm font-semibold uppercase tracking-wide capitalize ${
                esMesActual ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {nombreMes(mesKey)}
                {esMesActual && <span className="ml-2 text-xs normal-case font-normal">(actual)</span>}
              </h3>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {turnosDelMes.length} turno{turnosDelMes.length !== 1 ? 's' : ''}
              </span>
              {expandido
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              }
            </button>

            {expandido && (
              <div className="space-y-3 mb-6">
                {turnosDelMes.map(appointment => {
                  const esCancelado = appointment.status === 'cancelled';

                  if (esCancelado) {
                    return (
                      <div key={appointment.id} className="border border-destructive/30 rounded-md p-3 bg-destructive/5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="line-through text-destructive/60 space-y-0.5">
                            <p className="font-medium text-sm">
                              {getClient(appointment.client_id)
                                ? `${getClient(appointment.client_id)!.first_name} ${getClient(appointment.client_id)!.last_name}`
                                : 'Cliente desconocido'}
                            </p>
                            <p className="text-xs">{appointment.service_type}</p>
                            <p className="text-xs">
                              {new Date(appointment.appointment_date).toLocaleDateString('es-AR')} — {new Date(appointment.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {appointment.vehicle_info && <p className="text-xs">{appointment.vehicle_info}</p>}
                            {appointment.deleted_by_username && (
                              <p className="text-xs" style={{ textDecoration: 'none' }}>
                                Cancelado por: <span className="font-medium">{appointment.deleted_by_username}</span>
                              </p>
                            )}
                          </div>
                          {hasRole('Administrator') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/20 shrink-0"
                              title="Eliminar permanentemente"
                              onClick={() => {
                                if (confirm('¿Eliminar permanentemente este turno? Esta acción no se puede deshacer.')) {
                                  onHardDelete?.(appointment.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      client={getClient(appointment.client_id)}
                      onWhatsAppReminder={onWhatsAppReminder}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {appointmentsOrdenados.length === 0 && (
        <Card className="dark:bg-gray-800/50 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-white" />
            <p className="text-gray-500 dark:text-gray-400">
              {hayFiltros ? 'No hay turnos que coincidan con los filtros' : 'No hay turnos en los últimos 6 meses.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AppointmentListView;
