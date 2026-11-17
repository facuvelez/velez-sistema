import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Plus, Trash2, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import ComisionistaDialog from './ComisionistaDialog';
import RecorridoDialog from './RecorridoDialog';
import ComisionistasMap from './ComisionistasMap';
import { diasTexto, paradasTexto } from './geo';
import { formatoCosto, linkWhatsApp } from './format';
import { COLORES, SENTIDO_LABEL, type Comisionista, type Recorrido } from './types';
import type { useComisionistas } from './useComisionistas';

type Datos = ReturnType<typeof useComisionistas>;

type Borrado = { tipo: 'comisionista'; item: Comisionista } | { tipo: 'recorrido'; item: Recorrido } | null;

export default function GestionComisionistas({ datos }: { datos: Datos }) {
  const { comisionistas, recorridos } = datos;
  const [editComisionista, setEditComisionista] = useState<{ abierto: boolean; item: Comisionista | null }>({ abierto: false, item: null });
  const [editRecorrido, setEditRecorrido] = useState<{ abierto: boolean; comisionista: Comisionista | null; item: Recorrido | null }>({
    abierto: false,
    comisionista: null,
    item: null,
  });
  const [borrar, setBorrar] = useState<Borrado>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const colorSugerido = COLORES.find((c) => !comisionistas.some((k) => k.color === c)) ?? COLORES[comisionistas.length % COLORES.length];

  const error = (e: unknown) => toast.error(`No se pudo guardar: ${(e as Error)?.message ?? 'error desconocido'}`);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(340px,480px)_1fr]">
      <div className="space-y-3">
        <Button onClick={() => setEditComisionista({ abierto: true, item: null })} className="w-full">
          <Plus className="mr-1 h-4 w-4" /> Nuevo comisionista
        </Button>

        {comisionistas.length === 0 && (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Todavía no hay comisionistas. Cargá el primero con el botón de arriba.</p>
        )}

        {comisionistas.map((c) => {
          const suyos = recorridos.filter((r) => r.comisionista_id === c.id);
          const wa = linkWhatsApp(c.telefono, `Hola ${c.nombre}, te escribo de Vélez Neumáticos.`);
          return (
            <Card key={c.id} className={c.activo ? '' : 'opacity-60'}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <div>
                    <p className="font-semibold leading-tight">
                      {c.nombre} {!c.activo && <Badge variant="secondary" className="ml-1">Inactivo</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[c.localidad_base, c.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0">
                  {wa && (
                    <Button asChild variant="ghost" size="icon" aria-label="Escribir por WhatsApp">
                      <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a>
                    </Button>
                  )}
                  {c.telefono && (
                    <Button asChild variant="ghost" size="icon" aria-label="Llamar">
                      <a href={`tel:${c.telefono.replace(/\s/g, '')}`}><Phone className="h-4 w-4" /></a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setEditComisionista({ abierto: true, item: c })} aria-label="Editar comisionista">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setBorrar({ tipo: 'comisionista', item: c })} aria-label="Borrar comisionista">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {c.notas && <p className="text-xs text-muted-foreground">{c.notas}</p>}
                {suyos.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-md border p-2 text-sm transition-colors ${seleccion === r.id ? 'border-primary bg-primary/5' : ''} ${r.activo ? '' : 'opacity-60'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" className="text-left" onClick={() => setSeleccion(seleccion === r.id ? null : r.id)}>
                        <p className="font-medium">{r.nombre}</p>
                        <p className="text-xs text-muted-foreground">{paradasTexto(r.paradas)}</p>
                      </button>
                      <div className="flex shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditRecorrido({ abierto: true, comisionista: c, item: r })} aria-label="Editar recorrido">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBorrar({ tipo: 'recorrido', item: r })} aria-label="Borrar recorrido">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-xs">
                      <dt className="text-muted-foreground">Días</dt>
                      <dd>{diasTexto(r.dias)}{r.horario ? ` · ${r.horario}` : ''}</dd>
                      <dt className="text-muted-foreground">Costo</dt>
                      <dd>{formatoCosto(r.costo_aprox, r.costo_nota)}</dd>
                      <dt className="text-muted-foreground">Sirve para</dt>
                      <dd>{SENTIDO_LABEL[r.sentido]}</dd>
                    </dl>
                    {r.notas && <p className="mt-1 text-xs text-muted-foreground">{r.notas}</p>}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => setEditRecorrido({ abierto: true, comisionista: c, item: null })}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Agregar recorrido
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ComisionistasMap
        comisionistas={comisionistas}
        recorridos={recorridos}
        resaltados={seleccion ? [seleccion] : []}
        encuadre={seleccion ?? 'todo'}
        onSelectRecorrido={(id) => setSeleccion(id)}
        className="h-[420px] lg:h-[640px] lg:sticky lg:top-4"
      />

      <ComisionistaDialog
        open={editComisionista.abierto}
        onOpenChange={(o) => setEditComisionista((s) => ({ ...s, abierto: o }))}
        inicial={editComisionista.item}
        colorSugerido={colorSugerido}
        guardando={datos.guardarComisionista.isPending}
        onGuardar={(c) =>
          datos.guardarComisionista.mutate(c, {
            onSuccess: () => {
              toast.success('Comisionista guardado');
              setEditComisionista({ abierto: false, item: null });
            },
            onError: error,
          })
        }
      />

      <RecorridoDialog
        open={editRecorrido.abierto}
        onOpenChange={(o) => setEditRecorrido((s) => ({ ...s, abierto: o }))}
        comisionista={editRecorrido.comisionista}
        inicial={editRecorrido.item}
        guardando={datos.guardarRecorrido.isPending}
        onGuardar={async (r) => {
          try {
            await datos.guardarRecorrido.mutateAsync(r);
            toast.success('Recorrido guardado');
            setEditRecorrido({ abierto: false, comisionista: null, item: null });
          } catch (e) {
            error(e);
          }
        }}
      />

      <AlertDialog open={!!borrar} onOpenChange={(o) => !o && setBorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {borrar?.tipo === 'comisionista' ? `¿Borrar a ${borrar.item.nombre}?` : `¿Borrar el recorrido "${borrar?.item.nombre}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {borrar?.tipo === 'comisionista'
                ? 'Se borran también todos sus recorridos. Si solo dejó de trabajar por un tiempo, mejor desactivalo desde Editar.'
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!borrar) return;
                const m = borrar.tipo === 'comisionista' ? datos.borrarComisionista : datos.borrarRecorrido;
                m.mutate(borrar.item.id, {
                  onSuccess: () => toast.success('Borrado'),
                  onError: (e) => toast.error(`No se pudo borrar: ${(e as Error).message}`),
                });
                setBorrar(null);
              }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
