import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useToast } from '@/hooks/use-toast';

interface TaskRow {
  id: string;
  cantidad: number;
  descripcion: string;
}


interface Props {
  open: boolean;
  onClose: () => void;
}

const WorkOrderForm: React.FC<Props> = ({ open, onClose }) => {
  const { clients } = useSupabaseSync();
  const { createWorkOrder } = useWorkOrders();
  const { toast } = useToast();

  const [mode, setMode] = useState<'existing' | 'quick'>('existing');
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [tasks, setTasks] = useState<TaskRow[]>([
    { id: '1', cantidad: 1, descripcion: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode('existing');
    setClientId(null);
    setClientName('');
    setClientPhone('');
    setVehicle('');
    setTasks([{ id: '1', cantidad: 1, descripcion: '' }]);
    setNotes('');
  };

  const addTask = () =>
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), cantidad: 1, descripcion: '' }]);
  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));
  const updateTask = (id: string, field: 'cantidad' | 'descripcion', value: number | string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));


  const handleSubmit = async () => {
    if (!clientName.trim()) {
      toast({ title: 'Falta el nombre del cliente', variant: 'destructive' });
      return;
    }
    if (!vehicle.trim()) {
      toast({ title: 'Falta el vehículo', variant: 'destructive' });
      return;
    }
    const tasksArray = tasks
      .filter((t) => t.descripcion.trim() !== '')
      .map((t) =>
        t.cantidad > 1 ? `${t.cantidad}x ${t.descripcion.trim()}` : t.descripcion.trim()
      );
    if (tasksArray.length === 0) {
      toast({ title: 'Agregá al menos una tarea', variant: 'destructive' });
      return;
    }
    const requiresAlignment = tasks.some((t) =>
      t.descripcion.toLowerCase().includes('alineaci')
    );
    setSubmitting(true);
    try {
      await createWorkOrder({
        client_id: mode === 'existing' ? clientId : null,
        client_name: clientName,
        client_phone: clientPhone,
        vehicle_info: vehicle,
        tasks: tasksArray,
        notes,
        requires_alignment: requiresAlignment,
      });
      reset();
      onClose();
    } catch {
      // toast handled in hook
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva orden de trabajo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'existing' | 'quick')} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="existing" id="mode-existing" />
              <Label htmlFor="mode-existing">Cliente existente</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="quick" id="mode-quick" />
              <Label htmlFor="mode-quick">Ingreso rápido</Label>
            </div>
          </RadioGroup>

          {mode === 'existing' ? (
            <div>
              <Label>Cliente</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {clientName || 'Buscar cliente...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre o apellido..." />
                    <CommandList>
                      <CommandEmpty>Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {clients.map((c) => {
                          const full = `${c.first_name} ${c.last_name}`.trim();
                          return (
                            <CommandItem
                              key={c.id}
                              value={full}
                              onSelect={() => {
                                setClientId(c.id);
                                setClientName(full);
                                setClientPhone(c.phone || '');
                                setPopoverOpen(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', clientId === c.id ? 'opacity-100' : 'opacity-0')} />
                              <span className="flex-1">{full}</span>
                              {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {clientPhone && (
                <p className="text-xs text-muted-foreground mt-1">Tel: {clientPhone}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="wo-name">Nombre</Label>
                <Input id="wo-name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="wo-phone">Teléfono (opcional)</Label>
                <Input id="wo-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+54..." />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="wo-vehicle">Vehículo</Label>
            <Input
              id="wo-vehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Ej: Chevrolet Corsa 2010 - ABC123"
            />
          </div>

          <div>
            <Label>Tareas a realizar</Label>
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-[60px_1fr_36px] gap-2 text-xs font-semibold text-muted-foreground px-1">
                <span>Cant.</span>
                <span>Descripción</span>
                <span></span>
              </div>

              {tasks.map((task) => (
                <div key={task.id} className="grid grid-cols-[60px_1fr_36px] gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    value={task.cantidad}
                    onChange={(e) => updateTask(task.id, 'cantidad', parseInt(e.target.value) || 1)}
                    className="h-8 text-sm text-center"
                  />
                  <Input
                    placeholder="Ej: Colocar neumático 205/55R16, Balanceo, Alineación..."
                    value={task.descripcion}
                    onChange={(e) => updateTask(task.id, 'descripcion', e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTask(task.id)}
                    disabled={tasks.length === 1}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addTask}
                type="button"
                className="w-full mt-1"
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar tarea
              </Button>
            </div>
          </div>


          <div>
            <Label htmlFor="wo-notes">Notas para el taller</Label>
            <Textarea id="wo-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear orden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderForm;
