/** Atributos específicos de la categoría "Neumáticos". */
export const CATEGORIA_NEUMATICOS = 'Neumáticos';

export const SUBCATEGORIAS_NEUMATICOS = [
  'Auto y Camioneta',
  'Camión',
  'Vial / Industrial / Agrícola',
  'Moto',
  'Cuatriciclo',
  'Bici',
] as const;

export const ORIGENES = ['Nacional', 'Importado'] as const;

export const CONSTRUCCIONES = ['Radial', 'Común'] as const;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const esNeumaticos = (categoria?: string | null) =>
  !!categoria && normalize(categoria) === normalize(CATEGORIA_NEUMATICOS);
