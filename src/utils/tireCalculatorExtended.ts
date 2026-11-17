// Extended tire calculator: supports agricultural, OTR, industrial, truck, ATV
// Reuses geometric checks from tireCalculator; overrides load/speed lookups per category.

import {
  calcVerdict,
  loadIndexToKg as turismoLI,
  speedRatingToKmh as turismoSR,
  type TireSize,
  type VerdictResult,
  type CheckStatus,
  type CheckResult,
} from './tireCalculator';

export type TireCategory =
  | 'turismo'
  | 'agricola'
  | 'vial'
  | 'industrial'
  | 'camion'
  | 'cuatriciclo';

// ============== AGRÍCOLA ==============
export const AGRICULTURAL_SPEED_RATING: Record<string, number> = {
  A2: 10, A3: 15, A4: 20, A5: 25, A6: 30, A8: 40,
  B: 50, C: 60, D: 65, E: 70, F: 80,
};

export const AGRICULTURAL_LOAD_INDEX: Record<number, number> = {
  100: 800, 101: 825, 102: 850, 103: 875, 104: 900, 105: 925, 106: 950,
  107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150,
  114: 1180, 115: 1215, 116: 1250, 117: 1285, 118: 1320, 119: 1360, 120: 1400,
  121: 1450, 122: 1500, 123: 1550, 124: 1600, 125: 1650, 126: 1700, 127: 1750,
  128: 1800, 129: 1850, 130: 1900, 131: 1950, 132: 2000, 133: 2060, 134: 2120,
  135: 2180, 136: 2240, 137: 2300, 138: 2360, 139: 2430, 140: 2500, 141: 2575,
  142: 2650, 143: 2725, 144: 2800, 145: 2900, 146: 3000, 147: 3075, 148: 3150,
  149: 3250, 150: 3350, 151: 3450, 152: 3550, 153: 3650, 154: 3750, 155: 3875,
  156: 4000, 157: 4125, 158: 4250, 159: 4375, 160: 4500, 161: 4625, 162: 4750,
  163: 4875, 164: 5000, 165: 5150, 166: 5300, 167: 5450, 168: 5600, 169: 5800,
  170: 6000, 171: 6150, 172: 6300, 173: 6500, 174: 6700, 175: 6900, 176: 7100,
  177: 7300, 178: 7500, 179: 7750, 180: 8000,
};

export const AGRICULTURAL_TREAD_TYPES: Record<string, { name: string; desc: string }> = {
  'R-1': { name: 'R-1 Agrícola estándar', desc: 'Tacos en ángulo para tracción en campo blando. El más común en tractores de uso general.' },
  'R-1W': { name: 'R-1W Agrícola húmedo', desc: 'Tacos más profundos (+25%) para barro y condiciones húmedas extremas.' },
  'R-2': { name: 'R-2 Arrozalero', desc: 'Tacos muy profundos (doble que R-1) para suelos encharcados y barro profundo.' },
  'R-3': { name: 'R-3 No direccional liso', desc: 'Huella plana sin tacos, para pasto o superficies delicadas.' },
  'R-4': { name: 'R-4 Industrial/Agrícola', desc: 'Intermedio entre agrícola y vial. Para tractores en asfalto y terrenos firmes.' },
  'F-2': { name: 'F-2 Rueda directriz', desc: 'Ruedas delanteras de tractor. Baja resistencia al rodado, buena dirección.' },
  'I-1': { name: 'I-1 Implemento liso', desc: 'Remolques e implementos sin tracción.' },
  'I-3': { name: 'I-3 Implemento nervado', desc: 'Resistente a sobrecarga para remolques pesados.' },
};

export const AGRICULTURAL_TECHNOLOGIES: Record<string, string> = {
  Convencional: 'Neumático radial estándar. Requiere ajuste de presión según velocidad y carga.',
  IF: 'Improved Flexion — soporta 20% más de carga a la misma presión, o misma carga con menos presión. Reduce compactación del suelo.',
  VF: 'Very High Flexion — soporta 40% más de carga a la misma presión. Ideal para tractores de alta potencia.',
  CFO: 'Cyclic Field Operation — optimizado para trabajo cíclico en campo con velocidad variable.',
};

