import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, MessageCircle, X, Loader2 } from 'lucide-react';
import ComisionistasMap, { type Conexion } from './ComisionistasMap';
import LugarSearch from './LugarSearch';
import { rankear, diasTexto, paradasTexto, type Candidato } from './geo';
import { kmPorRuta, localidadEn, type Lugar } from './mapServices';
import { BERROTARAN, DIAS, type Comisionista, type Recorrido } from './types';
import { linkWhatsApp, formatoCosto } from './format';

interface Props {
  comisionistas: Comisionista[];
  recorridos: Recorrido[];
}

interface Extra {
  kmRuta?: number | null;
  encuentro?: string | null;
  cargando?: boolean;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function BuscadorComisionista({ comisionistas, recorridos }: Props) {
  const [sentido, setSentido] = useState<'envio' | 'retiro'>('envio');
  const [dia, setDia] = useState<string>('cualquiera');
  const [destino, setDestino] = useState<Lugar | null>(null);
  const [extras, setExtras] = useState<Record<string, Extra>>({});

  const comisionistaDe = useMemo(() => new Map(comisionistas.map((c) => [c.id, c])), [comisionistas]);
  const activos = useMemo(() => new Set(comisionistas.filter((c) => c.activo).map((c) => c.id)), [comisionistas]);

  const candidatos: Candidato[] = useMemo(() => {
    if (!destino) return [];
    return rankear([destino.lat, destino.lng], recorridos, {
      sentido,
      dia: dia === 'cualquiera' ? null : Number(dia),
      comisionistasActivos: activos,
    });
  }, [destino, recorridos, sentido, dia, activos]);

  const destacados = useMemo(() => {
    const pasan = candidatos.filter((c) => c.cercania === 'pasa');
    return pasan.length ? pasan : candidatos.slice(0, 3);
  }, [candidatos]);

  // Para los que no pasan exacto: km por ruta hasta el destino y localidad donde conviene encontrarse.
  useEffect(() => {
    if (!destino) return;
    let cancelado = false;
    const objetivos = candidatos.filter((c) => c.cercania !== 'pasa').slice(0, 3);
    setExtras(Object.fromEntries(objetivos.map((c) => [c.recorrido.id, { cargando: true }])));
    (async () => {
      for (const c of objetivos) {
        const [km, loc] = await Promise.all([
          kmPorRuta(c.punto, [destino.lat, destino.lng]),
          localidadEn(c.punto[0], c.punto[1]),
        ]);
        if (cancelado) return;
        setExtras((prev) => ({ ...prev, [c.recorrido.id]: { kmRuta: km, encuentro: loc, cargando: false } }));
        await espera(1100); // respetar el límite del servicio gratuito de mapas
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [candidatos, destino]);

  const conexiones: Conexion[] = destino
    ? destacados
        .filter((c) => c.cercania !== 'pasa')
        .map((c) => ({
          desde: c.punto,
          hasta: [destino.lat, destino.lng],
          color: comisionistaDe.get(c.recorrido.comisionista_id)?.color ?? '#111827',
        }))
    : [];

  // Encuadrar el destino, Berrotarán y los puntos donde cada candidato pasa más cerca.
  const puntosEncuadre: [number, number][] | undefined = destino
    ? [[destino.lat, destino.lng], [BERROTARAN.lat, BERROTARAN.lng], ...destacados.map((c) => c.punto)]
    : undefined;

  const hayQuienPasa = candidatos.some((c) => c.cercania === 'pasa');

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>¿Qué necesitás?</Label>
              <ToggleGroup
                type="single"
                value={sentido}
                onValueChange={(v) => v && setSentido(v as 'envio' | 'retiro')}
                className="grid grid-cols-2"
              >
                <ToggleGroupItem value="envio" className="border data-[state=on]:border-primary">
                  Enviar desde acá
                </ToggleGroupItem>
                <ToggleGroupItem value="retiro" className="border data-[state=on]:border-primary">
                  Que nos traigan
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label>Día</Label>
              <Select value={dia} onValueChange={setDia}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cualquiera">Cualquier día</SelectItem>
                  {DIAS.map((d) => (
                    <SelectItem key={d.n} value={String(d.n)}>
                      {d.largo.charAt(0).toUpperCase() + d.largo.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{sentido === 'envio' ? '¿A dónde hay que llevarlo?' : '¿De dónde hay que traerlo?'}</Label>
              {destino ? (
                <div className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">{destino.nombre}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{destino.detalle}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setDestino(null)} aria-label="Cambiar destino">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <LugarSearch placeholder="Ej: Villa del Rosario" onSelect={setDestino} />
              )}
            </div>
          </CardContent>
        </Card>

        {destino && (
          <div className="space-y-3">
            {!candidatos.length && (
              <p className="rounded-md border p-4 text-sm text-muted-foreground">
                Ningún comisionista activo sirve para {sentido === 'envio' ? 'enviar' : 'traer'}
                {dia !== 'cualquiera' ? ' ese día' : ''}. Probá con otro día o revisá los recorridos cargados.
              </p>
            )}
            {candidatos.length > 0 && !hayQuienPasa && (
              <p className="text-sm text-muted-foreground">
                Nadie pasa justo por {destino.nombre}. Estos son los que pasan más cerca:
              </p>
            )}
            {candidatos.map((c, i) => (
              <ResultadoCard
                key={c.recorrido.id}
                candidato={c}
                comisionista={comisionistaDe.get(c.recorrido.comisionista_id)}
                extra={extras[c.recorrido.id]}
                destino={destino}
                sentido={sentido}
                principal={i === 0}
              />
            ))}
          </div>
        )}
      </div>

      <ComisionistasMap
        comisionistas={comisionistas}
        recorridos={recorridos.filter((r) => r.activo && activos.has(r.comisionista_id))}
        resaltados={destino ? destacados.map((c) => c.recorrido.id) : []}
        destino={destino ? { lat: destino.lat, lng: destino.lng, nombre: destino.nombre } : null}
        conexiones={conexiones}
        puntosEncuadre={puntosEncuadre}
        encuadre={destino ? `${destino.lat},${destino.lng},${sentido},${dia}` : 'todo'}
        className="h-[420px] lg:h-[640px] lg:sticky lg:top-4"
      />
    </div>
  );
}

function ResultadoCard({
  candidato: c,
  comisionista,
  extra,
  destino,
  sentido,
  principal,
}: {
  candidato: Candidato;
  comisionista?: Comisionista;
  extra?: Extra;
  destino: Lugar;
  sentido: 'envio' | 'retiro';
  principal: boolean;
}) {
  const r = c.recorrido;
  const etiqueta =
    c.cercania === 'pasa'
      ? { texto: 'Pasa por ahí', clase: 'bg-green-600 text-white hover:bg-green-600' }
      : c.cercania === 'cerca'
        ? { texto: `Pasa a ${Math.round(c.distKm)} km`, clase: 'bg-amber-500 text-black hover:bg-amber-500' }
        : { texto: `Queda a ${Math.round(c.distKm)} km`, clase: '' };

  const mensaje =
    sentido === 'envio'
      ? `Hola ${comisionista?.nombre ?? ''}, te escribo de Vélez Neumáticos. ¿Podrías llevar un envío desde Berrotarán a ${destino.nombre}? ¿Qué día pasás y cuánto saldría?`
      : `Hola ${comisionista?.nombre ?? ''}, te escribo de Vélez Neumáticos. ¿Podrías traernos algo desde ${destino.nombre} a Berrotarán? ¿Qué día pasás y cuánto saldría?`;
  const wa = linkWhatsApp(comisionista?.telefono, mensaje);

  return (
    <Card className={principal ? 'border-primary' : ''}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: comisionista?.color }} />
            <div>
              <p className="font-semibold leading-tight">{comisionista?.nombre}</p>
              <p className="text-xs text-muted-foreground">{r.nombre}</p>
            </div>
          </div>
          <Badge className={etiqueta.clase} variant={etiqueta.clase ? 'default' : 'secondary'}>
            {etiqueta.texto}
          </Badge>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Próxima salida</dt>
          <dd>{c.proximoDia ? c.proximoDia.texto : diasTexto(r.dias)}{r.horario ? ` · ${r.horario}` : ''}</dd>
          <dt className="text-muted-foreground">Costo</dt>
          <dd>{formatoCosto(r.costo_aprox, r.costo_nota)}</dd>
          {c.cercania !== 'pasa' && (
            <>
              <dt className="text-muted-foreground">Desvío</dt>
              <dd>
                {extra?.cargando ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> calculando…
                  </span>
                ) : (
                  <>
                    {extra?.kmRuta != null
                      ? `${Math.round(extra.kmRuta)} km por ruta hasta ${destino.nombre}`
                      : `${Math.round(c.distKm)} km en línea recta`}
                    {extra?.encuentro ? ` · conviene encontrarlo en ${extra.encuentro}` : ''}
                  </>
                )}
              </dd>
            </>
          )}
        </dl>
        {r.paradas.length > 0 && <p className="text-xs text-muted-foreground">{paradasTexto(r.paradas)}</p>}
        {r.notas && <p className="text-xs text-muted-foreground">{r.notas}</p>}

        {wa ? (
          <Button asChild size="sm" variant="outline" className="w-full">
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-1 h-4 w-4" /> Escribirle por WhatsApp
            </a>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Sin teléfono cargado.</p>
        )}
      </CardContent>
    </Card>
  );
}
