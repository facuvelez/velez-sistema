import { DIAS, type Parada, type Recorrido, type Sentido } from './types';

const R = 6371; // radio terrestre en km
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface PuntoCercano {
  distKm: number; // distancia en línea recta desde el destino al recorrido
  punto: [number, number]; // punto del recorrido más cercano al destino
}

/** Punto del trazado más cercano a `p` (proyección local plana, precisa para distancias cortas). */
export function puntoMasCercano(p: [number, number], linea: [number, number][]): PuntoCercano | null {
  if (!linea.length) return null;
  if (linea.length === 1) return { distKm: haversineKm(p, linea[0]), punto: linea[0] };
  const kx = Math.cos(rad(p[0])) * 111.32; // km por grado de longitud
  const ky = 110.57; // km por grado de latitud
  let best: PuntoCercano | null = null;
  for (let i = 0; i < linea.length - 1; i++) {
    const a = linea[i];
    const b = linea[i + 1];
    const ax = (a[1] - p[1]) * kx, ay = (a[0] - p[0]) * ky;
    const bx = (b[1] - p[1]) * kx, by = (b[0] - p[0]) * ky;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const cx = ax + t * dx, cy = ay + t * dy;
    const d = Math.sqrt(cx * cx + cy * cy);
    if (!best || d < best.distKm) {
      best = { distKm: d, punto: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])] };
    }
  }
  return best;
}

export type Cercania = 'pasa' | 'cerca' | 'lejos';

export function clasificar(distKm: number): Cercania {
  if (distKm <= 5) return 'pasa';
  if (distKm <= 25) return 'cerca';
  return 'lejos';
}

export interface Candidato {
  recorrido: Recorrido;
  distKm: number;
  punto: [number, number];
  cercania: Cercania;
  proximoDia: { fecha: Date; texto: string } | null;
}

export function sirveParaSentido(sentidoRecorrido: Sentido, buscado: 'envio' | 'retiro'): boolean {
  return sentidoRecorrido === 'ambos' || sentidoRecorrido === buscado;
}

/** Próximo día (desde hoy inclusive) en que sale el recorrido. */
export function proximoDia(dias: number[], desde = new Date()): { fecha: Date; texto: string } | null {
  if (!dias?.length) return null;
  for (let i = 0; i < 7; i++) {
    const f = new Date(desde);
    f.setDate(desde.getDate() + i);
    if (dias.includes(f.getDay())) {
      const largo = DIAS.find((d) => d.n === f.getDay())?.largo ?? '';
      const texto = i === 0 ? `hoy (${largo})` : i === 1 ? `mañana (${largo})` : `el ${largo} ${f.getDate()}/${f.getMonth() + 1}`;
      return { fecha: f, texto };
    }
  }
  return null;
}

export function trazado(r: Recorrido): [number, number][] {
  if (r.geometria?.length > 1) return r.geometria;
  return (r.paradas ?? []).map((p) => [p.lat, p.lng] as [number, number]);
}

export function rankear(
  destino: [number, number],
  recorridos: Recorrido[],
  opciones: { sentido: 'envio' | 'retiro'; dia: number | null; comisionistasActivos: Set<string> },
): Candidato[] {
  const out: Candidato[] = [];
  for (const r of recorridos) {
    if (!r.activo || !opciones.comisionistasActivos.has(r.comisionista_id)) continue;
    if (!sirveParaSentido(r.sentido, opciones.sentido)) continue;
    if (opciones.dia !== null && r.dias?.length && !r.dias.includes(opciones.dia)) continue;
    const pc = puntoMasCercano(destino, trazado(r));
    if (!pc) continue;
    out.push({
      recorrido: r,
      distKm: pc.distKm,
      punto: pc.punto,
      cercania: clasificar(pc.distKm),
      proximoDia: proximoDia(r.dias),
    });
  }
  return out.sort((a, b) => a.distKm - b.distKm);
}

export function diasTexto(dias: number[]): string {
  if (!dias?.length) return 'Días sin cargar';
  return DIAS.filter((d) => dias.includes(d.n)).map((d) => d.largo).join(', ');
}

export function paradasTexto(paradas: Parada[]): string {
  return (paradas ?? []).map((p) => p.nombre).join(' → ');
}
