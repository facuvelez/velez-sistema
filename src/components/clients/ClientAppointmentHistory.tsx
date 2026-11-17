import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Car, Gauge, FileText } from 'lucide-react';

interface ClientAppointmentHistoryProps {
  clientId: string;
}

interface AppointmentRecord {
  id: string;
  appointment_date: string;
  service_type: string;
  vehicle_info?: string;
  notes?: string;
  status: string;
  kilometraje?: number;
  completed_by_username?: string;
  completed_at?: string;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  scheduled: { label: 'Programada', variant: 'default' },
  confirmed: { label: 'Confirmada', variant: 'secondary' },
  completed: { label: 'Completada', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const ClientAppointmentHistory = ({ clientId }: ClientAppointmentHistoryProps) => {
  const [turnos, setTurnos] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurnos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, service_type, vehicle_info, notes, status, kilometraje, completed_by_username, completed_at')
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: false });

      if (!error && data) setTurnos(data);
      setLoading(false);
    };

    fetchTurnos();
  }, [clientId]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando historial...</p>;

  if (turnos.length === 0) return (
    <p className="text-sm text-muted-foreground">Este cliente no tiene turnos registrados.</p>
  );

  return (
    <div className="space-y-3">
      {turnos.map(t => {
        const fecha = new Date(t.appointment_date);
        const statusInfo = statusLabels[t.status] ?? { label: t.status, variant: 'default' };

        return (
          <Card key={t.id} className="border border-border/60 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              {/* Header: fecha + estado */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      {fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <Badge variant={statusInfo.variant}>
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Tipo de servicio */}
              <p className="font-medium text-foreground mb-2">{t.service_type}</p>

              {/* Vehículo */}
              {t.vehicle_info && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                  <Car className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{t.vehicle_info}</span>
                </div>
              )}

              {/* Kilometraje */}
              {t.kilometraje && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                  <Gauge className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {t.kilometraje.toLocaleString('es-AR')} km
                    {t.completed_by_username && (
                      <span className="text-xs text-muted-foreground ml-2">— Finalizó: {t.completed_by_username}</span>
                    )}
                  </span>
                </div>
              )}

              {/* Notas */}
              {t.notes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{t.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClientAppointmentHistory;
