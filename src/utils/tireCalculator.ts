// Tire calculator utilities (no persistence, pure functions)

export interface TireSize {
  width: number;   // mm
  profile: number; // %
  rim: number;     // inches
  raw: string;
}

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface CheckResult {
  label: string;
  status: CheckStatus;
  detail: string;
}

export type SpeedometerDirection = 'reads-less' | 'reads-more' | 'none';

export interface VerdictResult {
  global: CheckStatus;
  checks: CheckResult[];
  speedometerDrift: number;          // % (diamNew - diamOrig) / diamOrig * 100
  speedometerDirection: SpeedometerDirection;
  diamOriginal: number;
  diamNuevo: number;
  circOriginal: number;
  circNuevo: number;
  flancoOriginal: number;
  flancoNuevo: number;
}

// ============== Parsing ==============

const SIZE_REGEX = /^\s*(\d{3})\s*\/\s*(\d{2,3})\s*[Rr]\s*(\d{2})\s*$/;

export function parseTireSize(input: string): TireSize {
  const m = input.match(SIZE_REGEX);
  if (!m) {
    throw new Error(
      'Formato inválido. Usá el formato 205/55R16'
    );
  }
  const width = parseInt(m[1], 10);
  const profile = parseInt(m[2], 10);
  const rim = parseInt(m[3], 10);
  if (width < 100 || width > 400) throw new Error('Ancho fuera de rango (100–400 mm)');
  if (profile < 20 || profile > 95) throw new Error('Perfil fuera de rango (20–95)');
  if (rim < 10 || rim > 26) throw new Error('Rodado fuera de rango (10–26)');
  return { width, profile, rim, raw: `${width}/${profile}R${rim}` };
}

// ============== Geometry ==============

export function calcSidewallHeight(t: TireSize): number {
  // mm
  return (t.width * t.profile) / 100;
}

export function calcDiameter(t: TireSize): number {
  // mm
  return calcSidewallHeight(t) * 2 + t.rim * 25.4;
}

export function calcCircumference(t: TireSize): number {
  return Math.PI * calcDiameter(t);
}

export function calcDiffPercent(orig: number, nuevo: number): number {
  return ((nuevo - orig) / orig) * 100;
}

// ============== Tables ==============

// ETRTO Load Index (60–125)
const LOAD_INDEX: Record<number, number> = {
  60: 250, 61: 257, 62: 265, 63: 272, 64: 280, 65: 290, 66: 300, 67: 307,
  68: 315, 69: 325, 70: 335, 71: 345, 72: 355, 73: 365, 74: 375, 75: 387,
  76: 400, 77: 412, 78: 425, 79: 437, 80: 450, 81: 462, 82: 475, 83: 487,
  84: 500, 85: 515, 86: 530, 87: 545, 88: 560, 89: 580, 90: 600, 91: 615,
  92: 630, 93: 650, 94: 670, 95: 690, 96: 710, 97: 730, 98: 750, 99: 775,
  100: 800, 101: 825, 102: 850, 103: 875, 104: 900, 105: 925, 106: 950,
  107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150,
  114: 1180, 115: 1215, 116: 1250, 117: 1285, 118: 1320, 119: 1360, 120: 1400,
  121: 1450, 122: 1500, 123: 1550, 124: 1600, 125: 1650,
};

export function loadIndexToKg(li: number): number | null {
  return LOAD_INDEX[li] ?? null;
}

// Speed rating order (lower → higher)
const SPEED_ORDER = ['Q', 'R', 'S', 'T', 'H', 'V', 'W', 'Y', '(Y)', 'Z'] as const;
const SPEED_KMH: Record<string, number> = {
  Q: 160, R: 170, S: 180, T: 190, H: 210, V: 240, W: 270, Y: 300, '(Y)': 300, Z: 240,
};

export type SpeedRating = typeof SPEED_ORDER[number];

export function speedRatingToKmh(sr: string): number | null {
  return SPEED_KMH[sr.toUpperCase()] ?? SPEED_KMH[sr] ?? null;
}

export function speedRatingOrder(sr: string): number {
  const upper = sr.toUpperCase();
  const idx = SPEED_ORDER.indexOf(upper as SpeedRating);
  return idx === -1 ? -1 : idx;
}

// ============== Verdict ==============

export interface VerdictInput {
  original: TireSize;
  nuevo: TireSize;
  loadIndexOriginal?: number;
  loadIndexNuevo?: number;
  speedRatingOriginal?: string;
  speedRatingNuevo?: string;
}