// ============== VIAL / OTR ==============
export const OTR_TREAD_CODES: Record<string, { name: string; desc: string }> = {
  'E-1': { name: 'E-1 Rib / Direccional', desc: 'Nervio central. Vehículos de tierra en carretera, buena dirección.' },
  'E-2': { name: 'E-2 Tracción', desc: 'Tacos para movimiento de tierra en todo tipo de suelo.' },
  'E-3': { name: 'E-3 Roca', desc: 'Resistencia a cortes en roca. Para canteras y suelos abrasivos.' },
  'E-4': { name: 'E-4 Roca extra', desc: 'Máxima resistencia al corte. Banda muy gruesa para roca extrema.' },
  'E-7': { name: 'E-7 Flotación', desc: 'Terrenos muy blandos, compactadores.' },
  'L-2': { name: 'L-2 Tracción', desc: 'Cargadoras en terrenos flojos.' },
  'L-3': { name: 'L-3 Roca', desc: 'Cargadoras en cantera.' },
  'L-4': { name: 'L-4 Roca extra', desc: 'Máxima resistencia para cargadoras en roca dura.' },
  'L-5': { name: 'L-5 Roca extra profunda', desc: 'Banda ultra gruesa para condiciones extremas.' },
  'G-1': { name: 'G-1 Rib', desc: 'Motoniveladoras en carretera y nivelación.' },
  'G-2': { name: 'G-2 Tracción', desc: 'Motoniveladoras en terrenos mixtos.' },
  'G-3': { name: 'G-3 Roca', desc: 'Motoniveladoras en condiciones abrasivas.' },
  'C-1': { name: 'C-1 Compactador liso', desc: 'Rodillo compactador de suelo.' },
};

