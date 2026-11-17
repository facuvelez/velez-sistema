export const SUPPLIER_CATEGORIES = [
  'Bulones',
  'Cámaras',
  'Cemento',
  'Contrapesos',
  'Llantas',
  'Neumáticos',
  'Parches',
  'Pasta',
  'Protectores',
  'Repuestos tren delantero',
  'Válvulas',
] as const;

export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];

export const CATEGORIA_TODOS_LOS_ARTICULOS = 'Todos los artículos';

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function clasificarCategoria(categoria: string): string {
  const n = normalize(categoria);
  if (n === normalize(CATEGORIA_TODOS_LOS_ARTICULOS)) return CATEGORIA_TODOS_LOS_ARTICULOS;
  if (n.includes('camara')) return 'Cámaras';
  if (n.includes('protector')) return 'Protectores';
  if (n.includes('llanta')) return 'Llantas';
  if (n.includes('valvula')) return 'Válvulas';
  if (n.includes('bulon')) return 'Bulones';
  if (n.includes('parche')) return 'Parches';
  if (n.includes('cemento')) return 'Cemento';
  if (n.includes('pasta')) return 'Pasta';
  if (n.includes('contrapeso')) return 'Contrapesos';
  if (n.includes('tren delantero')) return 'Repuestos tren delantero';
  return 'Neumáticos';
}
