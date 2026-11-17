import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertTriangle, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  useAlineadorVacaciones,
  isDateInVacaciones,
  parseDateLocal,
  formatDateDMY,
} from "@/hooks/useAlineadorVacaciones";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AppointmentFormProps {
  clients: Client[];
  onSubmit: (appointmentData: any) => Promise<void>;
  onClose: () => void;
}

const serviceTypes = [
  "Alineado",
  "Reparación tren delantero",
  "Alineado + Reparación tren delantero"
];

const AppointmentForm = ({ clients, onSubmit, onClose }: AppointmentFormProps) => {
  const [formData, setFormData] = useState({
    client_id: "",
    appointment_date: "",
    appointment_time: "",
    service_type: "",
    vehicle_info: "",
    notes: ""
  });
  const [clientPhone, setClientPhone] = useState("");
  const [clienteConMismoTelefono, setClienteConMismoTelefono] = useState<Client | null>(null);
  const [telefonoEditando, setTelefonoEditando] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [modoIngresoRapido, setModoIngresoRapido] = useState(false);
  const [clienteManual, setClienteManual] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState('08');
  const [minutosSeleccionados, setMinutosSeleccionados] = useState('00');
  const { toast } = useToast();
  const { vacaciones } = useAlineadorVacaciones();

  const clientesFiltrados = useMemo(() => {
    if (!searchCliente) return clients;
    return clients.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchCliente.toLowerCase()) ||
      (c.phone ?? '').includes(searchCliente)
    );
  }, [clients, searchCliente]);

  useEffect(() => {
    if (!openCliente) return;
    const handleClickOutside = (e: MouseEvent) => {
      setOpenCliente(false);
      setSearchCliente('');
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCliente]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, appointment_time: `${horaSeleccionada}:${minutosSeleccionados}` }));
  }, [horaSeleccionada, minutosSeleccionados]);

  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleClientPhoneChange = (valor: string) => {
    setClientPhone(valor);
    setClienteConMismoTelefono(null);

    if (valor.trim().length < 6) return;

    const numeroLimpio = valor.replace(/\D/g, '');
    const coincidencia = clients.find(c => {
      if (c.id === formData.client_id) return false;
      const telefonoLimpio = (c.phone ?? '').replace(/\D/g, '');
      return telefonoLimpio && telefonoLimpio === numeroLimpio;
    });

    if (coincidencia) {
      setClienteConMismoTelefono(coincidencia);
    }
  };

  const vacacionConflicto = useMemo(() => {
    if (formData.service_type !== "Alineado" || !formData.appointment_date) return null;
    return isDateInVacaciones(parseDateLocal(formData.appointment_date), vacaciones);
  }, [formData.service_type, formData.appointment_date, vacaciones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasClient = modoIngresoRapido ? clienteManual.trim().length > 0 : !!formData.client_id;

    if (!hasClient || !formData.appointment_date || !formData.appointment_time || !formData.service_type || !clientPhone.trim() || !formData.vehicle_info.trim()) {
      toast({
        title: "Error",
        description: "Por favor completá todos los campos requeridos, incluyendo la información del vehículo.",
        variant: "destructive",
      });
      return;
    }

    if (vacacionConflicto) {
      toast({
        title: "Alineador no disponible",
        description: `El alineador no está disponible del ${formatDateDMY(vacacionConflicto.fecha_desde)} al ${formatDateDMY(vacacionConflicto.fecha_hasta)}.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);

      let clientIdToUse = formData.client_id;

      if (modoIngresoRapido && clienteManual.trim()) {
        const nombreParts = clienteManual.trim().split(' ');
        const firstName = nombreParts[0];
        const lastName = nombreParts.slice(1).join(' ') || '';

        const { data: nuevoCliente, error: clienteError } = await supabase
          .from('clients')
          .insert({
            first_name: firstName,
            last_name: lastName,
            phone: clientPhone.trim() || null,
          })
          .select()
          .single();

        if (clienteError) {
          toast({ title: 'Error', description: 'No se pudo crear el cliente', variant: 'destructive' });
          setIsLoading(false);
          return;
        }

        clientIdToUse = nuevoCliente.id;
      }

      const finalNotes = formData.notes?.trim() || null;

      await onSubmit({
        client_id: clientIdToUse,
        appointment_date: appointmentDateTime.toISOString(),
        service_type: formData.service_type,
        vehicle_info: formData.vehicle_info || null,
        notes: finalNotes,
        client_phone: clientPhone.trim() || null,
      });

      // Sync the entered phone to the selected client record
      if (!modoIngresoRapido && clientIdToUse && clientPhone.trim()) {
        const clienteActual = clients.find(c => c.id === clientIdToUse);
        if (!clienteActual?.phone || clienteActual.phone !== clientPhone.trim()) {
          await supabase
            .from('clients')
            .update({ phone: clientPhone.trim() })
            .eq('id', clientIdToUse);
        }
      }

      onClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Cliente *</Label>
          {!modoIngresoRapido ? (
            <div className="relative">
              {/* Botón que muestra el cliente seleccionado */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm bg-background hover:bg-muted/50 transition-colors"
                onClick={() => setOpenCliente(!openCliente)}
              >
                <span className={selectedClient ? '' : 'text-muted-foreground'}>
                  {selectedClient
                    ? `${selectedClient.first_name} ${selectedClient.last_name}`
                    : 'Seleccionar cliente...'}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </button>

              {/* Dropdown */}
              {openCliente && (
                <div
                  className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Input de búsqueda */}
                  <div className="p-2 border-b">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar por nombre o teléfono..."
                      value={searchCliente}
                      onChange={(e) => setSearchCliente(e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none"
                    />
                  </div>

                  {/* Lista scrolleable */}
                  <div className="max-h-52 overflow-y-auto">
                    {clientesFiltrados.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No se encontró ningún cliente.
                      </p>
                    ) : (
                      clientesFiltrados.map(c => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault(); // evita que el blur cierre el dropdown antes del click
                            setFormData(prev => ({ ...prev, client_id: c.id }));
                            if (c.phone) setClientPhone(c.phone);
                            setSearchCliente('');
                            setOpenCliente(false);
                          }}
                        >
                          <Check
                            className={`h-4 w-4 shrink-0 ${formData.client_id === c.id ? 'opacity-100 text-primary' : 'opacity-0'}`}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">{c.first_name} {c.last_name}</span>
                            {c.phone && (
                              <span className="text-xs text-muted-foreground">{c.phone}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <Input
                placeholder="Nombre del cliente"
                value={clienteManual}
                onChange={(e) => setClienteManual(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se creará un nuevo cliente en el sistema al confirmar el turno.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-muted-foreground">¿No está en la lista?</span>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setModoIngresoRapido(!modoIngresoRapido);
                if (!modoIngresoRapido) {
                  setFormData(prev => ({ ...prev, client_id: "" }));
                } else {
                  setClienteManual("");
                }
              }}
            >
              {modoIngresoRapido ? "Elegir de la lista" : "Ingresar nombre manualmente"}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="client_phone">Teléfono del cliente *</Label>
          <Input
            id="client_phone"
            placeholder="Ej: 5493584123456"
            value={clientPhone}
            onChange={(e) => handleClientPhoneChange(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Necesario para enviar el aviso por WhatsApp al finalizar.
          </p>

          {clienteConMismoTelefono && (
            <div className="mt-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-100">
              <p className="font-medium mb-1">
                ⚠️ Este número ya está asociado a {clienteConMismoTelefono.first_name} {clienteConMismoTelefono.last_name}.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
                Si el número cambió de dueño, podés actualizar el nombre del cliente o ignorar el aviso.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, client_id: clienteConMismoTelefono.id }));
                    setClienteConMismoTelefono(null);
                  }}
                >
                  Usar a {clienteConMismoTelefono.first_name} como cliente del turno
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-amber-300 bg-white hover:bg-amber-50 transition-colors dark:bg-transparent dark:border-amber-800 dark:hover:bg-amber-950/50"
                  onClick={() => setTelefonoEditando(true)}
                >
                  ✏️ Editar nombre del cliente
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-amber-700 hover:bg-amber-100 transition-colors dark:text-amber-200 dark:hover:bg-amber-950/50"
                  onClick={() => setClienteConMismoTelefono(null)}
                >
                  Ignorar aviso
                </button>
              </div>

              {telefonoEditando && (
                <div className="mt-3 p-3 rounded-md bg-white border border-amber-200 dark:bg-slate-950 dark:border-amber-900/50">
                  <p className="text-xs font-medium mb-2">
                    Editar nombre de {clienteConMismoTelefono.first_name} {clienteConMismoTelefono.last_name}:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      id="edit_first_name"
                      placeholder="Nombre"
                      defaultValue={clienteConMismoTelefono.first_name}
                    />
                    <Input
                      id="edit_last_name"
                      placeholder="Apellido"
                      defaultValue={clienteConMismoTelefono.last_name}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      const nuevoNombre = (document.getElementById('edit_first_name') as HTMLInputElement)?.value.trim();
                      const nuevoApellido = (document.getElementById('edit_last_name') as HTMLInputElement)?.value.trim();
                      if (!nuevoNombre) return;
                      await supabase
                        .from('clients')
                        .update({ first_name: nuevoNombre, last_name: nuevoApellido || '' })
                        .eq('id', clienteConMismoTelefono.id);
                      setTelefonoEditando(false);
                      setClienteConMismoTelefono(null);
                    }}
                  >
                    Guardar cambio de nombre
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Fecha *</Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white" />
            </div>
          </div>

          <div>
            <Label>Hora *</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Select value={horaSeleccionada} onValueChange={setHoraSeleccionada}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 13 }, (_, i) => i + 7).map(h => (
                      <SelectItem key={h} value={String(h).padStart(2, '0')}>
                        {String(h).padStart(2, '0')} hs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={minutosSeleccionados} onValueChange={setMinutosSeleccionados}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <SelectItem key={m} value={String(m).padStart(2, '0')}>
                        :{String(m).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

        </div>

        <div>
          <Label htmlFor="service">Tipo de Servicio *</Label>
          <Select value={formData.service_type} onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="vehicle">Información del Vehículo *</Label>
          <Input
            id="vehicle"
            placeholder="Ej: Toyota Corolla 2018, Placa ABC-123"
            value={formData.vehicle_info}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicle_info: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notas Adicionales</Label>
          <Textarea
            id="notes"
            placeholder="Información adicional sobre el turno..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        {vacacionConflicto && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              ⚠️ El alineador no está disponible del {formatDateDMY(vacacionConflicto.fecha_desde)} al {formatDateDMY(vacacionConflicto.fecha_hasta)}. Por favor elegí otra fecha.
            </span>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={
              isLoading ||
              !!vacacionConflicto ||
              !formData.vehicle_info.trim()
            }
            className="flex-1"
          >
            {isLoading ? "Programando..." : "Confirmar Turno"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;