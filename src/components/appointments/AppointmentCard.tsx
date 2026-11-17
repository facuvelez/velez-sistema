import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Phone, CheckCircle, XCircle, Trash2 } from "lucide-react";
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

interface AppointmentCardProps {
  appointment: Appointment;
  client: Client | undefined;
  onWhatsAppReminder: (appointment: Appointment) => void;
  onStatusChange: (appointmentId: string, newStatus: string, extra?: Record<string, any>) => Promise<void>;
  onDelete: (appointmentId: string) => Promise<void>;
}

const getStatusBadge = (status: string) => {
  const variants = {
    'scheduled': { variant: 'default' as const, label: 'Programada' },
    'confirmed': { variant: 'secondary' as const, label: 'Confirmada' },
    'completed': { variant: 'default' as const, label: 'Completada' },
    'cancelled': { variant: 'destructive' as const, label: 'Cancelada' }
  };
  return variants[status] || variants.scheduled;
};

const AppointmentCard = ({
  appointment,
  client,
  onWhatsAppReminder,
  onStatusChange,
  onDelete
}: AppointmentCardProps) => {
  const { profile, hasRole } = useAuth();
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [kilometraje, setKilometraje] = useState("");
  const [notaFinal, setNotaFinal] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [telefonoManual, setTelefonoManual] = useState('');

  const handleCerrarModal = () => {
    setShowFinalizarModal(false);
    setKilometraje('');
    setNotaFinal('');
  };

  if (!client) return null;

  const appointmentDate = new Date(appointment.appointment_date);
  const status = getStatusBadge(appointment.status);
  const isPast = appointmentDate < new Date();
  const canFinalizar =
    hasRole('Alineador') || hasRole('Administracion') || hasRole('Administrator');

  const handleFinalizar = async () => {
    setFinalizing(true);
    try {
      await onStatusChange(appointment.id, 'completed', {
        kilometraje: parseInt(kilometraje),
        completed_by_username: profile?.username,
        completed_at: new Date().toISOString(),
      });
      handleCerrarModal();
    } finally {
      setFinalizing(false);
    }
  };

  const handleFinalizarYAvisar = async () => {
    setFinalizing(true);
    try {
      await onStatusChange(appointment.id, 'completed', {
        kilometraje: parseInt(kilometraje),
        completed_by_username: profile?.username,
        completed_at: new Date().toISOString(),
        whatsapp_sent: true,
      });
      if (appointment.client_phone) {
        const numero = appointment.client_phone.replace(/\D/g, '');
        const km = parseInt(kilometraje).toLocaleString('es-AR');
        const clientName = client ? client.first_name.toUpperCase() : 'cliente';
        const servicio = appointment.service_type.toLowerCase();
        const notaParte = notaFinal.trim() ? `${notaFinal.trim()} ` : '';
        const mensaje = `Hola ${clientName}, te informamos que el ${servicio} de tu vehículo ya está listo. Kilometraje registrado: ${km} km. ${notaParte}¡Gracias por elegirnos! 🔧 Velez Neumáticos`;
        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
      }
      handleCerrarModal();
    } finally {
      setFinalizing(false);
    }
  };



  return (
    <Card className="dark:bg-gray-800/50 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {client.first_name} {client.last_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {appointment.service_type}
                </p>
                {appointment.vehicle_info && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {appointment.vehicle_info}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 dark:text-white" />
                {appointmentDate.toLocaleDateString('es-ES')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 dark:text-white" />
                {appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {appointment.status === 'completed' && (
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                {appointment.kilometraje != null && (
                  <div>Kilometraje: {appointment.kilometraje.toLocaleString('es-AR')} km</div>
                )}
                {appointment.completed_by_username && (
                  <div>Finalizó: {appointment.completed_by_username}</div>
                )}
              </div>
            )}
          </div>

          <div className="text-right space-y-2">
            <Badge variant={status.variant}>
              {status.label}
            </Badge>

            {appointment.reminder_sent_24h && (
              <div className="text-xs text-green-600 dark:text-green-400">
                ✓ Recordatorio 24h enviado
              </div>
            )}
            {appointment.reminder_sent_1h && (
              <div className="text-xs text-green-600 dark:text-green-400">
                ✓ Recordatorio 1h enviado
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {client.phone && !isPast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onWhatsAppReminder(appointment)}
                className="h-8 w-8 p-0"
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}

            {!isPast && appointment.status === 'scheduled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(appointment.id, 'confirmed')}
                className="h-8 w-8 p-0 text-green-600"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {!isPast && appointment.status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(appointment.id, 'cancelled')}
                className="h-8 w-8 p-0 text-red-600"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(appointment.id)}
              className="h-8 w-8 p-0 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {canFinalizar && (appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
            <Button size="sm" onClick={() => setShowFinalizarModal(true)}>
              ✅ Finalizar turno
            </Button>
          )}

        </div>

        {appointment.status === 'completed' && (
          <div className="mt-2">
            {appointment.client_phone ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 w-full"
                onClick={() => {
                  const numero = appointment.client_phone!.replace(/\D/g, '');
                  const km = appointment.kilometraje?.toLocaleString('es-AR') ?? 'N/D';
                  const clientName = client ? client.first_name.toUpperCase() : 'cliente';
                  const servicio = appointment.service_type.toLowerCase();
                  const mensaje = `Hola ${clientName}, te informamos que el ${servicio} de tu vehículo ya está listo. Kilometraje registrado: ${km} km. ¡Gracias por elegirnos! 🔧 Velez Neumáticos`;
                  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
                }}
              >
                💬 Avisar al cliente por WhatsApp
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Teléfono del cliente (ej: 5493584123456)"
                    value={telefonoManual}
                    onChange={(e) => setTelefonoManual(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!telefonoManual}
                    onClick={async () => {
                      // Guardar el teléfono en el turno
                      await onStatusChange(appointment.id, 'completed', {
                        client_phone: telefonoManual,
                      });
                      // Abrir WhatsApp
                      const numero = telefonoManual.replace(/\D/g, '');
                      const km = appointment.kilometraje?.toLocaleString('es-AR') ?? 'N/D';
                      const clientName = client ? client.first_name.toUpperCase() : 'cliente';
                      const servicio = appointment.service_type.toLowerCase();
                      const mensaje = `Hola ${clientName}, te informamos que el ${servicio} de tu vehículo ya está listo. Kilometraje registrado: ${km} km. ¡Gracias por elegirnos! 🔧 Velez Neumáticos`;
                      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
                    }}
                  >
                    💬 Enviar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este turno no tiene teléfono cargado. Ingresalo para enviar el aviso.
                </p>
              </div>
            )}
          </div>
        )}

        {appointment.notes && (
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
            <strong>Notas:</strong> {appointment.notes}
          </div>
        )}
      </CardContent>

      <Dialog open={showFinalizarModal} onOpenChange={setShowFinalizarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ingresá el kilometraje actual del vehículo para registrarlo y notificar al cliente.
            </p>
            <div>
              <Label>Kilometraje del vehículo</Label>
              <Input
                type="number"
                placeholder="Ej: 85000"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nota adicional (opcional)</Label>
              <textarea
                className="w-full mt-1 p-2 text-sm rounded-md border bg-background resize-none"
                rows={3}
                placeholder="Ej: Se ajustó también la presión de los neumáticos."
                value={notaFinal}
                onChange={(e) => setNotaFinal(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCerrarModal}>
                Cancelar
              </Button>
              {appointment.client_phone ? (
                <Button onClick={handleFinalizarYAvisar} disabled={!kilometraje || finalizing}>
                  {finalizing ? "Guardando..." : "✅ Confirmar y avisar por WhatsApp"}
                </Button>
              ) : (
                <Button onClick={handleFinalizar} disabled={!kilometraje || finalizing}>
                  {finalizing ? "Guardando..." : "✅ Confirmar finalización"}
                </Button>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AppointmentCard;
