import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { COLORES, type Comisionista } from './types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  inicial: Comisionista | null;
  colorSugerido: string;
  guardando: boolean;
  onGuardar: (c: Partial<Comisionista> & { nombre: string }) => void;
}

export default function ComisionistaDialog({ open, onOpenChange, inicial, colorSugerido, guardando, onGuardar }: Props) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [color, setColor] = useState(colorSugerido);
  const [notas, setNotas] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!open) return;
    setNombre(inicial?.nombre ?? '');
    setTelefono(inicial?.telefono ?? '');
    setLocalidad(inicial?.localidad_base ?? '');
    setColor(inicial?.color ?? colorSugerido);
    setNotas(inicial?.notas ?? '');
    setActivo(inicial?.activo ?? true);
  }, [open, inicial, colorSugerido]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{inicial ? 'Editar comisionista' : 'Nuevo comisionista'}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nombre.trim()) return;
            onGuardar({
              id: inicial?.id,
              nombre: nombre.trim(),
              telefono: telefono.trim() || null,
              localidad_base: localidad.trim() || null,
              color,
              notas: notas.trim() || null,
              activo,
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="c-nombre">Nombre</Label>
            <Input id="c-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-tel">Teléfono (WhatsApp)</Label>
            <Input id="c-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 3571 123456" inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-loc">De dónde es</Label>
            <Input id="c-loc" value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Ej: Río Cuarto" />
          </div>
          <div className="space-y-1.5">
            <Label>Color en el mapa</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={`h-7 w-7 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${color === c ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-notas">Notas</Label>
            <Textarea id="c-notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Ej: no lleva cubiertas de camión" />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="c-activo">Activo</Label>
              <p className="text-xs text-muted-foreground">Si lo desactivás, no aparece en el buscador ni en el mapa.</p>
            </div>
            <Switch id="c-activo" checked={activo} onCheckedChange={setActivo} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !nombre.trim()}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
