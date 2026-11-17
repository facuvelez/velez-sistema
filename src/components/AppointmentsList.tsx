import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppointmentForm from "./AppointmentForm";
import AppointmentStats from "./appointments/AppointmentStats";
import AppointmentCalendarView from "./appointments/AppointmentCalendarView";
import AppointmentListView from "./appointments/AppointmentListView";
import AlineadorVacaciones from "./appointments/AlineadorVacaciones";
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

interface AppointmentsListProps {
  appointments: Appointment[];
  clients: Client[];
  onCreateAppointment: (appointmentData: any) => Promise<any>;
  onUpdateAppointment: (id: string, updates: any) => Promise<any>;
  onDeleteAppointment: (id: string) => Promise<any>;
  onHardDeleteAppointment?: (id: string) => Promise<any>;
}

const AppointmentsList = ({ 
  appointments, 
  clients, 
  onCreateAppointment, 
  onUpdateAppointment,
  onDeleteAppointment,
  onHardDeleteAppointment,
}: AppointmentsListProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeView, setActiveView] = useState<"calendar" | "list" | "stats">("calendar");
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canManageVacaciones = hasRole('Administrator') || hasRole('Administracion');
  const canViewStats = hasRole('Administrator') || hasRole('Administracion');

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const sendWhatsAppReminder = (appointment: Appointment) => {
    const client = getClient(appointment.client_id);
    if (!client?.phone) {
      toast({
        title: "Error",
        description: "El cliente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    const appointmentDate = new Date(appointment.appointment_date);
    const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `Hola ${client.first_name}, recordatorio de tu turno programado para ${formattedDate} a las ${formattedTime} para ${appointment.service_type}. ${appointment.vehicle_info ? `Vehículo: ${appointment.vehicle_info}. ` : ''}¡Te esperamos!`;
    
    const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: string,
    extra?: Record<string, any>
  ) => {
    try {
      await onUpdateAppointment(appointmentId, { status: newStatus, ...(extra || {}) });
      toast({
        title: "Éxito",
        description: "Turno actualizado",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el turno",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este turno?")) {
      try {
        await onDeleteAppointment(appointmentId);
        toast({
          title: "Éxito",
          description: "Turno eliminado correctamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el turno",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate upcoming appointments count
  const now = new Date();
  const upcomingCount = appointments.filter(apt => new Date(apt.appointment_date) >= now).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with stats and controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1 sm:mr-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-2 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{upcomingCount}</div>
            <div className="text-[10px] sm:text-sm text-blue-600 dark:text-blue-300">Próximos turnos</div>
          </div>
          <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 p-2 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{appointments.filter(a => a.status === 'confirmed').length}</div>
            <div className="text-[10px] sm:text-sm text-green-600 dark:text-green-300">Confirmadas</div>
          </div>
          <div className="rounded-md border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20 p-2 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400">{appointments.filter(a => a.status === 'completed').length}</div>
            <div className="text-[10px] sm:text-sm text-purple-600 dark:text-purple-300">Completadas</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto text-sm sm:text-base">Nuevo Turno</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Programar Nuevo Turno</DialogTitle>
              </DialogHeader>
              <AppointmentForm
                clients={clients}
                onSubmit={onCreateAppointment}
                onClose={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeView === "calendar" ? "default" : "outline"}
          onClick={() => setActiveView("calendar")}
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm"
        >
          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-600 dark:text-white" />
          <span className="hidden xs:inline">Vista </span>Calendario
        </Button>
        <Button
          variant={activeView === "list" ? "default" : "outline"}
          onClick={() => setActiveView("list")}
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm"
        >
          <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Vista </span>Lista
        </Button>
        {canViewStats && (
          <Button
            variant={activeView === "stats" ? "default" : "outline"}
            onClick={() => setActiveView("stats")}
            size="sm"
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            📊 Estadísticas
          </Button>
        )}
      </div>

      {activeView === "calendar" && (
        <div className="space-y-6">
          <AppointmentCalendarView
            appointments={appointments}
            clients={clients}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onWhatsAppReminder={sendWhatsAppReminder}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
          {canManageVacaciones && <AlineadorVacaciones />}
        </div>
      )}

      {activeView === "list" && (
        <div className="space-y-6">
          <AppointmentListView
            appointments={appointments}
            clients={clients}
            onWhatsAppReminder={sendWhatsAppReminder}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onHardDelete={onHardDeleteAppointment}
          />
        </div>
      )}

      {activeView === "stats" && canViewStats && (
        <AppointmentStats appointments={appointments} clients={clients} />
      )}
    </div>
  );
};

export default AppointmentsList;