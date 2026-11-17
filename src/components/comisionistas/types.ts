export type Sentido = 'ambos' | 'envio' | 'retiro';

export interface Parada {
  nombre: string;
  lat: number;
  lng: number;
}

export interface Comisionista {
  id: string;
  nombre: string;
  telefono: string | null;
  localidad_base: string | null;
  color: string;
  notas: string | null;
  activo: boolean;
}

export interface Recorrido {
  id: string;
  comisionista_id: string;
  nombre: string;
  dias: number[];
  horario: string | null;
  costo_aprox: number | null;
  costo_nota: string | null;
  sentido: Sentido;
  paradas: Parada[];
  geometria: [number, number][];
  notas: string | null;
  activo: boolean;
}

export const BERROTARAN: Parada = { nombre: 'Berrotarán', lat: -32.45143, lng: -64.39141 };

// 0 = domingo ... 6 = sábado (igual que Date.getDay())
export const DIAS = [
  { n: 1, corto: 'L', largo: 'lunes' },
  { n: 2, corto: 'M', largo: 'martes' },
  { n: 3, corto: 'X', largo: 'miércoles' },
  { n: 4, corto: 'J', largo: 'jueves' },
  { n: 5, corto: 'V', largo: 'viernes' },
  { n: 6, corto: 'S', largo: 'sábado' },
  { n: 0, corto: 'D', largo: 'domingo' },
];

export const SENTIDO_LABEL: Record<Sentido, string> = {
  ambos: 'Lleva y trae',
  envio: 'Solo lleva (envíos)',
  retiro: 'Solo trae (retiros)',
};

export const COLORES = ['#2563eb', '#dc2626', '#ea580c', '#16a34a', '#7c3aed', '#0891b2', '#db2777', '#ca8a04', '#4b5563'];
