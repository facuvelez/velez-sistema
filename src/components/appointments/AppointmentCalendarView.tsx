import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Palmtree } from "lucide-react";
import { useAlineadorVacaciones, getVacacionDates, isDateInVacaciones, formatDateDMY } from "@/hooks/useAlineadorVacaciones";
import AppointmentCard from "./AppointmentCard";

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
  kilometraje?: number;
  client_phone?: string;
  whatsapp_sent?: boolean;
  completed_by_username?: string;
  completed_at?: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  clients: Client[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  onWhatsAppReminder: (appointment: Appointment) => void;
  onStatusChange: (appointmentId: string, newStatus: string, extra?: Record<string, any>) => Promise<void>;
  onDelete: (appointmentId: string) => Promise<void>;
}


const AppointmentCalendarView = ({
  appointments,
  clients,
  selectedDate,
  onSelectDate,
  onWhatsAppReminder,
  onStatusChange,
  onDelete,
}: AppointmentCalendarViewProps) => {

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const appointmentDate = new Date(apt.appointment_date);
      return appointmentDate.toDateString() === date.toDateString();
    });
  };

  const getAppointmentDates = () => {
    return appointments.map(apt => new Date(apt.appointment_date));
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const { vacaciones } = useAlineadorVacaciones();
  const vacacionDates = getVacacionDates(vacaciones);
  const selectedVacacion = selectedDate ? isDateInVacaciones(selectedDate, vacaciones) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Calendar */}
      <Card className="dark:bg-gray-800/50 dark:border-gray-700">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg dark:text-gray-100">Calendario de Turnos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-2 sm:p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            className="rounded-md border dark:border-gray-600 p-1 sm:p-3 pointer-events-auto scale-90 sm:scale-100"
            modifiers={{
              hasAppointment: getAppointmentDates(),
              vacacion: vacacionDates,
            }}
            modifiersStyles={{
              hasAppointment: { 
                backgroundColor: 'hsl(var(--primary))', 
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 'bold',
                border: '2px solid hsl(var(--primary))'
              },
              vacacion: {
                backgroundColor: 'hsl(var(--destructive) / 0.15)',
                color: 'hsl(var(--destructive))',
                textDecoration: 'line-through',
                fontWeight: 'bold',
              },
            }}
          />
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
              Con turno
            </div>
            <div className="flex items-center gap-1.5">
              <Palmtree className="h-3 w-3 text-destructive" />
              Vacaciones alineador
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Appointments */}
      <Card className="dark:bg-gray-800/50 dark:border-gray-700">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base dark:text-gray-100">
            Turnos para {selectedDate?.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {selectedVacacion && (
            <div className="mb-3 flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm">
              <Palmtree className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Alineador de vacaciones del {formatDateDMY(selectedVacacion.fecha_desde)} al {formatDateDMY(selectedVacacion.fecha_hasta)}
                {selectedVacacion.motivo ? ` — ${selectedVacacion.motivo}` : ""}.
              </span>
            </div>
          )}
          <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-white" />
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  No hay turnos programados para esta fecha
                </p>
              </div>
            ) : (
              selectedDateAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  client={getClient(appointment.client_id)}
                  onWhatsAppReminder={onWhatsAppReminder}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendarView;