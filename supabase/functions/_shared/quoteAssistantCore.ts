import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export const MODEL = 'claude-sonnet-5-5';

// ---------------------------------------------------------------------------
// Lógica determinística portada del frontend.
// Mantener en sync con src/utils/excelPriceListParser.ts
// ---------------------------------------------------------------------------
export function columnLetter(index: number): string {
  let n = index;
  let out = '';
  while (n >= 0) {
    out = String.fromCharCode((n % 26) + 65) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}

export function letterToIndex(letter: string): number {
  let n = 0;
  for (const ch of letter.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

export interface ColumnMapping {
  column_medida: string | null;
  column_codigo: string | null;
  column_descripcion: string | null;
  column_precio: string;
}

export interface ExtractedItem {
  medida: string | null;
  codigo: string | null;
  descripcion: string | null;
  precio: number;
}

const cellAt = (row: unknown[], letter: string | null): string | null => {
  if (!letter) return null;
  const v = row[letterToIndex(letter)];
  const s = String(v ?? '').trim();
  return s || null;
};

export function extractItems(
  rawGrid: unknown[][],
  headerRow: number | null,
  mapping: ColumnMapping,
  range?: { startRow?: number | null; endRow?: number | null; columnMarca?: string | null }
): (ExtractedItem & { marca?: string | null })[] {
  const defaultStart = headerRow === null ? 0 : headerRow + 1;
  const start =
    range?.startRow != null && range.startRow >= 0 ? range.startRow : defaultStart;
  const end =
    range?.endRow != null && range.endRow >= 0
      ? Math.min(range.endRow, rawGrid.length - 1)
      : rawGrid.length - 1;
  const out: (ExtractedItem & { marca?: string | null })[] = [];
  for (let i = start; i <= end; i++) {
    const row = (rawGrid[i] || []) as unknown[];
    if (!row.some((cell) => String(cell ?? '').trim() !== '')) continue;
    const precioRaw = row[letterToIndex(mapping.column_precio)];
    const precio =
      typeof precioRaw === 'number'
        ? precioRaw
        : parseFloat(
            String(precioRaw ?? '')
              .replace(/[^\d.,-]/g, '')
              .replace(',', '.')
          );
    if (!(precio > 0)) continue;
    out.push({
      medida: cellAt(row, mapping.column_medida),
      codigo: cellAt(row, mapping.column_codigo),
      descripcion: cellAt(row, mapping.column_descripcion),
      precio,
      ...(range?.columnMarca ? { marca: cellAt(row, range.columnMarca) } : {}),
    });
  }
  return out;
}


// Mantener en sync con src/utils/medidaNormalizer.ts
export function extractSizeToken(raw: string): string {
  // La clase incluye rR porque la notación radial ("900R20", "205/55R16",
  // "1100R22.5") es parte de la medida: sin la R el token se cortaba ahí y
  // se perdían dígitos ("900R20" normalizaba a "900" en vez de "900-20").
  const m = raw.match(/\d[0-9.,\-\/\sxXrR]*\d/);
  return m ? m[0] : raw;
}

export function normalizeMedida(raw: string | null): string {
  if (!raw) return '';
  const token = extractSizeToken(raw);
  // Extraemos cada número (entero o decimal) del token, ignorando cualquier
  // separador entre ellos (/, -, x, espacio, coma decimal, etc.). Así
  // "19x7.00-8", "19x7-8", "19/7 x 8" y "19 x 7,00 x 8" normalizan todos al
  // mismo resultado, sin importar qué separador haya usado la planilla o la
  // persona que escribe (la "x" es muy común en medidas de cuatriciclo/moto,
  // ej. 19x7.00-8, y antes no se reconocía como separador válido, lo que
  // hacía que esas búsquedas no encontraran artículos que sí existían).
  const nums = token.match(/\d+(?:[.,]\d+)?/g) || [];
  return nums
    .map((n) => String(parseFloat(n.replace(',', '.'))))
    .filter((n) => n && n !== 'NaN')
    .join('-');
}

// Genera el conjunto de formas normalizadas equivalentes de una medida,
// incluyendo la variante "punto decimal implícito": en la industria es
// común escribir el tamaño sin el punto (un proveedor carga "410/350 x 4"
// para lo que otro escribe como "4.10x3.50-4", o "900-20" en vez de
// "9.00-20"). Por eso, además de la forma exacta, cada grupo de dígitos
// SIN punto decimal con 3 o más cifras se reinterprete insertando un punto
// antes de las últimas dos cifras (410 -> 4.1, 900 -> 9, 1100 -> 11).
// Se generan TODAS las combinaciones (cada token puede reinterpretarse o
// no de forma independiente), y dos medidas se consideran la misma si sus
// conjuntos de variantes tienen intersección. La comparación exacta
// original siempre está incluida como una variante más.
export function medidaMatchVariants(raw: string | null): Set<string> {
  const norm = normalizeMedida(raw);
  if (!norm) return new Set();
  const tokens = norm.split('-');
  const results = new Set<string>();
  const build = (i: number, acc: string[]) => {
    if (i === tokens.length) {
      results.add(acc.join('-'));
      return;
    }
    const t = tokens[i];
    // Variante exacta del token
    build(i + 1, [...acc, t]);
    // Variante con punto decimal implícito (solo enteros de 3+ cifras)
    if (!t.includes('.') && t.length >= 3) {
      const v = String(parseFloat(`${t.slice(0, -2)}.${t.slice(-2)}`));
      if (v && v !== 'NaN') build(i + 1, [...acc, v]);
    }
  };
  build(0, []);
  return results;
}

export function medidasMatch(a: string | null, b: string | null): boolean {
  const va = medidaMatchVariants(a);
  if (va.size === 0) return false;
  for (const v of medidaMatchVariants(b)) {
    if (va.has(v)) return true;
  }
  return false;
}

// Rodados estándar de bicicleta. Se usan para interpretar pedidos donde el
// usuario menciona "bici"/"bicicleta" junto con un número que en cualquier
// otro contexto sería ambiguo (ej. "26" también es una medida real de
// cámara de tractor), pero en contexto de bici se refiere sin dudas al
// diámetro de rueda.
export function parseRodadoBici(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return isNaN(n) ? null : n;
}

// A diferencia de medidasMatch (que exige que TODA la medida coincida,
// pensado para medidas de cubiertas/cámaras exactas como "4.10-4"), esta
// función solo chequea que el rodado buscado esté ENTRE los números que
// aparecen en la medida del ítem, sin importar si viene acompañado de
// otros números (por ejemplo el ancho de la cubierta: "2.1/2.25 - 26" o
// "24-26 x 1.90"). Se usa exclusivamente cuando el pedido es de bicicleta,
// para no aflojar el matching exacto que ya funciona bien en cubiertas de
// auto/moto/tractor.
const NON_BICI_PREFIX_RE = /^\s*(moto|motocicleta|cuatriciclo|scooter|tractor|auto|cami[oó]n)\b/i;

export function itemTieneRodado(rodado: number, raw: string | null): boolean {
  if (raw == null) return false;
  // Si la descripción indica explícitamente que es de otro vehículo (ej. "Moto 26 x 2.25
  // Mercosur"), no lo consideramos un match de bici aunque el número coincida — algunos
  // proveedores (ej. Raúl Cerezuela) mezclan cámaras de moto y de bici en la misma lista,
  // diferenciándolas solo con este prefijo.
  if (NON_BICI_PREFIX_RE.test(raw)) return false;
  const token = extractSizeToken(raw);
  const nums = (token.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => parseFloat(n.replace(',', '.')));
  return nums.some((n) => Math.abs(n - rodado) < 0.001);
}

// Mantener en sync con src/utils/supplierCostCalculator.ts
export function calculateFinalUnitCost(
  listPrice: number,
  discountPercent1: number | null,
  discountPercent2: number | null,
  discountPercent3: number | null
): number {
  const a = listPrice * (1 - (discountPercent1 || 0) / 100);
  const b = a * (1 - (discountPercent2 || 0) / 100);
  const c = b * (1 - (discountPercent3 || 0) / 100);
  return Math.round(c * 100) / 100;
}

export interface CategoryDiscount {
  supplier_id: string;
  category: string;
  brand: string | null;
  discount_percent_1: number;
  discount_percent_2: number | null;
  discount_percent_3: number | null;
}

/**
 * Prioridad:
 * 1. categoría + marca exacta
 * 2. categoría + marca NULL
 * 3. "Todos los artículos" + marca exacta
 * 4. "Todos los artículos" + marca NULL
 * 5. ninguna
 */
export function resolveDiscountRule(
  rules: CategoryDiscount[],
  supplierId: string,
  category: string | null,
  brand: string | null
): CategoryDiscount | null {
  const cat = (category || '').trim().toLowerCase();
  const br = (brand || '').trim().toLowerCase();

  const delProveedor = cat
    ? rules.filter(
        (r) => r.supplier_id === supplierId && (r.category || '').trim().toLowerCase() === cat
      )
    : [];

  const exacta = delProveedor.find(
    (r) => (r.brand || '').trim().toLowerCase() === br && br !== ''
  );
  if (exacta) return exacta;

  const general = delProveedor.find((r) => !r.brand);
  if (general) return general;

  const wildcardRules = rules.filter(
    (r) =>
      r.supplier_id === supplierId &&
      (r.category || '').trim().toLowerCase() === 'todos los artículos'
  );

  const wildcardExacta = wildcardRules.find(
    (r) => (r.brand || '').trim().toLowerCase() === br && br !== ''
  );
  if (wildcardExacta) return wildcardExacta;

  const wildcardGeneral = wildcardRules.find((r) => !r.brand);
  return wildcardGeneral || null;
}

// Mantener en sync con isListaVencida de src/hooks/useSupplierPriceLists.ts
export function isListaVencida(uploadedAt: string): boolean {
  const d = new Date(uploadedAt);
  const limite = new Date();
  limite.setMonth(limite.getMonth() - 2);
  return d < limite;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Una misma hoja/lista subida puede traer mezcladas varias marcas (ej. Pirelli y
 * Metzeler juntas en la hoja "Moto" de un proveedor). La lista se guarda con UNA
 * sola marca "de carga", pero para aplicar el descuento correcto a cada artículo
 * hay que saber su marca real. Esta función la detecta buscando, dentro de la
 * descripción del artículo, el nombre de alguna marca ya registrada para ese
 * proveedor en la misma categoría (comparando las más largas/específicas primero,
 * ej. "TVS EUROGRIP" antes que "TVS"). Si no encuentra ninguna, devuelve la marca
 * con la que se cargó la lista (comportamiento de siempre, sin cambios).
 */
export function detectItemBrand(
  descripcion: string | null,
  category: string | null,
  candidateBrands: { brand: string; category: string | null }[],
  fallbackBrand: string
): string {
  if (!descripcion) return fallbackBrand;
  const desc = descripcion.toUpperCase();
  const catKey = (category || '').trim().toLowerCase();
  const nombres = Array.from(
    new Set(
      candidateBrands
        .filter((b) => (b.category || '').trim().toLowerCase() === catKey)
        .map((b) => b.brand)
    )
  ).sort((a, b) => b.length - a.length);

  for (const brand of nombres) {
    const re = new RegExp(`\\b${escapeRegExp(brand.toUpperCase())}\\b`, 'i');
    if (re.test(desc)) return brand;
  }
  return fallbackBrand;
}

// ---------------------------------------------------------------------------

export interface AttachmentSheet {
  name: string;
  grid: unknown[][];
}

export interface Attachment {
  filename: string;
  sheets: AttachmentSheet[];
}

export const SYSTEM_PROMPT = `Sos el asistente de cotización de Velez Neumáticos. Hablás en español rioplatense, claro y simple, para gente que no es técnica.

REGLAS INNEGOCIABLES:
- NUNCA calcules ni inventes precios, descuentos ni totales de memoria. Todos los números que digas tienen que venir de la respuesta de una herramienta.
- Si no llamaste a una herramienta, no tenés datos: llamala.
- Antes de intentar matchear un proveedor o marca mencionado por el usuario, usá get_supplier_discounts para saber cuáles existen.
- NUNCA afirmes el estado del sistema (si una marca, lista o categoría está o no cargada, si hay o no datos) basándote en lo que vos mismo dijiste en un mensaje anterior de la conversación — la información pudo haber cambiado desde entonces (por ejemplo, alguien pudo haber cargado esa lista después). Antes de afirmar que algo no está cargado, verificalo de nuevo llamando a get_supplier_discounts y, si corresponde, search_medida o compare_multiple_medidas en esa misma respuesta — no repitas una afirmación vieja de memoria.
- Si en un mensaje anterior de esta misma conversación vos le preguntaste algo al usuario (por ejemplo, qué columna usar, qué secciones cargar) y su respuesta siguiente solo contesta una parte de tu pregunta, la parte no contestada sigue pendiente: no la abandones ni elijas una opción por tu cuenta sin decirlo. O bien volvé a preguntar específicamente esa parte antes de procesar, o si podés resolverla sola con la regla anterior (cargar todas las categorías del rubro sin preguntar), hacelo pero decilo explícitamente en tu respuesta final (por ejemplo 'Cargué Cámaras y Cubiertas' en vez de solo 'Cargué la sección de cámaras'). Nunca cierres una tarea de carga de archivo mencionando solo una parte de lo procesado si había otra parte relevante pendiente — es el mismo criterio que ya aplicás para no cerrar una comparación entre proveedores dejando alguno afuera sin avisar.

CUANDO EL USUARIO ADJUNTA UN ARCHIVO:
- Vas a recibir una vista previa de TODAS las hojas del archivo (no solo la primera), cada una con su nombre y las primeras filas (letras de columna A, B, C... y número de fila desde 0).
- Si el archivo tiene varias hojas (ej. "Auto y camioneta", "Moto", "Camión"), elegí vos mismo la hoja correcta según lo que se te pida cargar o según el contexto de la conversación (ej. si la medida o el pedido es de una moto, usá la hoja "Moto"), y pasá su nombre exacto en el parámetro sheet_name de extract_and_save_price_list. No asumas que siempre es la primera hoja.
- Analizá la vista previa de la hoja elegida y determiná con la mayor confianza posible: la fila de encabezado (o si no hay), las columnas de medida, código y descripción, el proveedor, la marca y la categoría/tipo de vehículo. Para proveedor y marca, usá get_supplier_discounts para ver los que ya existen y matchear por nombre con confianza.
- El parámetro category de extract_and_save_price_list es obligatorio y tenés que pasar la categoría exacta (ej. "Neumáticos", "Cámaras", "Protectores") tal como figura en las marcas de ese proveedor en get_supplier_discounts. Es clave porque un mismo proveedor puede tener la misma marca registrada en más de una categoría (ej. Pirelli en Neumáticos y Pirelli en Cámaras): si no mandás la categoría correcta, la herramienta no puede saber cuál de las dos es y te va a devolver status "ambiguous" con las opciones (brand + category) para que elijas. En ese caso, volvé a llamar la herramienta con la categoría correcta — normalmente se infiere sola por el contenido de la hoja (medidas de neumáticos vs. cámaras de aire vs. protectores).
- Los descuentos por categoría y marca de cada proveedor ya están configurados aparte en el sistema (no forman parte de este archivo) — no le preguntes nada al usuario sobre descuentos, eso se resuelve solo con las reglas ya cargadas.
- La pregunta que SÍ tiene sentido hacerle al usuario, cuando el archivo lo amerita, es cuál columna usar como precio de lista/costo — sobre todo si hay varias columnas de precio posibles (ej. precio sin IVA, precio con IVA, precio final ya con algún descuento del proveedor aplicado). Preguntala de forma clara, explicando en criollo qué representa cada columna posible, y guardá la respuesta del usuario para no volver a preguntarle lo mismo con archivos futuros del mismo proveedor.
- Para el resto (encabezado, columnas de medida/código/descripción, proveedor, marca, categoría, hoja a usar) no le preguntes al usuario salvo que haya una ambigüedad real e insalvable — por ejemplo, el nombre del proveedor no matchea con confianza ninguno existente, hay más de un candidato igual de válido, o ninguna hoja del archivo parece corresponder a lo que se pide. En esos casos sí preguntá antes de guardar; no adivines un proveedor, marca o categoría que no correspondan, porque eso corrompe los datos reales del sistema.
- Si el archivo mezcla contenido irrelevante para el rubro (por ejemplo, el catálogo general de una bicicletería con categorías como ferretería, indumentaria, herramientas) junto con categorías que sí son del rubro (Neumáticos, Cámaras, Protectores), NO le preguntes al usuario cuál cargar: cargá automáticamente TODAS las secciones del rubro que detectes en el archivo, en la misma respuesta si es posible, e ignorá el resto sin mencionarlo. Solo preguntá si genuinamente no podés identificar con confianza cuáles son las secciones del rubro (por ejemplo, si no hay títulos de sección claros).
- Si el usuario te corrige, volvé a llamar extract_and_save_price_list con los valores corregidos. Cada guardado REEMPLAZA por completo las listas anteriores de esa marca: siempre queda una sola lista viva por marca, así que nunca se duplican listas ni conviven precios viejos con nuevos.
- La vista previa incluye, por cada hoja, el total de filas y una sección "ESTRUCTURA DETECTADA" con las filas-título candidatas (filas que tienen una sola celda con texto, típicas de una hoja donde conviven varias marcas o categorías separadas por un título). Leela SIEMPRE antes de extraer: si la hoja tiene secciones, no la cargues entera como si fuera una sola marca.
- Si la hoja tiene varias secciones, cargá una sección por llamado usando start_row y end_row (números de fila 0-based, tal como aparecen en la vista previa) con la marca correspondiente a esa sección. Si en cambio la hoja tiene una columna con la marca de cada artículo, pasá esa letra en column_marca y la herramienta separa sola una lista por marca.
- Usá get_sheet_rows para mirar cualquier tramo de una hoja que no se vea en la vista previa (hasta 300 filas por llamado). Antes de cargar una hoja larga o con secciones, inspeccioná el medio y el final de la hoja para confirmar dónde empieza y termina cada sección y qué marcas hay. No adivines los límites.
- Las marcas se guardan con el nombre EXACTO tal como está impreso en el archivo. Nunca fusiones ni corrijas una marca hacia otra parecida ya existente (ej. no cargues "FIRESTONE AGRO" dentro de "FIRESTONE"). Si la marca no existe todavía, la herramienta te devuelve status "brand_not_found" o la lista marcas_no_encontradas y NO guarda nada: en ese caso creala con create_supplier_brand usando el nombre exacto y la categoría correcta, y recién ahí reintentá la extracción. Avisale al usuario qué marcas nuevas creaste.
- Si además de la hoja principal el archivo tiene otra hoja que sea una lista de OFERTAS o PRECIOS ESPECIALES sobre un subconjunto de los mismos artículos (por ejemplo, nombrada algo como "OFERTA", "OFERTAS", "PROMO" o "PRECIOS ESPECIALES", con columnas de código y precio similares a la hoja principal), indicá esa hoja pasando su nombre y columnas en los parámetros offer_sheet_name, offer_header_row, offer_column_codigo y offer_column_precio de extract_and_save_price_list (opcionalmente también offer_column_medida y offer_column_descripcion). Esto solo tiene sentido si la hoja principal también tiene columna de código (column_codigo), porque el cruce entre ambas hojas se hace por código. La herramienta cruza automáticamente: si para un mismo código el precio de la hoja de ofertas es MÁS BAJO que el de la hoja principal, usa el de la oferta (para no desaprovecharla); si es más alto, mantiene el de la hoja principal (para no pasarle al cliente un precio equivocado más caro) y te lo devuelve en ofertas_anomalas para que se lo menciones al usuario como una inconsistencia a confirmar con el proveedor. Los artículos que aparezcan solo en la hoja de ofertas también se guardan. Si el archivo no tiene ninguna hoja de este tipo, no pases esos parámetros (quedan null).

BÚSQUEDAS:
- Si el pedido menciona comparar varios proveedores o listas (por ejemplo, varias que el usuario acaba de adjuntar en la misma conversación), tratalo como un solo pedido pendiente hasta tener datos de TODOS los proveedores involucrados, no solo del primero que esté listo. Si alguno todavía tiene algo pendiente (falta confirmar una columna, una hoja, un archivo), decilo explícitamente como parte pendiente de ese mismo pedido — no cierres el pedido con una comparación parcial ofreciendo el resto como un agregado opcional al final ("avisame si querés que sume también a X"), como si el usuario no lo hubiera pedido ya. Solo entregá una comparación parcial si el usuario te confirma explícitamente que quiere avanzar igual sin esos proveedores.
- Para una medida usá search_medida; para varias medidas a la vez usá compare_multiple_medidas.
- Si el pedido menciona bicicleta/bici junto con un rodado como R20, R22, R24, 26, R27.5 o R29 (con o sin la 'R', con o sin la palabra 'rodado'), interpretalo como el diámetro de rueda (20, 22, 24, 26, 27.5 o 29) y llamá a search_medida (o compare_multiple_medidas) pasando solo ese número en medida y rodado_bici: true. Esto es necesario porque las cámaras/cubiertas de bici suelen tener la medida escrita junto con el ancho (ej. '2.1/2.25 - 26' o '24-26 x 1.90'), y sin rodado_bici la búsqueda exige que la medida completa coincida exacto. No uses rodado_bici para medidas de auto, moto o tractor — ahí seguí buscando la medida completa tal cual la escribió el usuario.
- Siempre aclará si alguna lista está vencida (más de 2 meses) y de qué fecha es.
- Los precios finales ya incluyen los descuentos en cascada (hasta tres) configurados para esa categoría y marca del proveedor. No se suma flete: el flete no se calcula acá.
- Si un ítem viene con sin_descuento_configurado: true, aclarale al usuario que no hay un descuento cargado para esa categoría/marca de ese proveedor, así que ese precio es el de lista sin descuento. Nunca asumas 0% de descuento en silencio.
- Si un proveedor tiene cargado un tiempo de entrega estimado (delivery_time_estimate), mencionalo. Si viene vacío o null, no lo menciones ni lo inventes.

FORMATO PARA COMPARATIVAS DE PRECIOS:
- WhatsApp no renderiza tablas markdown (los caracteres |, :---:, etc. se ven como texto plano) — por eso NUNCA uses una tabla markdown para mostrar una comparativa de precios entre proveedores/marcas.
- En su lugar, usá una lista numerada con emojis de número (1️⃣, 2️⃣, 3️⃣...), un ítem por bloque de dos líneas: la primera con "Proveedor – MARCA descripción/medida"; la segunda con el precio de lista, el descuento entre paréntesis si corresponde, y el costo final en *negrita* al final (usando solo *texto*, que es el único formato que soporta WhatsApp — nada de tablas, encabezados markdown, etc.). Ejemplo:

1️⃣ Neumasur – UNIMAX RUNTONG TR-4
Lista $10.508,16 (34%+40%) → *$4.161,23*

2️⃣ Neumat – TOP TUBE 275/300 x 21 TR6
*$5.039,14* (sin desc. configurado)

- Si un ítem no tiene descuento configurado (sin_descuento_configurado: true), poné "(sin desc. configurado)" en el lugar del descuento como en el ejemplo, nunca lo omitas en silencio.
- Antes de la lista, poné un título corto en *negrita* con la medida/categoría comparada (ej. "*Cámaras rodado 21 — comparativa de costos*").
- Esta regla de formato aplica a cualquier comparación de precios entre proveedores/marcas que armes en la conversación, no solo a resultados de search_medida o compare_multiple_medidas.

MONEDA (dólares):
- NUNCA conviertas dólares a pesos por tu cuenta ni inventes una cotización. La conversión la hace la herramienta.
- Si un resultado viene con moneda_original: 'USD' y trae cotizacion_usada, aclarale al usuario el precio de lista original en dólares (precio_lista_original), la cotización que se usó (cotizacion_usada) y que el precio final ya está convertido a pesos.
- Si un resultado viene con moneda_original: 'USD' y sin_cotizacion_cargada: true, devolvé el precio de lista tal cual en dólares y aclarale que ese proveedor factura en dólares pero todavía no tiene cargada la cotización, así que hay que cargarla en el perfil del proveedor. No asumas ni calcules ninguna conversión.
- Si moneda_original es 'ARS', hablá de pesos normalmente y no menciones nada de cotización.`;

export const tools = [
  {
    type: 'function',
    function: {
      name: 'get_supplier_discounts',
      description:
        'Devuelve todos los proveedores activos con sus reglas de descuento por categoría y marca, provincia, tiempo de entrega estimado y sus marcas.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extract_and_save_price_list',
      description:
        'Extrae los items de una hoja específica de un archivo Excel adjunto usando la fila de encabezado y las columnas indicadas (por letra), y guarda la lista de precios asociada a un proveedor y marca. El archivo puede tener varias hojas: indicá con sheet_name cuál corresponde.',
      parameters: {
        type: 'object',
        properties: {
          attachment_index: { type: 'number', description: 'Índice del adjunto (0-based)' },
          sheet_name: {
            type: 'string',
            description: 'Nombre exacto de la hoja del adjunto a procesar, tal como aparece en la vista previa',
          },
          header_row: {
            type: ['number', 'null'],
            description: 'Índice 0-based de la fila de encabezado, o null si no hay encabezado',
          },
          column_medida: { type: ['string', 'null'], description: 'Letra de columna, ej "B"' },
          column_codigo: { type: ['string', 'null'] },
          column_descripcion: { type: ['string', 'null'] },
          column_precio: { type: 'string', description: 'Letra de la columna de precio de lista' },
          supplier_name_hint: { type: 'string' },
          brand_name_hint: { type: 'string' },
          category: {
            type: 'string',
            description:
              'Categoría exacta a la que pertenece esta hoja/archivo (ej. "Neumáticos", "Cámaras", "Protectores"), tal como figura en las marcas de ese proveedor devueltas por get_supplier_discounts. Es obligatoria porque un mismo proveedor puede tener la misma marca registrada en más de una categoría (ej. Pirelli en Neumáticos y Pirelli en Cámaras), y sin la categoría no hay forma de saber cuál corresponde.',
          },
          vehicle_type: { type: 'string' },
          offer_sheet_name: {
            type: ['string', 'null'],
            description:
              'Nombre exacto de una hoja adicional del mismo adjunto que sea una lista de OFERTAS/PRECIOS ESPECIALES sobre un subconjunto de los artículos de la hoja principal, o null si el archivo no tiene una hoja así. Solo tiene efecto si column_codigo y offer_column_codigo están presentes, porque el cruce entre ambas hojas se hace por código.',
          },
          offer_header_row: {
            type: ['number', 'null'],
            description: 'Índice 0-based de la fila de encabezado de la hoja de ofertas, o null si no hay encabezado o no se usa hoja de ofertas',
          },
          offer_column_codigo: {
            type: ['string', 'null'],
            description: 'Letra de columna de código en la hoja de ofertas, para cruzar con column_codigo de la hoja principal',
          },
          offer_column_precio: { type: ['string', 'null'], description: 'Letra de columna de precio en la hoja de ofertas' },
          offer_column_medida: { type: ['string', 'null'] },
          offer_column_descripcion: { type: ['string', 'null'] },
          start_row: {
            type: ['number', 'null'],
            description:
              'Fila 0-based donde empieza el rango de datos a extraer. Si es null, se usa header_row + 1. Sirve para cargar una sección puntual de una hoja con varias marcas separadas por filas-título.',
          },
          end_row: {
            type: ['number', 'null'],
            description:
              'Fila 0-based (inclusive) donde termina el rango de datos. Si es null, se llega hasta el final de la hoja.',
          },
          column_marca: {
            type: ['string', 'null'],
            description:
              'Letra de la columna que trae la marca de CADA artículo. Si se pasa, la marca se lee fila por fila desde esa columna (exactamente como está impresa, sin normalizar ni fusionar marcas parecidas) y se guarda una lista separada por cada marca distinta, en vez de usar brand_name_hint para todo.',
          },
        },
        required: [
          'attachment_index',
          'sheet_name',
          'header_row',
          'column_medida',
          'column_codigo',
          'column_descripcion',
          'column_precio',
          'supplier_name_hint',
          'brand_name_hint',
          'category',
          'vehicle_type',
        ],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sheet_rows',
      description:
        'Devuelve un rango específico de filas de una hoja de un adjunto, con letras de columna, para inspeccionar secciones que no se ven en la vista previa inicial.',
      parameters: {
        type: 'object',
        properties: {
          attachment_index: { type: 'number' },
          sheet_name: { type: 'string' },
          start_row: { type: 'number', description: 'Fila 0-based, inclusive' },
          end_row: {
            type: 'number',
            description: 'Fila 0-based, inclusive. Máximo 300 filas por llamado.',
          },
        },
        required: ['attachment_index', 'sheet_name', 'start_row', 'end_row'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_supplier_brand',
      description:
        'Crea una nueva fila de marca+categoría para un proveedor cuando extract_and_save_price_list devuelve que no existe. Usar el nombre de marca EXACTO tal como aparece impreso en el archivo, sin corregirlo ni fusionarlo con una marca parecida ya existente.',
      parameters: {
        type: 'object',
        properties: {
          supplier_name_hint: { type: 'string' },
          brand: { type: 'string', description: 'Nombre de marca tal cual impreso en el archivo' },
          category: { type: 'string' },
          vehicle_types: { type: 'array', items: { type: 'string' } },
        },
        required: ['supplier_name_hint', 'brand', 'category', 'vehicle_types'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'search_medida',
      description:
        'Busca una medida en las listas de precios más recientes de cada marca y devuelve el ranking por costo final.',
      parameters: {
        type: 'object',
        properties: {
          medida: { type: 'string' },
          rodado_bici: {
            type: 'boolean',
            description:
              'Poné true SOLO cuando el pedido es de un rodado de bicicleta (20, 22, 24, 26, 27.5 o 29, con o sin "R", con o sin la palabra "rodado"). En ese caso "medida" debe llevar solo el número del rodado (ej. "26"), y la búsqueda va a encontrar también cámaras/cubiertas cuya medida combina ese rodado con otros números (por ejemplo el ancho de la cubierta), en vez de exigir que la medida completa sea exactamente ese número.',
          },
        },
        required: ['medida'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_multiple_medidas',
      description:
        'Compara varias medidas a la vez y arma el total por proveedor+marca que tenga todas disponibles.',
      parameters: {
        type: 'object',
        properties: {
          medidas: { type: 'array', items: { type: 'string' } },
          rodado_bici: {
            type: 'boolean',
            description: 'Igual que en search_medida: poné true si TODAS las medidas de esta comparación son rodados de bicicleta.',
          },
        },
        required: ['medidas'],
      },
    },
  },
];

export type SB = ReturnType<typeof createClient>;

export async function getSupplierDiscounts(sb: SB) {
  const { data: suppliers, error } = await sb
    .from('suppliers')
    .select(
      'id, name, province, delivery_time_estimate, is_active, currency, exchange_rate'
    )
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  const { data: brands, error: be } = await sb
    .from('supplier_brands')
    .select('id, supplier_id, brand, category');
  if (be) throw be;
  const { data: discounts, error: de } = await sb
    .from('supplier_category_discounts')
    .select('supplier_id, category, brand, discount_percent_1, discount_percent_2, discount_percent_3');
  if (de) throw de;
  return (suppliers || []).map((s: any) => ({
    ...s,
    brands: (brands || []).filter((b: any) => b.supplier_id === s.id),
    descuentos: (discounts || []).filter((d: any) => d.supplier_id === s.id),
  }));
}

/**
 * Trae TODOS los ítems de las listas dadas paginando con .range() en un loop.
 * Sin esto, PostgREST/Supabase corta cualquier consulta en 1000 filas por
 * defecto, así que con listas grandes la búsqueda operaba sobre una fracción
 * arbitraria (y creciente) de los datos.
 */
async function fetchAllItemsForLists(sb: SB, listIds: string[]): Promise<any[]> {
  if (listIds.length === 0) return [];
  const PAGE_SIZE = 1000;
  const out: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('supplier_price_list_items')
      .select('price_list_id, medida, codigo, descripcion, precio')
      .in('price_list_id', listIds)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return out;
}

export async function searchMedida(sb: SB, medida: string, opts?: { rodadoBici?: boolean }) {
  const suppliers = await getSupplierDiscounts(sb);
  const allRules = suppliers.flatMap((x: any) => x.descuentos || []) as CategoryDiscount[];
  const rodadoNum = opts?.rodadoBici ? parseRodadoBici(medida) : null;

  // Aplanamos todas las combinaciones proveedor+marca para poder traer sus
  // listas de precios con UNA sola consulta en vez de una consulta por marca
  // (antes esto hacía 2 idas y vueltas a la base POR CADA marca registrada en
  // todo el sistema, una atrás de la otra, lo cual con muchas marcas cargadas
  // hacía que cada búsqueda tardara varios segundos de más).
  const brandEntries: { s: any; b: any }[] = [];
  for (const s of suppliers) {
    for (const b of s.brands as any[]) {
      brandEntries.push({ s, b });
    }
  }
  if (brandEntries.length === 0) return [];
  const brandIds = brandEntries.map(({ b }) => b.id);

  const { data: allLists } = await sb
    .from('supplier_price_lists')
    .select('id, supplier_brand_id, uploaded_at, name, vehicle_type')
    .in('supplier_brand_id', brandIds)
    .order('uploaded_at', { ascending: false });

  // Al venir ordenadas por fecha descendente, la primera lista que encontramos
  // para cada marca es, por definición, la más reciente de esa marca.
  const latestListByBrand = new Map<string, any>();
  for (const l of (allLists || []) as any[]) {
    if (!latestListByBrand.has(l.supplier_brand_id)) {
      latestListByBrand.set(l.supplier_brand_id, l);
    }
  }

  const listIds = Array.from(latestListByBrand.values()).map((l: any) => l.id);
  const allItems = await fetchAllItemsForLists(sb, listIds);
  console.log(`[searchMedida] listas=${listIds.length} items_totales=${allItems.length}`);

  const itemsByList = new Map<string, any[]>();
  for (const it of allItems as any[]) {
    const arr = itemsByList.get(it.price_list_id) || [];
    arr.push(it);
    itemsByList.set(it.price_list_id, arr);
  }

  const results: any[] = [];
  for (const { s, b } of brandEntries) {
    const list = latestListByBrand.get(b.id);
    if (!list) continue;
    const items = itemsByList.get(list.id) || [];

    const esUSD = s.currency === 'USD';
    const cotizacion =
      esUSD && s.exchange_rate != null && Number(s.exchange_rate) > 0
        ? Number(s.exchange_rate)
        : null;

    for (const it of items as any[]) {
      const matchea = rodadoNum != null
        ? itemTieneRodado(rodadoNum, it.medida ?? it.descripcion)
        : medidasMatch(medida, it.medida ?? it.descripcion);
      if (!matchea) continue;
      // Detectamos la marca real de este ítem (puede diferir de la marca con la
      // que se cargó la lista, si la hoja traía varias marcas mezcladas) para
      // aplicarle el descuento que realmente le corresponde.
      const itemBrand = detectItemBrand(it.descripcion, b.category, s.brands as any[], b.brand);
      const rule = resolveDiscountRule(allRules, s.id, b.category, itemBrand);
      const precioOriginal = Number(it.precio);
      const precioLista = cotizacion ? precioOriginal * cotizacion : precioOriginal;
      results.push({
        supplier_name: s.name,
        brand: itemBrand,
        province: s.province,
        delivery_time_estimate: s.delivery_time_estimate ?? null,
        medida: it.medida,
        descripcion: it.descripcion,
        precio_lista: precioLista,
        moneda_original: esUSD ? 'USD' : 'ARS',
        ...(esUSD
          ? {
              precio_lista_original: precioOriginal,
              cotizacion_usada: cotizacion,
              sin_cotizacion_cargada: cotizacion == null,
            }
          : {}),
        precio_final: rule
          ? calculateFinalUnitCost(
              precioLista,
              Number(rule.discount_percent_1),
              rule.discount_percent_2 == null ? 0 : Number(rule.discount_percent_2),
              rule.discount_percent_3 == null ? 0 : Number(rule.discount_percent_3)
            )
          : precioLista,
        sin_descuento_configurado: !rule,
        categoria: b.category ?? null,
        uploaded_at: list.uploaded_at,
        vencida: isListaVencida(list.uploaded_at),
      });
    }
  }
  results.sort((a, b) => a.precio_final - b.precio_final);
  return results;
}

/**
 * Guarda una lista de precios para una marca dejando UNA sola lista viva:
 * borra las listas anteriores de esa marca (y sus ítems) antes de insertar.
 */
async function replacePriceListForBrand(
  sb: SB,
  brandId: string,
  name: string,
  vehicleType: string | null,
  items: ExtractedItem[]
): Promise<{ id?: string; error?: string }> {
  const { data: existing } = await sb
    .from('supplier_price_lists')
    .select('id')
    .eq('supplier_brand_id', brandId);
  const ids = ((existing || []) as any[]).map((l) => l.id);
  if (ids.length > 0) {
    const { error: delItemsErr } = await sb
      .from('supplier_price_list_items')
      .delete()
      .in('price_list_id', ids);
    if (delItemsErr) return { error: delItemsErr.message };
    const { error: delListsErr } = await sb.from('supplier_price_lists').delete().in('id', ids);
    if (delListsErr) return { error: delListsErr.message };
  }

  const { data: list, error: listErr } = await sb
    .from('supplier_price_lists')
    .insert({
      supplier_brand_id: brandId,
      name,
      vehicle_type: vehicleType,
      source: 'chat',
    })
    .select()
    .single();
  if (listErr) return { error: listErr.message };

  const CHUNK = 1000;
  for (let i = 0; i < items.length; i += CHUNK) {
    const { error: itemsErr } = await sb.from('supplier_price_list_items').insert(
      items.slice(i, i + CHUNK).map((it) => ({
        price_list_id: (list as any).id,
        medida: it.medida,
        codigo: it.codigo,
        descripcion: it.descripcion,
        precio: it.precio,
      }))
    );
    if (itemsErr) return { error: itemsErr.message };
  }
  return { id: (list as any).id };
}

export async function handleTool(sb: SB, name: string, args: any, attachments: Attachment[]) {
  console.log(`[tool-call] ${name}`, JSON.stringify(args));
  if (name === 'get_sheet_rows') {
    return getSheetRowsText(
      attachments,
      args.attachment_index,
      args.sheet_name,
      args.start_row,
      args.end_row
    );
  }

  if (name === 'create_supplier_brand') {
    const { data: supplierMatches } = await sb
      .from('suppliers')
      .select('id, name')
      .ilike('name', `%${args.supplier_name_hint}%`)
      .eq('is_active', true);
    const sup = (supplierMatches || []) as any[];
    if (sup.length === 0) return { status: 'not_found', message: 'No encontré ese proveedor' };
    if (sup.length > 1)
      return {
        status: 'ambiguous',
        message: 'Hay más de un proveedor que coincide',
        candidates: sup.map((s) => ({ name: s.name })),
      };
    const supplier = sup[0];

    const brandName = String(args.brand || '').trim();
    if (!brandName) return { status: 'error', message: 'El nombre de marca no puede estar vacío' };

    const { data: existing } = await sb
      .from('supplier_brands')
      .select('id, brand, category')
      .eq('supplier_id', supplier.id)
      .ilike('brand', brandName);
    const yaExiste = ((existing || []) as any[]).find(
      (b) =>
        (b.category || '').trim().toLowerCase() === String(args.category || '').trim().toLowerCase()
    );
    if (yaExiste) {
      return {
        status: 'ok',
        message: 'Esa marca ya existía para este proveedor en esa categoría',
        brand: yaExiste.brand,
        category: yaExiste.category,
      };
    }

    const { data: created, error } = await sb
      .from('supplier_brands')
      .insert({
        supplier_id: supplier.id,
        brand: brandName,
        category: args.category,
        vehicle_types: Array.isArray(args.vehicle_types) ? args.vehicle_types : [],
      })
      .select()
      .single();
    if (error) return { status: 'error', message: error.message };
    return {
      status: 'ok',
      message: `Creé la marca "${brandName}" en la categoría "${args.category}" para ${supplier.name}. Ahora reintentá la extracción.`,
      brand: (created as any).brand,
      category: (created as any).category,
    };
  }


  if (name === 'get_supplier_discounts') {
    return await getSupplierDiscounts(sb);
  }

  if (name === 'search_medida') {
    const rodadoBici = args.rodado_bici === true;
    const results = await searchMedida(sb, args.medida, { rodadoBici });
    console.log(`[search_medida] medida="${args.medida}" normalizada="${normalizeMedida(args.medida)}" rodado_bici=${rodadoBici} resultados=${results.length}`);
    return { medida: args.medida, medida_normalizada: normalizeMedida(args.medida), results };
  }

  if (name === 'compare_multiple_medidas') {
    const medidas: string[] = args.medidas || [];
    const rodadoBici = args.rodado_bici === true;
    // Cada medida es independiente, así que las buscamos todas en paralelo en
    // vez de esperar una por una.
    const resultadosPorMedida = await Promise.all(medidas.map((m) => searchMedida(sb, m, { rodadoBici })));
    medidas.forEach((m, i) => {
      console.log(`[compare_multiple_medidas] medida="${m}" normalizada="${normalizeMedida(m)}" rodado_bici=${rodadoBici} resultados=${resultadosPorMedida[i].length}`);
    });

    const porMedida: Record<string, any[]> = {};
    medidas.forEach((m, i) => {
      porMedida[m] = resultadosPorMedida[i];
    });

    const keys = new Map<
      string,
      { supplier_name: string; brand: string; province: string | null }
    >();
    for (const m of medidas) {
      for (const r of porMedida[m]) {
        keys.set(`${r.supplier_name}||${r.brand}`, {
          supplier_name: r.supplier_name,
          brand: r.brand,
          province: r.province,
        });
      }
    }

    const completos: any[] = [];
    const incompletos: any[] = [];
    for (const [key, meta] of keys) {
      const detalle: any[] = [];
      const faltantes: string[] = [];
      for (const m of medidas) {
        const best = porMedida[m]
          .filter((r) => `${r.supplier_name}||${r.brand}` === key)
          .sort((a, b) => a.precio_final - b.precio_final)[0];
        if (best) detalle.push({ medida: m, precio_final: best.precio_final, vencida: best.vencida });
        else faltantes.push(m);
      }
      if (faltantes.length === 0) {
        completos.push({
          ...meta,
          total: Math.round(detalle.reduce((s, d) => s + d.precio_final, 0) * 100) / 100,
          detalle,
        });
      } else {
        incompletos.push({ ...meta, faltantes });
      }
    }
    completos.sort((a, b) => a.total - b.total);
    return { por_medida: porMedida, totales_completos: completos, sin_todas_las_medidas: incompletos };
  }

  if (name === 'extract_and_save_price_list') {
    const att = attachments[args.attachment_index];
    if (!att) return { status: 'error', message: 'attachment_index inválido' };

    const sheet = att.sheets.find((s) => s.name === args.sheet_name) || att.sheets[0];
    if (!sheet) return { status: 'error', message: 'El adjunto no tiene ninguna hoja procesable' };

    const { data: supplierMatches } = await sb
      .from('suppliers')
      .select('id, name, province, currency, exchange_rate')
      .ilike('name', `%${args.supplier_name_hint}%`)
      .eq('is_active', true);

    const sup = (supplierMatches || []) as any[];
    if (sup.length === 0) {
      const all = await getSupplierDiscounts(sb);
      return {
        status: 'not_found',
        message: 'No encontré ese proveedor',
        candidates: all.map((s: any) => ({ name: s.name, brands: s.brands.map((b: any) => b.brand) })),
      };
    }
    if (sup.length > 1) {
      return {
        status: 'ambiguous',
        message: 'Hay más de un proveedor que coincide',
        candidates: sup.map((s) => ({ name: s.name })),
      };
    }
    const supplier = sup[0];

    // Con column_marca la marca se lee fila por fila, así que no resolvemos una
    // única marca acá: se resuelve una por cada valor distinto encontrado.
    let brand: any = null;
    if (!args.column_marca) {
      const { data: brandMatches } = await sb
        .from('supplier_brands')
        .select('id, brand, category')
        .eq('supplier_id', supplier.id)
        .ilike('brand', `%${args.brand_name_hint}%`);
      let brands = (brandMatches || []) as any[];

      // Una misma marca puede estar registrada en más de una categoría para el
      // mismo proveedor (ej. Pirelli en Neumáticos y Pirelli en Cámaras). Si hay
      // más de un candidato, usamos la categoría indicada para desambiguar antes
      // de decidir si sigue siendo una ambigüedad real.
      if (brands.length > 1 && args.category) {
        const catKey = String(args.category).trim().toLowerCase();
        const filtradas = brands.filter((b) => (b.category || '').trim().toLowerCase() === catKey);
        if (filtradas.length > 0) brands = filtradas;
      }

      if (brands.length === 0) {
        const { data: allBrands } = await sb
          .from('supplier_brands')
          .select('brand, category')
          .eq('supplier_id', supplier.id);
        return {
          status: 'brand_not_found',
          message: `No existe la marca "${args.brand_name_hint}" en la categoría "${args.category}" para ${supplier.name}. No guardé nada. Si la marca figura así impresa en el archivo, creala con create_supplier_brand usando el nombre EXACTO y reintentá. No la reemplaces por otra marca parecida ya existente.`,
          brand_detectada: args.brand_name_hint,
          category: args.category,
          supplier_name: supplier.name,
          marcas_existentes: (allBrands || []).map((b: any) => ({ brand: b.brand, category: b.category })),
        };
      }
      if (brands.length > 1) {
        return {
          status: 'ambiguous',
          message: `Hay varias marcas que coinciden en ${supplier.name}. Volvé a llamar la herramienta indicando la categoría exacta (campo "category") de una de estas opciones.`,
          candidates: brands.map((b) => ({ brand: b.brand, category: b.category })),
        };
      }
      brand = brands[0];
    }

    const items = extractItems(
      sheet.grid,
      args.header_row ?? null,
      {
        column_medida: args.column_medida ?? null,
        column_codigo: args.column_codigo ?? null,
        column_descripcion: args.column_descripcion ?? null,
        column_precio: args.column_precio,
      },
      {
        startRow: args.start_row ?? null,
        endRow: args.end_row ?? null,
        columnMarca: args.column_marca ?? null,
      }
    );

    if (items.length === 0) {
      return {
        status: 'error',
        message: 'No se extrajo ningún item con precio válido. Revisá la columna de precio, la hoja, el rango de filas o la fila de encabezado.',
      };
    }


    // Si el archivo trae una hoja de ofertas/precios especiales aparte, la
    // cruzamos por código con la hoja principal para no guardar un precio
    // vencido/equivocado ni desaprovechar una oferta vigente. Regla: si para un
    // mismo código el precio de la hoja de ofertas es más bajo, lo usamos (es una
    // oferta real); si es más alto, lo ignoramos y dejamos el de la hoja
    // principal (para no pasar un precio equivocado más caro), pero lo
    // reportamos como anomalía para que se pueda confirmar con el proveedor. Los
    // códigos que solo existen en la hoja de ofertas también se guardan.
    let ofertasAplicadas = 0;
    const ofertasAnomalas: { codigo: string; precio_lista: number; precio_oferta: number }[] = [];
    let itemsSoloEnOferta = 0;

    if (args.offer_sheet_name && args.column_codigo && args.offer_column_codigo && args.offer_column_precio) {
      const offerSheet = att.sheets.find((s) => s.name === args.offer_sheet_name);
      if (offerSheet) {
        const offerItems = extractItems(offerSheet.grid, args.offer_header_row ?? null, {
          column_medida: args.offer_column_medida ?? null,
          column_codigo: args.offer_column_codigo,
          column_descripcion: args.offer_column_descripcion ?? null,
          column_precio: args.offer_column_precio,
        });

        const offerByCodigo = new Map<string, ExtractedItem>();
        for (const oi of offerItems) {
          if (!oi.codigo) continue;
          const key = oi.codigo.trim();
          const existing = offerByCodigo.get(key);
          if (!existing || oi.precio < existing.precio) offerByCodigo.set(key, oi);
        }

        const codigosEnListaPrincipal = new Set<string>();
        for (const it of items) {
          if (!it.codigo) continue;
          const key = it.codigo.trim();
          codigosEnListaPrincipal.add(key);
          const offerItem = offerByCodigo.get(key);
          if (!offerItem) continue;
          if (offerItem.precio < it.precio) {
            ofertasAplicadas++;
            it.precio = offerItem.precio;
          } else if (offerItem.precio > it.precio) {
            ofertasAnomalas.push({ codigo: key, precio_lista: it.precio, precio_oferta: offerItem.precio });
          }
        }

        for (const [key, oi] of offerByCodigo) {
          if (!codigosEnListaPrincipal.has(key)) {
            items.push(oi);
            itemsSoloEnOferta++;
          }
        }
      }
    }

    const listName =
      sheet.name && sheet.name !== att.filename ? `${att.filename} — ${sheet.name}` : att.filename;

    // Con column_marca guardamos una lista separada por cada marca distinta que
    // aparezca en esa columna, respetando el nombre exacto tal como viene impreso.
    if (args.column_marca) {
      const grupos = new Map<string, typeof items>();
      let sinMarca = 0;
      for (const it of items) {
        const marca = (it.marca || '').trim();
        if (!marca) {
          sinMarca++;
          continue;
        }
        const arr = grupos.get(marca) || [];
        arr.push(it);
        grupos.set(marca, arr);
      }

      const { data: allBrandRows } = await sb
        .from('supplier_brands')
        .select('id, brand, category')
        .eq('supplier_id', supplier.id);
      const brandRows = (allBrandRows || []) as any[];
      const catKey = String(args.category || '').trim().toLowerCase();

      const guardadas: any[] = [];
      const noEncontradas: { brand: string; category: string; items_count: number }[] = [];

      for (const [marca, itemsMarca] of grupos) {
        const row = brandRows.find(
          (b) =>
            (b.brand || '').trim().toLowerCase() === marca.toLowerCase() &&
            (b.category || '').trim().toLowerCase() === catKey
        );
        if (!row) {
          noEncontradas.push({ brand: marca, category: args.category, items_count: itemsMarca.length });
          continue;
        }
        const res = await replacePriceListForBrand(
          sb,
          row.id,
          `${listName} — ${marca}`,
          args.vehicle_type || null,
          itemsMarca
        );
        if (res.error) return { status: 'error', message: res.error };
        guardadas.push({
          brand: row.brand,
          category: row.category,
          items_count: itemsMarca.length,
          price_list_id: res.id,
        });
      }

      return {
        status: noEncontradas.length > 0 ? 'partial' : 'ok',
        supplier_name: supplier.name,
        sheet_used: sheet.name,
        rango_filas: { start_row: args.start_row ?? null, end_row: args.end_row ?? null },
        items_totales: items.length,
        items_sin_marca_en_columna: sinMarca,
        desglose_por_marca: guardadas,
        marcas_no_encontradas: noEncontradas,
        ...(noEncontradas.length > 0
          ? {
              nota_marcas_no_encontradas:
                'Estas marcas aparecen en el archivo pero no existen todavía para este proveedor en esa categoría, así que NO se guardó nada de ellas. Creálas con create_supplier_brand usando el nombre EXACTO tal cual está impreso (no las fusiones con marcas parecidas ya existentes) y volvé a llamar esta herramienta.',
            }
          : {}),
        nota_reemplazo:
          'Cada marca guardada quedó con UNA sola lista viva: se borraron las listas anteriores de esa marca antes de insertar esta.',
      };
    }

    const saveRes = await replacePriceListForBrand(
      sb,
      brand.id,
      listName,
      args.vehicle_type || null,
      items
    );
    if (saveRes.error) return { status: 'error', message: saveRes.error };




    const { data: reglasData } = await sb
      .from('supplier_category_discounts')
      .select('supplier_id, category, brand, discount_percent_1, discount_percent_2, discount_percent_3')
      .eq('supplier_id', supplier.id);
    const reglas = (reglasData || []) as CategoryDiscount[];

    const { data: candidateBrandsData } = await sb
      .from('supplier_brands')
      .select('brand, category')
      .eq('supplier_id', supplier.id);
    const candidateBrandsList = (candidateBrandsData || []) as any[];

    const esUSD = supplier.currency === 'USD';
    const cotizacion =
      esUSD && supplier.exchange_rate != null && Number(supplier.exchange_rate) > 0
        ? Number(supplier.exchange_rate)
        : null;

    return {
      status: 'ok',
      items_count: items.length,
      supplier_name: supplier.name,
      brand: brand.brand,
      sheet_used: sheet.name,
      moneda_original: esUSD ? 'USD' : 'ARS',
      cotizacion_usada: cotizacion,
      sin_cotizacion_cargada: esUSD && cotizacion == null,
      nota: 'Si esta hoja mezcla varias marcas, el precio_final de cada búsqueda futura se calcula detectando la marca real de cada artículo por su descripción, no por la marca con la que se cargó esta lista.',
      ...(args.offer_sheet_name
        ? {
            oferta_sheet_usada: args.offer_sheet_name,
            ofertas_aplicadas: ofertasAplicadas,
            items_solo_en_oferta: itemsSoloEnOferta,
            ...(ofertasAnomalas.length > 0
              ? {
                  ofertas_anomalas: ofertasAnomalas,
                  nota_ofertas_anomalas:
                    'Para estos códigos el precio de la hoja de ofertas es MÁS ALTO que el de la hoja principal, así que se guardó el precio de la hoja principal (el más bajo). Puede ser una oferta vencida en los datos del proveedor: convendría confirmarlo con el proveedor y avisarle esto al usuario.',
                }
              : {}),
          }
        : {}),
      sample_items: items.slice(0, 3).map((it) => {
        const itemBrand = detectItemBrand(it.descripcion, brand.category, candidateBrandsList, brand.brand);
        const rule = resolveDiscountRule(reglas, supplier.id, brand.category, itemBrand);
        const precioLista = cotizacion ? it.precio * cotizacion : it.precio;
        return {
          ...it,
          marca_detectada: itemBrand,
          precio_lista: precioLista,
          moneda_original: esUSD ? 'USD' : 'ARS',
          ...(esUSD
            ? {
                precio_lista_original: it.precio,
                cotizacion_usada: cotizacion,
                sin_cotizacion_cargada: cotizacion == null,
              }
            : {}),
          precio_final: rule
            ? calculateFinalUnitCost(
                precioLista,
                Number(rule.discount_percent_1),
                rule.discount_percent_2 == null ? 0 : Number(rule.discount_percent_2),
                rule.discount_percent_3 == null ? 0 : Number(rule.discount_percent_3)
              )
            : precioLista,
          sin_descuento_configurado: !rule,
        };
      }),
    };
  }

  return { status: 'error', message: `Herramienta desconocida: ${name}` };
}

function formatRows(grid: unknown[][], from: number, to: number): string {
  const out: string[] = [];
  for (let rIdx = from; rIdx <= to && rIdx < grid.length; rIdx++) {
    const cells = ((grid[rIdx] || []) as unknown[])
      .slice(0, 12)
      .map((c, cIdx) => `${columnLetter(cIdx)}="${String(c ?? '').slice(0, 30)}"`)
      .join(' | ');
    out.push(`  fila ${rIdx}: ${cells}`);
  }
  return out.join('\n');
}

/**
 * Detecta filas "título de sección": de las primeras 12 columnas hay exactamente
 * UNA celda no vacía. Es el patrón típico de una hoja con varias marcas/categorías
 * separadas por un título en el medio de la planilla.
 */
export function detectSectionTitles(
  grid: unknown[][]
): { row: number; text: string; endsAtRow: number }[] {
  const titles: { row: number; text: string }[] = [];
  for (let i = 0; i < grid.length; i++) {
    const cells = ((grid[i] || []) as unknown[]).slice(0, 12).map((c) => String(c ?? '').trim());
    const noVacias = cells.filter((c) => c !== '');
    if (noVacias.length === 1) {
      titles.push({ row: i, text: noVacias[0] });
    }
  }
  return titles.map((t, i) => ({
    ...t,
    endsAtRow: i + 1 < titles.length ? titles[i + 1].row - 1 : grid.length - 1,
  }));
}

export function buildPreview(attachments: Attachment[]): string {
  return attachments
    .map((att, idx) => {
      const sheetsPreview = att.sheets
        .map((sheet) => {
          const secciones = detectSectionTitles(sheet.grid);
          const estructura =
            secciones.length > 0
              ? `  ESTRUCTURA DETECTADA — total de filas: ${sheet.grid.length}\n  Filas-título candidatas (posibles marcas/categorías por sección):\n${secciones
                  .map(
                    (s) =>
                      `    fila ${s.row}: "${s.text}" — la sección llega hasta la fila ${s.endsAtRow}`
                  )
                  .join('\n')}\n\n`
              : '';
          return `  HOJA "${sheet.name}" — total de filas: ${sheet.grid.length}\n${estructura}  Vista previa (primeras 20 filas):\n${formatRows(sheet.grid, 0, 19)}`;
        })
        .join('\n\n');
      return `ADJUNTO ${idx} — archivo "${att.filename}" — ${att.sheets.length} hoja(s): ${att.sheets.map((s) => s.name).join(', ')}\n\n${sheetsPreview}`;
    })
    .join('\n\n');
}

export function getSheetRowsText(
  attachments: Attachment[],
  attachmentIndex: number,
  sheetName: string,
  startRow: number,
  endRow: number
): { status: string; message?: string; sheet_name?: string; total_rows?: number; rows?: string } {
  const att = attachments[attachmentIndex];
  if (!att) return { status: 'error', message: 'attachment_index inválido' };
  const sheet = att.sheets.find((s) => s.name === sheetName);
  if (!sheet)
    return {
      status: 'error',
      message: `No encontré la hoja "${sheetName}". Hojas disponibles: ${att.sheets
        .map((s) => s.name)
        .join(', ')}`,
    };
  const from = Math.max(0, Math.floor(startRow));
  const to = Math.min(Math.floor(endRow), sheet.grid.length - 1);
  if (to < from) return { status: 'error', message: 'end_row tiene que ser mayor o igual a start_row' };
  if (to - from + 1 > 300)
    return {
      status: 'error',
      message: 'El rango pedido supera las 300 filas. Acotalo y pedí de a tramos más chicos.',
    };
  return {
    status: 'ok',
    sheet_name: sheet.name,
    total_rows: sheet.grid.length,
    rows: formatRows(sheet.grid, from, to),
  };
}

