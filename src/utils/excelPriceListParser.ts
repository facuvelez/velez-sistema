import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, any>[];
}

async function readWorkbook(file: File) {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}

export async function listSheetNames(file: File): Promise<string[]> {
  const workbook = await readWorkbook(file);
  return workbook.SheetNames;
}

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

export async function getRawGrid(file: File, sheetName?: string): Promise<any[][]> {
  const workbook = await readWorkbook(file);
  const name = sheetName && workbook.Sheets[sheetName] ? sheetName : workbook.SheetNames[0];
  const sheet = workbook.Sheets[name];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
}

export async function parseExcelFile(file: File, headerRow = 0): Promise<ParsedSheet> {
  const raw = await getRawGrid(file);
  const headers = (raw[headerRow] || []).map((h: any) => String(h ?? '').trim());
  const rows = raw
    .slice(headerRow + 1)
    .filter((r) => r.some((cell: any) => String(cell ?? '').trim() !== ''))
    .map((r) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        obj[h] = r[i];
      });
      return obj;
    });
  return { headers, rows };
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

const cellAt = (row: any[], letter: string | null): string | null => {
  if (!letter) return null;
  const v = row[letterToIndex(letter)];
  const s = String(v ?? '').trim();
  return s || null;
};

export function extractItems(
  rawGrid: any[][],
  headerRow: number | null,
  mapping: ColumnMapping
): ExtractedItem[] {
  const dataStartRow = headerRow === null ? 0 : headerRow + 1;
  const out: ExtractedItem[] = [];
  for (let i = dataStartRow; i < rawGrid.length; i++) {
    const row = rawGrid[i] || [];
    if (!row.some((cell: any) => String(cell ?? '').trim() !== '')) continue;
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
    });
  }
  return out;
}
