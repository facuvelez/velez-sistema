function extractSizeToken(raw: string): string {
  // Incluye rR: la notación radial ("900R20", "205/55R16") es parte de la
  // medida; sin la R el token se cortaba y se perdían dígitos.
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
