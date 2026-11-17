import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BERROTARAN, type Comisionista, type Recorrido } from './types';
import { trazado } from './geo';

export interface Conexion {
  desde: [number, number];
  hasta: [number, number];
  color: string;
}

interface Props {
  comisionistas: Comisionista[];
  recorridos: Recorrido[];
  /** Recorridos a resaltar; el resto se atenúa. Vacío = todos normales. */
  resaltados?: string[];
  destino?: { lat: number; lng: number; nombre: string } | null;
  conexiones?: Conexion[];
  /** Cambiar este valor re-encuadra el mapa. */
  encuadre?: string;
  /** Puntos a encuadrar; si no se pasa, se encuadran los recorridos visibles. */
  puntosEncuadre?: [number, number][];
  className?: string;
  onSelectRecorrido?: (id: string) => void;
}

function Encuadrar({ puntos, clave }: { puntos: [number, number][]; clave?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!puntos.length) return;
    const b = L.latLngBounds(puntos.map(([a, c]) => L.latLng(a, c)));
    map.fitBounds(b, { padding: [30, 30], maxZoom: 11 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, map]);
  return null;
}

export default function ComisionistasMap({
  comisionistas,
  recorridos,
  resaltados = [],
  destino,
  conexiones = [],
  encuadre,
  puntosEncuadre: puntosForzados,
  className = 'h-[480px]',
  onSelectRecorrido,
}: Props) {
  const colorDe = useMemo(() => {
    const m = new Map(comisionistas.map((c) => [c.id, c.color]));
    return (id: string) => m.get(id) ?? '#2563eb';
  }, [comisionistas]);
  const nombreDe = useMemo(() => {
    const m = new Map(comisionistas.map((c) => [c.id, c.nombre]));
    return (id: string) => m.get(id) ?? '';
  }, [comisionistas]);

  const hayResaltado = resaltados.length > 0;
  // Dibujar primero los atenuados y arriba los resaltados.
  const ordenados = [...recorridos].sort(
    (a, b) => Number(resaltados.includes(a.id)) - Number(resaltados.includes(b.id)),
  );

  const puntosEncuadre: [number, number][] = useMemo(() => {
    if (puntosForzados?.length) return puntosForzados;
    const base = hayResaltado ? recorridos.filter((r) => resaltados.includes(r.id)) : recorridos;
    const pts = base.flatMap((r) => trazado(r));
    if (destino) pts.push([destino.lat, destino.lng]);
    if (!pts.length) pts.push([BERROTARAN.lat, BERROTARAN.lng]);
    return pts;
  }, [recorridos, resaltados, hayResaltado, destino, puntosForzados]);

  return (
    // "isolate" evita que el mapa quede por encima de los diálogos de la app
    <div className={`isolate overflow-hidden rounded-lg border ${className}`}>
      <MapContainer center={[BERROTARAN.lat, BERROTARAN.lng]} zoom={7} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Encuadrar puntos={puntosEncuadre} clave={encuadre} />

        {ordenados.map((r) => {
          const activo = !hayResaltado || resaltados.includes(r.id);
          const color = colorDe(r.comisionista_id);
          return (
            <Polyline
              key={r.id}
              positions={trazado(r)}
              pathOptions={{ color, weight: activo ? 5 : 3, opacity: activo ? 0.9 : 0.25 }}
              eventHandlers={{ click: () => onSelectRecorrido?.(r.id) }}
            >
              <Tooltip sticky>
                <strong>{nombreDe(r.comisionista_id)}</strong>
                <br />
                {r.nombre}
              </Tooltip>
            </Polyline>
          );
        })}

        {ordenados
          .filter((r) => !hayResaltado || resaltados.includes(r.id))
          .flatMap((r) =>
            r.paradas.map((p, i) => (
              <CircleMarker
                key={`${r.id}-${i}`}
                center={[p.lat, p.lng]}
                radius={5}
                pathOptions={{ color: colorDe(r.comisionista_id), fillColor: '#ffffff', fillOpacity: 1, weight: 2 }}
              >
                <Tooltip>{p.nombre}</Tooltip>
              </CircleMarker>
            )),
          )}

        {conexiones.map((c, i) => (
          <Polyline key={`con-${i}`} positions={[c.desde, c.hasta]} pathOptions={{ color: c.color, weight: 2, dashArray: '6 6' }} />
        ))}

        <CircleMarker
          center={[BERROTARAN.lat, BERROTARAN.lng]}
          radius={8}
          pathOptions={{ color: '#111827', fillColor: '#facc15', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip permanent direction="right" offset={[8, 0]}>
            Vélez Neumáticos
          </Tooltip>
        </CircleMarker>

        {destino && (
          <CircleMarker
            center={[destino.lat, destino.lng]}
            radius={9}
            pathOptions={{ color: '#ffffff', fillColor: '#111827', fillOpacity: 1, weight: 3 }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {destino.nombre}
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
