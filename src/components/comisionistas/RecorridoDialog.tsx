import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ComisionistasMap from './ComisionistasMap';
import LugarSearch from './LugarSearch';
import { trazarRuta } from './mapServices';
import { BERROTARAN, DIAS, SENTIDO_LABEL, type Comisionista, type Parada, type Recorrido, type Sentido } from './types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  comisionista: Comisionista | null;
  inicial: Recorrido | null;
  guardando: boolean;
  onGuardar: (r: Partial<Recorrido> & { comisionista_id: string; nombre: string }) => Promise<void>;
}

const mismasParadas = (a: Parada[], b: Parada[]) =>
  a.length === b.length && a.every((p, i) => p.lat === b[i].lat && p.lng === b[i].lng);

export default function RecorridoDialog({ open, onOpenChange, comisionista, inicial, guardando, onGuardar }: Props) {
  const [nombre, setNombre] = useState('');
  const [dias, setDias] = useState<string[]>([]);
  const [horario, setHorario] = useState('');
  const [costo, setCosto] = useState('');
  const [costoNota, setCostoNota] = useState('');
  const [sentido, setSentido] = useState<Sentido>('ambos');
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [notas, setNotas] = useState('');
  const [activo, setActivo] = useState(true);
  const [trazando, setTrazando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(inicial?.nombre ?? '');
    setDias((inicial?.dias ?? []).map(String));
    setHorario(inicial?.horario ?? '');
    setCosto(inicial?.costo_aprox != null ? String(inicial.costo_aprox) : '');
    setCostoNota(inicial?.costo_nota ?? '');
    setSentido(inicial?.sentido ?? 'ambos');
    setParadas(inicial?.paradas?.length ? inicial.paradas : [BERROTARAN]);
    setNotas(inicial?.notas ?? '');
    setActivo(inicial?.activo ?? true);
  }, [open, inicial]);

  const cambiaronParadas = !inicial || !mismasParadas(inicial.paradas ?? [], paradas);
  const pasaPorBerrotaran = paradas.some(
    (p) => Math.abs(p.lat - BERROTARAN.lat) < 0.05 && Math.abs(p.lng - BERROTARAN.lng) < 0.05,
  );

  // Vista previa: si no cambiaron las paradas, se muestra el trazado guardado.
  const vistaPrevia: Recorrido = useMemo(
    () => ({
      id: 'preview',
      comisionista_id: comisionista?.id ?? 'x',
      nombre: nombre || 'Recorrido',
      dias: [],
      horario: null,
      costo_aprox: null,
      costo_nota: null,
      sentido,
      paradas,
      geometria: cambiaronParadas ? [] : inicial?.geometria ?? [],
      notas: null,
      activo: true,
    }),
    [comisionista, nombre, sentido, paradas, cambiaronParadas, inicial],
  );

  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= paradas.length) return;
    const n = [...paradas];
    [n[i], n[j]] = [n[j], n[i]];
    setParadas(n);
  };

  const guardar = async () => {
    if (!comisionista || !nombre.trim()) return;
    if (paradas.length < 2) {
      toast.error('Cargá al menos dos paradas (por ejemplo Berrotarán y el destino).');
      return;
    }
    let geometria = inicial?.geometria ?? [];
    if (cambiaronParadas || geometria.length < 2) {
      setTrazando(true);
      const r = await trazarRuta(paradas.map((p) => [p.lat, p.lng]));
      setTrazando(false);
      if (r) {
        geometria = r.geometria;
      } else {
        geometria = [];
        toast.warning('No se pudo trazar el camino por ruta. Se guarda uniendo las paradas en línea recta; podés volver a guardarlo más tarde.');
      }
    }
    const montoNum = costo.trim() ? Number(costo.replace(/\./g, '').replace(',', '.')) : null;
    await onGuardar({
      id: inicial?.id,
      comisionista_id: comisionista.id,
      nombre: nombre.trim(),
      dias: dias.map(Number),
      horario: horario.trim() || null,
      costo_aprox: montoNum != null && !Number.isNaN(montoNum) ? montoNum : null,
      costo_nota: costoNota.trim() || null,
      sentido,
      paradas,
      geometria,
      notas: notas.trim() || null,
      activo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inicial ? 'Editar recorrido' : 'Nuevo recorrido'}</DialogTitle>
          <DialogDescription>{comisionista?.nombre}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="r-nombre">Nombre del recorrido</Label>
              <Input id="r-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Berrotarán ⇄ Río Cuarto" />
            </div>

            <div className="space-y-1.5">
              <Label>Días que sale</Label>
              <ToggleGroup type="multiple" value={dias} onValueChange={setDias} className="flex flex-wrap justify-start gap-1">
                {DIAS.map((d) => (
                  <ToggleGroupItem
                    key={d.n}
                    value={String(d.n)}
                    aria-label={d.largo}
                    className="h-9 w-9 border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {d.corto}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-horario">Horario aproximado</Label>
              <Input id="r-horario" value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Ej: pasa a la mañana, 9 a 11 h" />
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-costo">Costo aprox. $</Label>
                <Input id="r-costo" value={costo} onChange={(e) => setCosto(e.target.value)} inputMode="numeric" placeholder="15000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-costonota">Cómo cobra</Label>
                <Input id="r-costonota" value={costoNota} onChange={(e) => setCostoNota(e.target.value)} placeholder="Ej: por bulto; camión más caro" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Sirve para</Label>
              <RadioGroup value={sentido} onValueChange={(v) => setSentido(v as Sentido)} className="space-y-1">
                {(Object.keys(SENTIDO_LABEL) as Sentido[]).map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem id={`s-${s}`} value={s} />
                    <Label htmlFor={`s-${s}`} className="font-normal">{SENTIDO_LABEL[s]}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-notas">Notas</Label>
              <Textarea id="r-notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="r-activo">Recorrido activo</Label>
              <Switch id="r-activo" checked={activo} onCheckedChange={setActivo} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Paradas, en orden</Label>
              <ol className="space-y-1">
                {paradas.map((p, i) => (
                  <li key={`${p.lat},${p.lng},${i}`} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
                    <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 truncate">{p.nombre}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(i, 1)} disabled={i === paradas.length - 1} aria-label="Bajar">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setParadas(paradas.filter((_, k) => k !== i))} aria-label="Quitar parada">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ol>
              <LugarSearch
                placeholder="Agregar parada: localidad o dirección"
                onSelect={(l) => setParadas([...paradas, { nombre: l.nombre, lat: l.lat, lng: l.lng }])}
              />
              {!pasaPorBerrotaran && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Este recorrido no tiene a Berrotarán como parada.</p>
              )}
              {cambiaronParadas && paradas.length >= 2 && (
                <p className="text-xs text-muted-foreground">Al guardar, el sistema dibuja el camino por ruta entre las paradas.</p>
              )}
            </div>
            <ComisionistasMap
              comisionistas={comisionista ? [comisionista] : []}
              recorridos={paradas.length ? [vistaPrevia] : []}
              encuadre={`${paradas.length}-${open}`}
              className="h-[300px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} disabled={guardando || trazando || !nombre.trim()}>
            {trazando ? 'Trazando el camino…' : guardando ? 'Guardando…' : 'Guardar recorrido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