function worst(a: CheckStatus, b: CheckStatus): CheckStatus {
  const rank: Record<CheckStatus, number> = { ok: 0, warn: 1, fail: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function calcVerdict(input: VerdictInput): VerdictResult {
  const { original, nuevo } = input;
  const diamO = calcDiameter(original);
  const diamN = calcDiameter(nuevo);
  const circO = calcCircumference(original);
  const circN = calcCircumference(nuevo);
  const flancoO = calcSidewallHeight(original);
  const flancoN = calcSidewallHeight(nuevo);

  const diamDiffPct = calcDiffPercent(diamO, diamN);
  const widthDiff = nuevo.width - original.width;
  const rimDiff = nuevo.rim - original.rim;

  const checks: CheckResult[] = [];

  // 1) Diámetro
  const absDiam = Math.abs(diamDiffPct);
  let diamStatus: CheckStatus = 'ok';
  if (absDiam > 5) diamStatus = 'fail';
  else if (absDiam > 3) diamStatus = 'warn';
  checks.push({
    label: 'Diámetro exterior',
    status: diamStatus,
    detail:
      diamStatus === 'ok'
        ? `Diferencia ${formatPct(diamDiffPct)} — dentro del rango seguro (±3%).`
        : diamStatus === 'warn'
          ? `Diferencia ${formatPct(diamDiffPct)} — aceptable pero al límite (3–5%).`
          : `Diferencia ${formatPct(diamDiffPct)} — supera el 5% permitido.`,
  });

  // 2) Ancho de banda
  let widthStatus: CheckStatus = 'ok';
  if (Math.abs(widthDiff) > 30) widthStatus = 'fail';
  else if (Math.abs(widthDiff) > 20) widthStatus = 'warn';
  checks.push({
    label: 'Ancho de banda',
    status: widthStatus,
    detail:
      widthStatus === 'ok'
        ? `Variación de ${signed(widthDiff)} mm — sin riesgo de roce.`
        : widthStatus === 'warn'
          ? `Variación de ${signed(widthDiff)} mm — verificar luz contra suspensión y guardabarros.`
          : `Variación de ${signed(widthDiff)} mm — alto riesgo de roce en giros o suspensión comprimida.`,
  });

  // 3) Índice de carga
  let loadStatus: CheckStatus = 'ok';
  let loadDetail = 'No se ingresaron índices de carga.';
  if (input.loadIndexOriginal != null && input.loadIndexNuevo != null) {
    const kgO = loadIndexToKg(input.loadIndexOriginal);
    const kgN = loadIndexToKg(input.loadIndexNuevo);
    if (kgO == null || kgN == null) {
      loadStatus = 'warn';
      loadDetail = 'Índice de carga fuera de la tabla ETRTO (60–125).';
    } else if (kgN < kgO) {
      loadStatus = 'fail';
      loadDetail = `Capacidad menor: ${kgN} kg vs ${kgO} kg original. No apto para esa carga.`;
    } else if (kgN === kgO) {
      loadDetail = `Misma capacidad de carga (${kgN} kg).`;
    } else {
      loadDetail = `Capacidad superior: ${kgN} kg vs ${kgO} kg original.`;
    }
  }
  checks.push({ label: 'Índice de carga', status: loadStatus, detail: loadDetail });

  // 4) Índice de velocidad
  let speedStatus: CheckStatus = 'ok';
  let speedDetail = 'No se ingresaron códigos de velocidad.';
  if (input.speedRatingOriginal && input.speedRatingNuevo) {
    const oIdx = speedRatingOrder(input.speedRatingOriginal);
    const nIdx = speedRatingOrder(input.speedRatingNuevo);
    const oKmh = speedRatingToKmh(input.speedRatingOriginal);
    const nKmh = speedRatingToKmh(input.speedRatingNuevo);
    if (oIdx === -1 || nIdx === -1) {
      speedStatus = 'warn';
      speedDetail = 'Código de velocidad no reconocido.';
    } else if (nIdx < oIdx) {
      speedStatus = 'fail';
      speedDetail = `Velocidad máxima menor: ${nKmh} km/h vs ${oKmh} km/h original.`;
    } else if (nIdx === oIdx) {
      speedDetail = `Mismo rango de velocidad (${nKmh} km/h).`;
    } else {
      speedDetail = `Rango superior: ${nKmh} km/h vs ${oKmh} km/h original.`;
    }
  }
  checks.push({ label: 'Índice de velocidad', status: speedStatus, detail: speedDetail });

  // 5) Rodado
  let rimStatus: CheckStatus = 'ok';
  if (Math.abs(rimDiff) >= 3) rimStatus = 'fail';
  else if (Math.abs(rimDiff) >= 2) rimStatus = 'warn';
  checks.push({
    label: 'Rodado (llanta)',
    status: rimStatus,
    detail:
      rimDiff === 0
        ? 'Mismo rodado — sin cambio de llanta.'
        : rimStatus === 'ok'
          ? `${signed(rimDiff)} pulgada — cambio menor, verificar compatibilidad de llanta.`
          : rimStatus === 'warn'
            ? `${signed(rimDiff)} pulgadas — requiere cambio de llanta y revisión de offset.`
            : `${signed(rimDiff)} pulgadas — cambio significativo, puede afectar suspensión y frenos.`,
  });

  const global = checks.reduce<CheckStatus>((acc, c) => worst(acc, c.status), 'ok');

  let direction: SpeedometerDirection = 'none';
  if (Math.abs(diamDiffPct) >= 0.5) {
    direction = diamDiffPct > 0 ? 'reads-less' : 'reads-more';
  }

  return {
    global,
    checks,
    speedometerDrift: diamDiffPct,
    speedometerDirection: direction,
    diamOriginal: diamO,
    diamNuevo: diamN,
    circOriginal: circO,
    circNuevo: circN,
    flancoOriginal: flancoO,
    flancoNuevo: flancoN,
  };
}

// ============== Formatting helpers (es-AR) ==============

export function fmtNum(value: number, decimals = 1): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${fmtNum(value, 2)}%`;
}

export function signed(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
}
