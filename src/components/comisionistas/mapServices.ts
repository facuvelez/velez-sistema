// Servicios gratuitos de OpenStreetMap: búsqueda de lugares (Nominatim) y rutas por calle (OSRM).
// Son servicios públicos con límites de uso razonables: se llaman solo cuando el usuario busca o guarda.

export interface Lugar {
  nombre: string; // nombre corto (localidad)
  detalle: string; // nombre completo devuelto por el servicio
  lat: number;
  lng: number;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

function nombreCorto(r: any): string {
  const a = r.address ?? {};
  const loc = a.city || a.town || a.village || a.hamlet || a.municipality || a.suburb || a.county;
  const prov = a.state;
  if (loc && prov) return `${loc}, ${prov}`;
  return String(r.display_name ?? '').split(',').slice(0, 2).join(',').trim();
}

export async function buscarLugares(texto: string): Promise<Lugar[]> {
  const q = texto.trim();
  if (q.length < 3) return [];
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&countrycodes=ar&accept-language=es&limit=6&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('No se pudo buscar el lugar');
  const data = await res.json();
  return (data as any[]).map((r) => ({
    nombre: nombreCorto(r),
    detalle: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

/** Nombre de la localidad en un punto (para sugerir dónde encontrarse con el comisionista). */
export async function localidadEn(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=12&accept-language=es&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return nombreCorto(await res.json()) || null;
  } catch {
    return null;
  }
}

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

/** Trazado por ruta que une los puntos en orden. Devuelve [[lat,lng], ...] y la distancia en km. */
export async function trazarRuta(puntos: [number, number][]): Promise<{ geometria: [number, number][]; km: number } | null> {
  if (puntos.length < 2) return null;
  try {
    const coords = puntos.map(([lat, lng]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(';');
    const res = await fetch(`${OSRM}/${coords}?overview=full&geometries=geojson`);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    const geometria = simplificar(
      (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number]),
      0.0004,
    ).map(([a, b]) => [Number(a.toFixed(5)), Number(b.toFixed(5))] as [number, number]);
    return { geometria, km: route.distance / 1000 };
  } catch {
    return null;
  }
}

/** Distancia por ruta entre dos puntos, en km. */
export async function kmPorRuta(a: [number, number], b: [number, number]): Promise<number | null> {
  const r = await trazarRuta([a, b]);
  return r ? r.km : null;
}

// Douglas–Peucker: reduce puntos del trazado manteniendo la forma (~40 m de tolerancia).
function simplificar(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let dmax = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    const d = Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax > eps) return [...simplificar(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplificar(pts.slice(idx), eps)];
  return [a, b];
}