export const OTR_PLY_RATINGS = [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

// ============== INDUSTRIAL ==============
export const INDUSTRIAL_TREAD_TYPES: Record<string, { name: string; desc: string }> = {
  'I-1': { name: 'Liso / Sólido', desc: 'Máxima estabilidad en pisos duros de depósito. No apto para exteriores.' },
  'I-3': { name: 'Nervado', desc: 'Montacargas en terrenos mixtos interior/exterior.' },
  'I-6': { name: 'Flotación', desc: 'Terrenos blandos, camiones porta-contenedores.' },
  SR: { name: 'Sólido Resiliente', desc: 'Neumático macizo sin aire. No pincha, ideal para ambientes con clavos/vidrios.' },
  SE: { name: 'Superelástico', desc: 'Sólido con zona amortiguadora interna. Más confort que SR.' },
};

// ============== CAMIÓN ==============
export const TRUCK_POSITIONS: Record<string, { name: string; desc: string }> = {
  D: { name: 'Drive / Tracción', desc: 'Eje trasero motriz. Tacos profundos para tracción en barro, nieve, asfalto.' },
  S: { name: 'Steer / Dirección', desc: 'Eje delantero. Nervios para precisión de dirección y bajo desgaste.' },
  T: { name: 'Trailer / Remolque', desc: 'Eje libre de semi-remolque. Rodado libre, resistencia al desgaste lateral.' },
  A: { name: 'All Position', desc: 'Válido para cualquier posición. Compromiso entre tracción y dirección.' },
};

export const TRUCK_PLY_RATINGS = [14, 16, 18, 20];

export const TRUCK_SPEED_RATING: Record<string, number> = {
  F: 80, G: 90, J: 100, K: 110, L: 120, M: 130, N: 140, P: 150,
};

export const TRUCK_LOAD_INDEX: Record<number, number> = AGRICULTURAL_LOAD_INDEX;

// ============== ATV / UTV ==============
export const ATV_TREAD_TYPES: Record<string, { name: string; desc: string }> = {
  AT: { name: 'All Terrain / Todo terreno', desc: 'Tacos intermedios. Senderos mixtos, barro moderado, arena. El más versátil.' },
  MUD: { name: 'Mud / Barro', desc: 'Tacos muy profundos y espaciados. Máxima tracción en barro. Ruidoso en asfalto.' },
  SAND: { name: 'Arena / Paddle', desc: 'Paletas o nervios. Para dunas y arena suelta. No usar en terreno duro.' },
  SPORT: { name: 'Sport / Motocross', desc: 'Tacos pequeños y agresivos. Pistas duras. Alta velocidad.' },
  UTILITY: { name: 'Utilitario / Granja', desc: 'Tacos bajos y anchos. Trabajo en granja, menor agresividad. Más duradero.' },
  TURF: { name: 'Pasto / Césped', desc: 'Liso o nervado fino. Mínimo daño al suelo. Golf, jardines.' },
};

export const ATV_PLY_RATINGS = [4, 6, 8];

// ============== Metadata por categoría ==============
export interface CategoryMeta {
  label: string;
  sizePlaceholder: string;
  sizeHint: string;
  speedRatings: string[];
  liPlaceholder: string;
  srPlaceholder: string;
}

export const CATEGORY_META: Record<TireCategory, CategoryMeta> = {
  turismo: {
    label: '🚗 Turismo / Camioneta / Moto',
    sizePlaceholder: '205/55R16',
    sizeHint: 'Formato métrico: ancho/perfil R rodado',
    speedRatings: ['Q', 'R', 'S', 'T', 'H', 'V', 'W', 'Y'],
    liPlaceholder: '91',
    srPlaceholder: 'H',
  },
  agricola: {
    label: '🌾 Agrícola',
    sizePlaceholder: '480/70R34',
    sizeHint: 'Métrico (480/70R34) o imperial (16.9R30, 11.2-24)',
    speedRatings: Object.keys(AGRICULTURAL_SPEED_RATING),
    liPlaceholder: '148',
    srPlaceholder: 'A8',
  },
  vial: {
    label: '🏗️ Vial / OTR',
    sizePlaceholder: '20.5R25',
    sizeHint: 'Formato OTR: ancho R rodado (20.5R25, 17.5-25)',
    speedRatings: ['A2', 'A3', 'A4', 'A5', 'A6', 'A8'],
    liPlaceholder: '176',
    srPlaceholder: 'A2',
  },
  industrial: {
    label: '🏭 Industrial',
    sizePlaceholder: '6.00-9',
    sizeHint: 'Formato pulgadas: ancho-rodado (6.00-9, 8.25-15)',
    speedRatings: ['A2', 'A3', 'A5'],
    liPlaceholder: '121',
    srPlaceholder: 'A5',
  },
  camion: {
    label: '🚛 Camión',
    sizePlaceholder: '295/80R22.5',
    sizeHint: 'Métrico (295/80R22.5) o simple (11R22.5)',
    speedRatings: Object.keys(TRUCK_SPEED_RATING),
    liPlaceholder: '152',
    srPlaceholder: 'M',
  },
  cuatriciclo: {
    label: '🏍️ Cuatriciclo / ATV / UTV',
    sizePlaceholder: '25x8-12',
    sizeHint: 'Formato ATV: diámetro x ancho - rodado (pulgadas)',
    speedRatings: ['A2', 'A3', 'A5', 'B'],
    liPlaceholder: '35',
    srPlaceholder: 'A5',
  },
};

// ============== Parsers ==============
const METRIC_RE = /^(?:(IF|VF|CFO)\s*)?(\d{3})\s*\/\s*(\d{2,3})\s*R\s*(\d{2}(?:\.\d)?)$/i;
const IMPERIAL_RADIAL_RE = /^(\d+(?:\.\d+)?)\s*R\s*(\d+(?:\.\d+)?)$/i;
const IMPERIAL_BIAS_RE = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/;
const ATV_RE = /^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/;

function fromImperial(widthIn: number, rimIn: number, assumedProfile: number, raw: string): TireSize {
  return {
    width: Math.round(widthIn * 25.4),
    profile: assumedProfile,
    rim: rimIn,
    raw,
  };
}

export function parseTireByCategory(cat: TireCategory, input: string): TireSize {
  const s = input.trim();
  if (!s) throw new Error('Ingresá una medida');

  switch (cat) {
    case 'turismo': {
      const m = s.match(/^(\d{3})\s*\/\s*(\d{2,3})\s*R\s*(\d{2})$/i);
      if (!m) throw new Error('Formato inválido. Ej: 205/55R16');
      const w = +m[1], p = +m[2], r = +m[3];
      if (w < 100 || w > 400) throw new Error('Ancho fuera de rango (100–400 mm)');
      if (p < 20 || p > 95) throw new Error('Perfil fuera de rango (20–95)');
      if (r < 10 || r > 26) throw new Error('Rodado fuera de rango (10–26)');
      return { width: w, profile: p, rim: r, raw: `${w}/${p}R${r}` };
    }
    case 'agricola': {
      const met = s.match(METRIC_RE);
      if (met) {
        const tech = met[1] ? met[1].toUpperCase() + ' ' : '';
        return { width: +met[2], profile: +met[3], rim: parseFloat(met[4]), raw: `${tech}${met[2]}/${met[3]}R${met[4]}` };
      }
      const rad = s.match(IMPERIAL_RADIAL_RE);
      if (rad) return fromImperial(+rad[1], +rad[2], 85, `${rad[1]}R${rad[2]}`);
      const bias = s.match(IMPERIAL_BIAS_RE);
      if (bias) return fromImperial(+bias[1], +bias[2], 90, `${bias[1]}-${bias[2]}`);
      throw new Error('Formato agrícola inválido. Ej: 480/70R34, 16.9R30 o 11.2-24');
    }
    case 'vial': {
      const rad = s.match(IMPERIAL_RADIAL_RE);
      if (rad) return fromImperial(+rad[1], +rad[2], 85, `${rad[1]}R${rad[2]}`);
      const bias = s.match(IMPERIAL_BIAS_RE);
      if (bias) return fromImperial(+bias[1], +bias[2], 85, `${bias[1]}-${bias[2]}`);
      throw new Error('Formato OTR inválido. Ej: 20.5R25 o 17.5-25');
    }
    case 'industrial': {
      const bias = s.match(IMPERIAL_BIAS_RE);
      if (bias) return fromImperial(+bias[1], +bias[2], 95, `${bias[1]}-${bias[2]}`);
      const rad = s.match(IMPERIAL_RADIAL_RE);
      if (rad) return fromImperial(+rad[1], +rad[2], 95, `${rad[1]}R${rad[2]}`);
      throw new Error('Formato industrial inválido. Ej: 6.00-9 o 8.25-15');
    }
    case 'camion': {
      const met = s.match(/^(\d{3})\s*\/\s*(\d{2,3})\s*R\s*(\d{2}(?:\.\d)?)$/i);
      if (met) return { width: +met[1], profile: +met[2], rim: parseFloat(met[3]), raw: `${met[1]}/${met[2]}R${met[3]}` };
      const trk = s.match(/^(\d+(?:\.\d+)?)\s*R\s*(\d+(?:\.\d+)?)$/i);
      if (trk) return fromImperial(+trk[1], +trk[2], 92, `${trk[1]}R${trk[2]}`);
      throw new Error('Formato camión inválido. Ej: 295/80R22.5 o 11R22.5');
    }
    case 'cuatriciclo': {
      const m = s.match(ATV_RE);
      if (!m) throw new Error('Formato ATV inválido. Ej: 25x8-12');
      const od = +m[1], w = +m[2], r = +m[3];
      const sidewall = (od - r) / 2;
      if (sidewall <= 0) throw new Error('El diámetro debe ser mayor al rodado');
      const profile = (sidewall / w) * 100;
      return {
        width: Math.round(w * 25.4),
        profile: Math.round(profile * 10) / 10,
        rim: r,
        raw: `${od}x${w}-${r}`,
      };
    }
  }
}

// ============== Load / Speed lookup per category ==============
export function loadKgFor(cat: TireCategory, li: number): number | null {
  if (cat === 'turismo') return turismoLI(li);
  if (cat === 'agricola') return AGRICULTURAL_LOAD_INDEX[li] ?? turismoLI(li);
  if (cat === 'camion') return TRUCK_LOAD_INDEX[li] ?? turismoLI(li);
  return turismoLI(li) ?? AGRICULTURAL_LOAD_INDEX[li] ?? null;
}

export function speedKmhFor(cat: TireCategory, sr: string): number | null {
  const u = sr.toUpperCase();
  if (cat === 'turismo') return turismoSR(sr);
  if (cat === 'camion') return TRUCK_SPEED_RATING[u] ?? turismoSR(sr);
  if (cat === 'agricola' || cat === 'vial' || cat === 'industrial' || cat === 'cuatriciclo') {
    return AGRICULTURAL_SPEED_RATING[u] ?? turismoSR(sr);
  }
  return turismoSR(sr);
}

// ============== Verdict extendido ==============
export interface VerdictExtInput {
  category: TireCategory;
  original: TireSize;
  nuevo: TireSize;
  loadIndexOriginal?: number;
  loadIndexNuevo?: number;
  speedRatingOriginal?: string;
  speedRatingNuevo?: string;
}

export function calcVerdictExtended(input: VerdictExtInput): VerdictResult {
  // Para turismo delegamos al cálculo original (mantiene sus tablas y detalles).
  if (input.category === 'turismo') {
    return calcVerdict({
      original: input.original,
      nuevo: input.nuevo,
      loadIndexOriginal: input.loadIndexOriginal,
      loadIndexNuevo: input.loadIndexNuevo,
      speedRatingOriginal: input.speedRatingOriginal,
      speedRatingNuevo: input.speedRatingNuevo,
    });
  }

  // Para el resto: geometría base sin LI/SR, y reemplazamos esas dos filas.
  const base = calcVerdict({ original: input.original, nuevo: input.nuevo });

  const newChecks: CheckResult[] = base.checks.map((c) => {
    if (c.label === 'Índice de carga' && input.loadIndexOriginal != null && input.loadIndexNuevo != null) {
      const kgO = loadKgFor(input.category, input.loadIndexOriginal);
      const kgN = loadKgFor(input.category, input.loadIndexNuevo);
      let status: CheckStatus = 'ok';
      let detail = '';
      if (kgO == null || kgN == null) {
        status = 'warn';
        detail = 'Índice de carga fuera de tabla para esta categoría.';
      } else if (kgN < kgO) {
        status = 'fail';
        detail = `Capacidad menor: ${kgN} kg vs ${kgO} kg original. No apto para esa carga.`;
      } else if (kgN === kgO) {
        detail = `Misma capacidad de carga (${kgN} kg).`;
      } else {
        detail = `Capacidad superior: ${kgN} kg vs ${kgO} kg original.`;
      }
      return { ...c, status, detail };
    }
    if (c.label === 'Índice de velocidad' && input.speedRatingOriginal && input.speedRatingNuevo) {
      const oKmh = speedKmhFor(input.category, input.speedRatingOriginal);
      const nKmh = speedKmhFor(input.category, input.speedRatingNuevo);
      let status: CheckStatus = 'ok';
      let detail = '';
      if (oKmh == null || nKmh == null) {
        status = 'warn';
        detail = 'Código de velocidad no reconocido para esta categoría.';
      } else if (nKmh < oKmh) {
        status = 'fail';
        detail = `Velocidad máxima menor: ${nKmh} km/h vs ${oKmh} km/h original.`;
      } else if (nKmh === oKmh) {
        detail = `Mismo rango de velocidad (${nKmh} km/h).`;
      } else {
        detail = `Rango superior: ${nKmh} km/h vs ${oKmh} km/h original.`;
      }
      return { ...c, status, detail };
    }
    return c;
  });

  const rank: Record<CheckStatus, number> = { ok: 0, warn: 1, fail: 2 };
  const global = newChecks.reduce<CheckStatus>(
    (acc, c) => (rank[c.status] >= rank[acc] ? c.status : acc),
    'ok'
  );

  return { ...base, checks: newChecks, global };
}

// ============== Extras: campos técnicos por categoría ==============
export interface TechExtras {
  construccion?: 'R' | 'D';
  pr?: string;
  tipoHuella?: string;
  tecnologia?: string;   // agrícola
  posicion?: string;     // camión
  liDoble?: string;      // camión
  camara?: 'TL' | 'TT';
}
