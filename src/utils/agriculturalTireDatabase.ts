export interface AgriculturalTireModel {
  marca: string;
  modelo: string;
  codigo: string;           // R-1, R-1W, R-2, R-3, R-4, F-2, F-3, I-1, I-3, HF-1, HF-2, LS-2, G-1
  estructura: 'Radial' | 'Diagonal' | 'Convencional';
  aplicacion: string;       // descripción del uso
  velocidadMax: number;     // km/h
  medidas: AgriculturalTireMeasure[];
}

export interface AgriculturalTireMeasure {
  medida: string;
  pr?: number;              // Ply Rating (diagonal)
  li?: number;              // Load Index (radial)
  liDual?: number;          // Load Index montaje dual
  velocidad?: string;       // código de velocidad ej: 'A8', 'B', 'D'
  cargaMax: number;         // kg
  profSurco?: number;       // mm
  anchoSeccion?: number;    // mm
  diametroExterno?: number; // mm
  camara: 'TL' | 'TT' | 'TL/TT';
}

export const AGRICULTURAL_TIRE_DB: AgriculturalTireModel[] = [

  // ==================== GOODYEAR ====================

  // R-1 Convencional
  {
    marca: 'Goodyear', modelo: 'Dyna Torque II', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción en suelos duros y consistentes. Soja, maíz, trigo, girasol.',
    velocidadMax: 32,
    medidas: [
      { medida: '14.9-24', pr: 6, cargaMax: 1510, camara: 'TL/TT' },
      { medida: '16.9-24', pr: 8, cargaMax: 2040, camara: 'TL/TT' },
      { medida: '18.4-24', pr: 8, cargaMax: 2645, camara: 'TL/TT' },
      { medida: '14.9-28', pr: 6, cargaMax: 1615, camara: 'TL/TT' },
      { medida: '16.9-28', pr: 8, cargaMax: 2180, camara: 'TL/TT' },
      { medida: '18.4-28', pr: 10, cargaMax: 2385, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 8, cargaMax: 2420, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 10, cargaMax: 3460, camara: 'TL/TT' },
      { medida: '16.9-34', pr: 6, cargaMax: 2015, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 8, cargaMax: 2565, camara: 'TL/TT' },
      { medida: '15.5-38', pr: 6, cargaMax: 1765, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 10, cargaMax: 3165, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 10, cargaMax: 3480, camara: 'TL/TT' },
      { medida: '24.5-32', pr: 10, cargaMax: 3950, camara: 'TL/TT' },
      { medida: '30.5-32', pr: 12, cargaMax: 3845, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Dyna Torque III', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción en suelos duros y consistentes. Plantaciones de soja, maíz, trigo, girasol.',
    velocidadMax: 32,
    medidas: [
      { medida: '14.9-24', pr: 8, cargaMax: 1760, camara: 'TL/TT' },
      { medida: '16.9-24', pr: 8, cargaMax: 2040, camara: 'TL/TT' },
      { medida: '18.4-24', pr: 10, cargaMax: 3250, camara: 'TL/TT' },
      { medida: '14.9-28', pr: 8, cargaMax: 1880, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 10, cargaMax: 2815, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 12, cargaMax: 3845, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 2990, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 12, cargaMax: 3575, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 12, cargaMax: 4000, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Power Torque', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción en suelos duros. Alta resistencia a cortes y picotamientos.',
    velocidadMax: 32,
    medidas: [
      { medida: '14.9-24', pr: 8, cargaMax: 1760, camara: 'TL/TT' },
      { medida: '16.9-24', pr: 8, cargaMax: 2040, camara: 'TL/TT' },
      { medida: '18.4-24', pr: 10, cargaMax: 3250, camara: 'TL/TT' },
      { medida: '16.9-28', pr: 8, cargaMax: 2180, camara: 'TL/TT' },
      { medida: '18.4-28', pr: 10, cargaMax: 2385, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 10, cargaMax: 2815, camara: 'TL/TT' },
      { medida: '16.9-34', pr: 8, cargaMax: 2250, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 2990, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 10, cargaMax: 3165, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 12, cargaMax: 4000, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Super Tracción Segura', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción en suelos duros y consistentes.',
    velocidadMax: 32,
    medidas: [
      { medida: '14.9-24', pr: 8, cargaMax: 1760, camara: 'TL/TT' },
      { medida: '16.9-24', pr: 8, cargaMax: 2040, camara: 'TL/TT' },
      { medida: '18.4-24', pr: 10, cargaMax: 3250, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 10, cargaMax: 3460, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 10, cargaMax: 2815, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 12, cargaMax: 3845, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 2990, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 10, cargaMax: 3165, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 12, cargaMax: 4000, camara: 'TL/TT' },
      { medida: '24.5-32', pr: 12, cargaMax: 4390, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Super Cuarteadora', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción en suelos duros y consistentes. Plantaciones en general.',
    velocidadMax: 32,
    medidas: [
      { medida: '18.4-26', pr: 10, cargaMax: 2645, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 10, cargaMax: 3460, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 10, cargaMax: 2815, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 12, cargaMax: 3845, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 2990, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 10, cargaMax: 3165, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 12, cargaMax: 4000, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Super Lameiro', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción en suelos húmedos. Excelente autolimpieza.',
    velocidadMax: 32,
    medidas: [
      { medida: '18.4-30', pr: 10, cargaMax: 2815, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 12, cargaMax: 3845, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 2990, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 10, cargaMax: 3165, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 12, cargaMax: 4000, camara: 'TL/TT' },
    ]
  },

  // R-1W Radial Goodyear
  {
    marca: 'Goodyear', modelo: 'Super Traction Radial / DT800', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'Tracción extra en suelos húmedos e irrigados. Baja compactación. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '320/85R24', li: 122, velocidad: 'A8', cargaMax: 1500, camara: 'TL' },
      { medida: '380/85R24', li: 131, velocidad: 'A8', cargaMax: 1950, camara: 'TL' },
      { medida: '420/85R24', li: 131, velocidad: 'A8', cargaMax: 1950, camara: 'TL' },
      { medida: '460/85R34', li: 147, velocidad: 'A8', cargaMax: 3075, camara: 'TL' },
      { medida: '520/85R38', li: 155, velocidad: 'A8', cargaMax: 3875, camara: 'TL' },
      { medida: '620/75R30', li: 163, velocidad: 'A8', cargaMax: 5000, camara: 'TL' },
      { medida: '710/70R38', li: 166, velocidad: 'A8', cargaMax: 5300, camara: 'TL' },
      { medida: '800/65R32', li: 172, velocidad: 'A8', cargaMax: 6300, camara: 'TL' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Optitrac DT824', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'R-1W radial. Tracción extra en suelos húmedos. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '320/85R24', li: 122, velocidad: 'A8', cargaMax: 1500, camara: 'TL' },
      { medida: '380/85R24', li: 131, velocidad: 'A8', cargaMax: 1950, camara: 'TL' },
      { medida: '480/70R34', li: 143, velocidad: 'A8', cargaMax: 2725, camara: 'TL' },
      { medida: '520/70R38', li: 150, velocidad: 'A8', cargaMax: 3350, camara: 'TL' },
      { medida: '650/75R32', li: 163, velocidad: 'A8', cargaMax: 5000, camara: 'TL' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Optitrac DT830', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'R-1W radial premium. Máxima tracción en suelos húmedos. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '480/70R34', li: 143, velocidad: 'A8', cargaMax: 2725, camara: 'TL' },
      { medida: '520/70R34', li: 148, velocidad: 'A8', cargaMax: 3150, camara: 'TL' },
      { medida: '620/70R42', li: 163, velocidad: 'A8', cargaMax: 5000, camara: 'TL' },
      { medida: '650/75R32', li: 163, velocidad: 'A8', cargaMax: 5000, camara: 'TL' },
      { medida: '710/70R42', li: 172, velocidad: 'A8', cargaMax: 6300, camara: 'TL' },
      { medida: '800/65R32', li: 172, velocidad: 'A8', cargaMax: 6300, camara: 'TL' },
    ]
  },

  // R-2 Goodyear
  {
    marca: 'Goodyear', modelo: 'Super Arrozeiro', codigo: 'R-2', estructura: 'Convencional',
    aplicacion: 'Servicios agrícolas en suelos anegados e inconsistentes. Plantaciones de arroz.',
    velocidadMax: 8,
    medidas: [
      { medida: '18.4-26', pr: 6, cargaMax: 2430, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 8, cargaMax: 3250, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 6, cargaMax: 2430, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 8, cargaMax: 2850, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 10, cargaMax: 3250, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Special Sure Grip', codigo: 'R-2', estructura: 'Convencional',
    aplicacion: 'Suelos anegados, arroz. Tracción extra profunda.',
    velocidadMax: 8,
    medidas: [
      { medida: '14.9-24', pr: 6, cargaMax: 1510, camara: 'TL/TT' },
      { medida: '18.4-26', pr: 8, cargaMax: 2645, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 10, cargaMax: 3460, camara: 'TL/TT' },
    ]
  },

  // R-3 Goodyear
  {
    marca: 'Goodyear', modelo: 'All Weather', codigo: 'R-3', estructura: 'Convencional',
    aplicacion: 'Servicios agrícolas en general e industriales livianos. Taco poco profundo.',
    velocidadMax: 32,
    medidas: [
      { medida: '16.9-24', pr: 10, cargaMax: 2230, camara: 'TL/TT' },
      { medida: '18.4-26', pr: 12, cargaMax: 2985, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 10, cargaMax: 3460, camara: 'TL/TT' },
      { medida: '24.5-32', pr: 12, cargaMax: 4390, camara: 'TL' },
      { medida: '560/800-26', pr: 18, cargaMax: 5800, camara: 'TL' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Industrial Sure Grip', codigo: 'R-3', estructura: 'Convencional',
    aplicacion: 'Servicios agrícolas e industriales livianos.',
    velocidadMax: 32,
    medidas: [
      { medida: '16.9-24', pr: 8, cargaMax: 2040, camara: 'TL/TT' },
      { medida: '18.4-26', pr: 10, cargaMax: 2645, camara: 'TL/TT' },
    ]
  },

  // F-2 Goodyear
  {
    marca: 'Goodyear', modelo: 'Dyna Rib', codigo: 'F-2', estructura: 'Convencional',
    aplicacion: 'Rueda delantera de tractor. Dirección en campo y ruta.',
    velocidadMax: 32,
    medidas: [
      { medida: '5.50-16', pr: 4, cargaMax: 360, camara: 'TL/TT' },
      { medida: '6.00-16', pr: 4, cargaMax: 425, camara: 'TL/TT' },
      { medida: '6.50-16', pr: 4, cargaMax: 500, camara: 'TL/TT' },
      { medida: '7.50-16', pr: 6, cargaMax: 675, camara: 'TL/TT' },
      { medida: '7.50-18', pr: 6, cargaMax: 735, camara: 'TL/TT' },
      { medida: '9.00-16', pr: 8, cargaMax: 875, camara: 'TL/TT' },
      { medida: '10.00-16', pr: 8, cargaMax: 945, camara: 'TL/TT' },
      { medida: '11.00-16', pr: 10, cargaMax: 1180, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Super Guía / Triple Rayado', codigo: 'F-2', estructura: 'Convencional',
    aplicacion: 'Rueda delantera. 2 o 3 guías. Tracción delantera FWD.',
    velocidadMax: 32,
    medidas: [
      { medida: '7.50-16', pr: 6, cargaMax: 675, camara: 'TL/TT' },
      { medida: '7.50-18', pr: 6, cargaMax: 735, camara: 'TL/TT' },
      { medida: '11.00-16', pr: 10, cargaMax: 1180, camara: 'TL/TT' },
      { medida: '12.4-24', pr: 12, cargaMax: 2130, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Rib Tractor', codigo: 'F-2', estructura: 'Convencional',
    aplicacion: 'Rueda delantera tractor. Nervio central para dirección.',
    velocidadMax: 32,
    medidas: [
      { medida: '6.00-16', pr: 4, cargaMax: 425, camara: 'TL/TT' },
      { medida: '7.50-16', pr: 6, cargaMax: 675, camara: 'TL/TT' },
      { medida: '9.00-16', pr: 8, cargaMax: 875, camara: 'TL/TT' },
    ]
  },

  // F-3 Goodyear
  {
    marca: 'Goodyear', modelo: 'Papaleguas G8', codigo: 'F-3', estructura: 'Convencional',
    aplicacion: 'Ejes libres e implementos. Banda multirayada.',
    velocidadMax: 32,
    medidas: [
      { medida: '5.00-15', pr: 4, cargaMax: 360, camara: 'TL/TT' },
      { medida: '6.00-16', pr: 4, cargaMax: 425, camara: 'TL/TT' },
      { medida: '7.50-16', pr: 8, cargaMax: 870, camara: 'TL/TT' },
      { medida: '9.00-16', pr: 10, cargaMax: 1250, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Laborer', codigo: 'F-3', estructura: 'Convencional',
    aplicacion: 'Implementos agroindustriales. Superficie plana con ranuras.',
    velocidadMax: 32,
    medidas: [
      { medida: '7.50-16', pr: 8, cargaMax: 870, camara: 'TL/TT' },
      { medida: '9.00-16', pr: 10, cargaMax: 1250, camara: 'TL/TT' },
      { medida: '11.00-16', pr: 12, cargaMax: 1700, camara: 'TL/TT' },
    ]
  },

  // I-1 Goodyear
  {
    marca: 'Goodyear', modelo: 'Rayado Máquina Agrícola', codigo: 'I-1', estructura: 'Convencional',
    aplicacion: 'Implementos y maquinaria agrícola. Eje libre. Diseño liso/rayado.',
    velocidadMax: 40,
    medidas: [
      { medida: '7.50-16', pr: 8, cargaMax: 870, camara: 'TL/TT' },
      { medida: '10.0/75-15.3', pr: 10, cargaMax: 1500, camara: 'TL' },
      { medida: '12.5/80-15.3', pr: 12, cargaMax: 2000, camara: 'TL' },
    ]
  },
  {
    marca: 'Goodyear', modelo: 'Super Flotation / Farm Utility / Highway', codigo: 'I-1', estructura: 'Convencional',
    aplicacion: 'Implementos y remolques en campo y ruta. Alta capacidad de carga.',
    velocidadMax: 40,
    medidas: [
      { medida: '10.0/75-15.3', pr: 10, cargaMax: 1500, camara: 'TL' },
      { medida: '12.5/80-15.3', pr: 14, cargaMax: 2650, camara: 'TL' },
      { medida: '400/60-15.5', pr: 14, cargaMax: 2900, camara: 'TL' },
    ]
  },

  // I-3 Goodyear
  {
    marca: 'Goodyear', modelo: 'All Service / Superflot / IT525', codigo: 'I-3', estructura: 'Convencional',
    aplicacion: 'Implementos y maquinaria agrícola e industrial. Taco poco profundo.',
    velocidadMax: 40,
    medidas: [
      { medida: '18.4R42', pr: 10, cargaMax: 3550, camara: 'TL' },
      { medida: '500/60-22.5', pr: 16, cargaMax: 4370, camara: 'TL' },
      { medida: '600/60-22.5', pr: 16, cargaMax: 5150, camara: 'TL' },
      { medida: '21.5L-24', li: 148, velocidad: 'A8', cargaMax: 3150, camara: 'TL' },
    ]
  },

  // HF Goodyear
  {
    marca: 'Goodyear', modelo: 'Super Terra Grip', codigo: 'HF', estructura: 'Convencional',
    aplicacion: 'Alta flotación. Neumáticos de alta flotación para suelos blandos.',
    velocidadMax: 40,
    medidas: [
      { medida: '400/60-15.5', pr: 16, cargaMax: 3000, camara: 'TL' },
      { medida: '500/60-22.5', pr: 16, cargaMax: 4370, camara: 'TL' },
      { medida: '710/40-22.5', li: 154, velocidad: 'A8', cargaMax: 3750, camara: 'TL' },
    ]
  },

  // G-1 Goodyear
  {
    marca: 'Goodyear', modelo: 'DT810 / DT820', codigo: 'G-1', estructura: 'Radial',
    aplicacion: 'Microtractores y microcultivadores. Vel. máx. 16 km/h.',
    velocidadMax: 16,
    medidas: [
      { medida: '20.8R38', li: 172, velocidad: 'A8', cargaMax: 6300, camara: 'TL' },
      { medida: '28LR26', pr: 12, cargaMax: 5266, camara: 'TL' },
    ]
  },

  // LS-2 Goodyear
  {
    marca: 'Goodyear', modelo: 'Super Terra Grip / Tractocañera / Terra Rib', codigo: 'LS-2', estructura: 'Convencional',
    aplicacion: 'Servicios forestales. Tracción normal e intermedia en monte.',
    velocidadMax: 30,
    medidas: [
      { medida: '18.4-26', pr: 10, cargaMax: 3609, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 14, cargaMax: 5766, camara: 'TL' },
      { medida: '28L-26', pr: 12, cargaMax: 5266, camara: 'TL' },
      { medida: '30.5-32', pr: 16, cargaMax: 7446, camara: 'TL' },
    ]
  },

  // ==================== PIRELLI ====================

  {
    marca: 'Pirelli', modelo: 'TM75', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Todos los cultivos en suelos consistentes. Barras largas y simétricas.',
    velocidadMax: 32,
    medidas: [
      { medida: '250/80-18', pr: 12, cargaMax: 1430, profSurco: 32, camara: 'TL' },
      { medida: '14.9-24', pr: 6, cargaMax: 1510, profSurco: 38, camara: 'TT' },
      { medida: '12.4-28', pr: 6, cargaMax: 1275, profSurco: 36, camara: 'TT' },
      { medida: '14.9-28', pr: 6, cargaMax: 1615, profSurco: 38, camara: 'TT' },
      { medida: '12.4-36', pr: 6, cargaMax: 1930, profSurco: 36, camara: 'TT' },
      { medida: '12.4-36 TL', pr: 10, cargaMax: 1930, profSurco: 36, camara: 'TL' },
      { medida: '12.4-38', pr: 6, cargaMax: 1480, profSurco: 36, camara: 'TT' },
      { medida: '13.6-38', pr: 6, cargaMax: 1660, profSurco: 37, camara: 'TT' },
      { medida: '9.5-24', pr: 6, cargaMax: 940, profSurco: 33, camara: 'TT' },
      { medida: '12.4-24', pr: 6, cargaMax: 1200, profSurco: 36, camara: 'TT' },
      { medida: '14.9-24 TL', pr: 8, cargaMax: 1760, profSurco: 38, camara: 'TL' },
      { medida: '16.9-24', pr: 8, cargaMax: 2040, profSurco: 39, camara: 'TT' },
      { medida: '14.9-26', pr: 8, cargaMax: 1820, profSurco: 38, camara: 'TT' },
      { medida: '18.4-26', pr: 10, cargaMax: 2645, profSurco: 40, camara: 'TT' },
      { medida: '12.4-28', pr: 6, cargaMax: 1275, profSurco: 36, camara: 'TT' },
      { medida: '14.9-28', pr: 6, cargaMax: 1615, profSurco: 38, camara: 'TT' },
      { medida: '16.9-28', pr: 8, cargaMax: 2180, profSurco: 39, camara: 'TT' },
      { medida: '16.9-30', pr: 8, cargaMax: 2245, profSurco: 39, camara: 'TT' },
      { medida: '18.4-30', pr: 8, cargaMax: 2420, profSurco: 40, camara: 'TT' },
      { medida: '18.4-30 TL', pr: 8, cargaMax: 2420, profSurco: 40, camara: 'TL' },
      { medida: '23.1-30', pr: 10, cargaMax: 3460, profSurco: 43, camara: 'TT' },
      { medida: '24.5-32', pr: 10, cargaMax: 3950, profSurco: 44, camara: 'TT' },
      { medida: '24.5-32 TL', pr: 14, cargaMax: 4800, profSurco: 44, camara: 'TL' },
      { medida: '16.9-34', pr: 6, cargaMax: 2015, profSurco: 39, camara: 'TT' },
      { medida: '18.4-34', pr: 8, cargaMax: 2565, profSurco: 40, camara: 'TT' },
      { medida: '15.5-38', pr: 6, cargaMax: 1765, profSurco: 37, camara: 'TT' },
      { medida: '18.4-38', pr: 10, cargaMax: 3165, profSurco: 40, camara: 'TT' },
      { medida: '20.8-38', pr: 10, cargaMax: 3480, profSurco: 42, camara: 'TT' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'TM95', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción en todos los cultivos en suelos consistentes. Barras alternadas largas y cortas.',
    velocidadMax: 32,
    medidas: [
      { medida: '18.4-34', pr: 10, cargaMax: 2990, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 12, cargaMax: 3575, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 12, cargaMax: 4000, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'MB39', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Cosechadoras en suelos consistentes. Compuestos especiales resistentes a cortes.',
    velocidadMax: 8,
    medidas: [
      { medida: '23.1-26 TL', pr: 14, cargaMax: 6660, profSurco: 41, camara: 'TL' },
      { medida: '28.1-26', pr: 12, cargaMax: 7100, profSurco: 41, camara: 'TT' },
      { medida: '21L-26 TL', pr: 14, cargaMax: 5560, profSurco: 39, camara: 'TL' },
      { medida: '30.5-32 TL', pr: 12, cargaMax: 7350, profSurco: 47, camara: 'TL' },
      { medida: '35.5L-32 TL', pr: 16, cargaMax: 9350, profSurco: 47, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'PHP Green Performance', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'Tractores, cosechadoras y pulverizadores. R-1W radial. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '710/70R38', li: 166, velocidad: 'A8', cargaMax: 5300, profSurco: 62, camara: 'TL' },
      { medida: '710/70R38', li: 171, velocidad: 'A8', cargaMax: 6150, profSurco: 62, camara: 'TL' },
      { medida: '520/85R42', li: 157, velocidad: 'A8', cargaMax: 4125, profSurco: 56, camara: 'TL' },
      { medida: '420/85R28', li: 139, velocidad: 'A8', cargaMax: 2430, profSurco: 51, camara: 'TL' },
      { medida: '520/85R38', li: 155, velocidad: 'A8', cargaMax: 3875, profSurco: 56, camara: 'TL' },
      { medida: '420/85R30', li: 140, velocidad: 'A8', cargaMax: 2500, profSurco: 51, camara: 'TL' },
      { medida: '800/65R32', li: 172, velocidad: 'A8', cargaMax: 6300, profSurco: 57, camara: 'TL' },
      { medida: '480/70R34', li: 155, velocidad: 'A8', cargaMax: 3875, profSurco: 48, camara: 'TL' },
      { medida: '710/70R42', li: 173, velocidad: 'A8', cargaMax: 6500, profSurco: 62, camara: 'TL' },
      { medida: '600/70R30', li: 158, velocidad: 'A8', cargaMax: 4250, profSurco: 56, camara: 'TL' },
      { medida: '600/65R28', li: 147, velocidad: 'A8', cargaMax: 3075, profSurco: 52, camara: 'TL' },
      { medida: '600/65R28', li: 154, velocidad: 'A8', cargaMax: 3750, profSurco: 52, camara: 'TL' },
      { medida: '800/70R38', li: 173, velocidad: 'A8', cargaMax: 6500, profSurco: 61, camara: 'TL' },
      // Pulverizador
      { medida: '380/90R46', li: 157, velocidad: 'A8', cargaMax: 4125, profSurco: 46, camara: 'TL' },
      { medida: '320/90R46', li: 157, velocidad: 'A8', cargaMax: 4125, profSurco: 44, camara: 'TL' },
      { medida: '380/80R38', li: 142, velocidad: 'A8', cargaMax: 2650, profSurco: 46, camara: 'TL' },
      // Cosechadora
      { medida: '900/60R32', li: 176, velocidad: 'A8', cargaMax: 10650, profSurco: 58, camara: 'TL' },
      { medida: '800/65R32', li: 172, velocidad: 'A8', cargaMax: 9500, profSurco: 57, camara: 'TL' },
      { medida: '520/85R42', li: 157, velocidad: 'A8', cargaMax: 6150, profSurco: 56, camara: 'TL' },
      { medida: '520/85R38', li: 155, velocidad: 'A8', cargaMax: 5810, profSurco: 56, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'PD22', codigo: 'R-2', estructura: 'Convencional',
    aplicacion: 'Cultivos inundados. Elevada profundidad de barras. Vel. máx. 32 km/h.',
    velocidadMax: 32,
    medidas: [
      { medida: '14.9-24', pr: 6, cargaMax: 1510, profSurco: 73, camara: 'TT' },
      { medida: '18.4-24', pr: 8, cargaMax: 2645, profSurco: 81, camara: 'TT' },
      { medida: '23.1-26', pr: 10, cargaMax: 3615, profSurco: 89, camara: 'TT' },
      { medida: '14.9-28', pr: 6, cargaMax: 1615, profSurco: 81, camara: 'TT' },
      { medida: '18.4-30', pr: 8, cargaMax: 2420, profSurco: 81, camara: 'TT' },
      { medida: '23.1-30', pr: 8, cargaMax: 2565, profSurco: 81, camara: 'TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 3450, profSurco: 85, camara: 'TT' },
      { medida: '20.8-38', pr: 10, cargaMax: 3480, profSurco: 85, camara: 'TT' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'PD22 Special Lug', codigo: 'R-2', estructura: 'Convencional',
    aplicacion: 'Cultivos inundados de suelo mixto. Refuerzo central y mayor profundidad de barras.',
    velocidadMax: 32,
    medidas: [
      { medida: '14.9-24', pr: 6, cargaMax: 1510, profSurco: 73, camara: 'TT' },
      { medida: '14.9-28', pr: 6, cargaMax: 1615, profSurco: 73, camara: 'TT' },
      { medida: '18.4-28', pr: 8, cargaMax: 1880, profSurco: 81, camara: 'TT' },
      { medida: '23.1-26', pr: 8, cargaMax: 2420, profSurco: 81, camara: 'TT' },
      { medida: '18.4-30', pr: 8, cargaMax: 2420, profSurco: 81, camara: 'TT' },
      { medida: '23.1-30', pr: 10, cargaMax: 3460, profSurco: 89, camara: 'TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 3450, profSurco: 81, camara: 'TT' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'TM85', codigo: 'R-3', estructura: 'Convencional',
    aplicacion: 'Compactadoras e implementos agrícolas. Diseño diamante. Vel. máx. 8 km/h.',
    velocidadMax: 8,
    medidas: [
      { medida: '23.1-26 TL', pr: 12, cargaMax: 6100, profSurco: 25, camara: 'TL' },
      { medida: '23.1-30 TL', pr: 12, cargaMax: 6450, profSurco: 28, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'PN12', codigo: 'R-4', estructura: 'Convencional',
    aplicacion: 'Tractores industriales, nivelación y carga. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '12.5/80-18 TL', pr: 10, cargaMax: 2220, profSurco: 26, camara: 'TL' },
      { medida: '19.5L-24 TL', pr: 10, cargaMax: 3080, profSurco: 31, camara: 'TL' },
      { medida: '16.9-24 TL', pr: 12, cargaMax: 3450, profSurco: 31, camara: 'TL' },
      { medida: '500/45-22.5 TL', pr: 16, cargaMax: 4495, profSurco: 32, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'TG22', codigo: 'G-1', estructura: 'Convencional',
    aplicacion: 'Microtractores y microcultivadores. Vel. máx. 16 km/h.',
    velocidadMax: 16,
    medidas: [
      { medida: '6-12', pr: 4, cargaMax: 225, profSurco: 19, camara: 'TT' },
      { medida: '6-12', pr: 6, cargaMax: 310, profSurco: 19, camara: 'TT' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'TD500', codigo: 'F-2', estructura: 'Convencional',
    aplicacion: 'Ruedas de dirección en tractores y cosechadoras. Raya central elevada. Vel. máx. 32 km/h.',
    velocidadMax: 32,
    medidas: [
      { medida: '6.00-16', pr: 6, cargaMax: 570, profSurco: 15, anchoSeccion: 169, camara: 'TT' },
      { medida: '7.50-16', pr: 6, cargaMax: 870, profSurco: 19, anchoSeccion: 210, camara: 'TT' },
      { medida: '7.50-18', pr: 8, cargaMax: 980, profSurco: 21, anchoSeccion: 242, camara: 'TT' },
      { medida: '9.00-16', pr: 8, cargaMax: 1250, profSurco: 24, anchoSeccion: 283, camara: 'TT' },
      { medida: '10.00-16', pr: 8, cargaMax: 1420, profSurco: 24, anchoSeccion: 323, camara: 'TT' },
      { medida: '11.00-16', pr: 8, cargaMax: 1325, profSurco: 26, anchoSeccion: 323, camara: 'TT' },
      { medida: '11.00-16 TL', pr: 10, cargaMax: 1420, profSurco: 26, camara: 'TL' },
      { medida: '7.50-20', pr: 8, cargaMax: 945, profSurco: 19, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'CT65', codigo: 'F-3', estructura: 'Convencional',
    aplicacion: 'Ejes libres de implementos y máquinas agrícolas en suelos compactados. Vel. máx. 32 km/h.',
    velocidadMax: 32,
    medidas: [
      { medida: '7.50-18 TL', pr: 8, cargaMax: 945, profSurco: 11, camara: 'TL' },
      { medida: '7.50-18 TL', pr: 10, cargaMax: 1065, profSurco: 11, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'CT85', codigo: 'F-3', estructura: 'Convencional',
    aplicacion: 'Ejes libres de implementos y máquinas agrícolas. Perfil variable. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '11L-16', pr: 12, cargaMax: 1250, profSurco: 14, anchoSeccion: 285, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'RA28', codigo: 'I-1', estructura: 'Convencional',
    aplicacion: 'Ejes libres de implementos y máquinas agrícolas. Diseño liso. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '10.5/65-16', pr: 8, cargaMax: 1360, profSurco: 11, camara: 'TL' },
      { medida: '400/60-15.5 TL', pr: 10, cargaMax: 1550, profSurco: 11, camara: 'TL' },
      { medida: '400/60-15.5 TL', pr: 8, cargaMax: 3110, profSurco: 12, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'RA45', codigo: 'I-1', estructura: 'Convencional',
    aplicacion: 'Ejes libres de implementos. 4 rayas. Alta capacidad de carga. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '11L-15', pr: 10, cargaMax: 1320, profSurco: 9, camara: 'TL' },
      { medida: '11L-15', pr: 12, cargaMax: 1450, profSurco: 9, camara: 'TL' },
      { medida: '7.50-18', pr: 6, cargaMax: 860, profSurco: 8, camara: 'TT' },
      { medida: '9.5L-15 TL', pr: 8, cargaMax: 949, profSurco: 8, camara: 'TL' },
      { medida: '12.5L-15 TL', pr: 8, cargaMax: 1121, profSurco: 8, camara: 'TL' },
      { medida: '14L-16.1 TL', pr: 12, cargaMax: 1752, profSurco: 8, camara: 'TL' },
      { medida: '16.5L-16.1 TL', pr: 14, cargaMax: 2125, profSurco: 9, camara: 'TL' },
      { medida: '10.5/80-18 TL', pr: 6, cargaMax: 880, profSurco: 8, camara: 'TL' },
      { medida: '10.5/60-18', pr: 10, cargaMax: 1798, camara: 'TL' },
    ]
  },
  {
    marca: 'Pirelli', modelo: 'HF75', codigo: 'I-3', estructura: 'Convencional',
    aplicacion: 'Alta flotación para implementos y máquinas agrícolas. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '400/60-15.5 TL', li: 132, velocidad: 'A8', cargaMax: 2000, profSurco: 17, camara: 'TL' },
      { medida: '400/55-22.5 TL', li: 145, velocidad: 'A8', cargaMax: 2900, profSurco: 17, camara: 'TL' },
      { medida: '600/50-22.5 TL', li: 153, velocidad: 'A8', cargaMax: 3600, profSurco: 20, camara: 'TL' },
      { medida: '600/45-22.5 TL', li: 156, velocidad: 'A8', cargaMax: 4000, profSurco: 20, camara: 'TL' },
      { medida: '500/45-22.5 TL', li: 154, velocidad: 'A8', cargaMax: 3750, profSurco: 17, camara: 'TL' },
      { medida: '400/55-22.5 TL', li: 140, velocidad: 'A8', cargaMax: 2500, profSurco: 17, camara: 'TL' },
      { medida: '400/50-22.5 TL', li: 142, velocidad: 'A8', cargaMax: 2650, profSurco: 14, camara: 'TL' },
    ]
  },

  // ==================== BKT ====================

  {
    marca: 'BKT', modelo: 'AGRIMAX RT855', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'Tracción radial serie 85. Alta carga, suelos duros y húmedos. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '280/85R20', li: 112, liDual: 109, velocidad: 'A8', cargaMax: 1120, camara: 'TL' },
      { medida: '320/85R20', li: 119, liDual: 116, velocidad: 'A8', cargaMax: 1360, camara: 'TL' },
      { medida: '280/85R24', li: 115, liDual: 112, velocidad: 'A8', cargaMax: 1215, camara: 'TL' },
      { medida: '320/85R24', li: 122, liDual: 119, velocidad: 'A8', cargaMax: 1500, camara: 'TL' },
      { medida: '340/85R24', li: 125, liDual: 122, velocidad: 'A8', cargaMax: 1650, camara: 'TL' },
      { medida: '380/85R24', li: 131, liDual: 128, velocidad: 'A8', cargaMax: 1950, camara: 'TL' },
      { medida: '320/85R28', li: 122, liDual: 119, velocidad: 'A8', cargaMax: 1500, camara: 'TL' },
      { medida: '340/85R28', li: 127, liDual: 124, velocidad: 'A8', cargaMax: 1750, camara: 'TL' },
      { medida: '380/85R28', li: 133, liDual: 130, velocidad: 'A8', cargaMax: 2060, camara: 'TL' },
      { medida: '420/85R28', li: 139, liDual: 136, velocidad: 'A8', cargaMax: 2360, camara: 'TL' },
      { medida: '380/85R30', li: 135, liDual: 132, velocidad: 'A8', cargaMax: 2180, camara: 'TL' },
      { medida: '420/85R34', li: 137, liDual: 134, velocidad: 'A8', cargaMax: 2300, camara: 'TL' },
      { medida: '480/80R46', li: 158, liDual: 155, velocidad: 'A8', cargaMax: 4250, camara: 'TL' },
    ]
  },
  {
    marca: 'BKT', modelo: 'AGRIMAX RT765', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'Tracción radial serie 70. Uso general campo y ruta. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '240/70R16', li: 104, liDual: 101, velocidad: 'A8', cargaMax: 900, camara: 'TL' },
      { medida: '260/70R16', li: 109, liDual: 106, velocidad: 'A8', cargaMax: 1030, camara: 'TL' },
      { medida: '280/70R16', li: 112, liDual: 109, velocidad: 'A8', cargaMax: 1120, camara: 'TL' },
      { medida: '280/70R18', li: 114, liDual: 111, velocidad: 'A8', cargaMax: 1180, camara: 'TL' },
      { medida: '280/70R20', li: 116, liDual: 113, velocidad: 'A8', cargaMax: 1250, camara: 'TL' },
      { medida: '300/70R20', li: 120, liDual: 117, velocidad: 'A8', cargaMax: 1400, camara: 'TL' },
      { medida: '320/70R20', li: 123, liDual: 120, velocidad: 'A8', cargaMax: 1550, camara: 'TL' },
      { medida: '360/70R20', li: 129, liDual: 126, velocidad: 'A8', cargaMax: 1850, camara: 'TL' },
      { medida: '380/70R20', li: 132, liDual: 129, velocidad: 'A8', cargaMax: 2000, camara: 'TL' },
      { medida: '320/70R24', li: 116, liDual: 113, velocidad: 'A8', cargaMax: 1250, camara: 'TL' },
      { medida: '360/70R24', li: 122, liDual: 119, velocidad: 'A8', cargaMax: 1500, camara: 'TL' },
      { medida: '360/70R28', li: 125, liDual: 122, velocidad: 'A8', cargaMax: 1650, camara: 'TL' },
      { medida: '380/70R28', li: 127, liDual: 124, velocidad: 'A8', cargaMax: 1750, camara: 'TL' },
      { medida: '380/70R24', li: 125, liDual: 122, velocidad: 'A8', cargaMax: 1650, camara: 'TL' },
      { medida: '420/70R24', li: 130, liDual: 127, velocidad: 'A8', cargaMax: 1900, camara: 'TL' },
      { medida: '420/70R28', li: 133, liDual: 130, velocidad: 'A8', cargaMax: 2060, camara: 'TL' },
      { medida: '420/70R30', li: 134, liDual: 131, velocidad: 'A8', cargaMax: 2120, camara: 'TL' },
      { medida: '480/70R24', li: 138, liDual: 135, velocidad: 'A8', cargaMax: 2360, camara: 'TL' },
      { medida: '480/70R34', li: 143, liDual: 140, velocidad: 'A8', cargaMax: 2725, camara: 'TL' },
      { medida: '520/70R34', li: 148, liDual: 145, velocidad: 'A8', cargaMax: 3150, camara: 'TL' },
      { medida: '380/70R20', li: 129, liDual: 126, velocidad: 'A8', cargaMax: 1850, camara: 'TL' },
      { medida: '380/70R28', li: 127, liDual: 124, velocidad: 'A8', cargaMax: 1750, camara: 'TL' },
      { medida: '380/70R24', li: 132, liDual: 129, velocidad: 'A8', cargaMax: 2000, camara: 'TL' },
      { medida: '420/70R28', li: 134, liDual: 131, velocidad: 'A8', cargaMax: 2120, camara: 'TL' },
      { medida: '420/70R30', li: 134, liDual: 131, velocidad: 'A8', cargaMax: 2120, camara: 'TL' },
      { medida: '420/70R24', li: 133, liDual: 130, velocidad: 'A8', cargaMax: 2060, camara: 'TL' },
    ]
  },
  {
    marca: 'BKT', modelo: 'AGRIMAX RT657', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'Tracción radial serie 65. Relación calidad/precio. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '480/65R28', li: 143, velocidad: 'A8', cargaMax: 2725, camara: 'TL' },
      { medida: '540/65R28', li: 149, velocidad: 'A8', cargaMax: 3250, camara: 'TL' },
      { medida: '600/65R28', li: 154, velocidad: 'A8', cargaMax: 3750, camara: 'TL' },
      { medida: '480/65R24', li: 140, velocidad: 'A8', cargaMax: 2500, camara: 'TL' },
      { medida: '540/65R24', li: 146, velocidad: 'A8', cargaMax: 3000, camara: 'TL' },
      { medida: '600/65R38', li: 158, velocidad: 'A8', cargaMax: 4250, camara: 'TL' },
      { medida: '650/65R38', li: 163, velocidad: 'A8', cargaMax: 5000, camara: 'TL' },
      { medida: '710/65R38', li: 166, velocidad: 'A8', cargaMax: 5300, camara: 'TL' },
    ]
  },
  {
    marca: 'BKT', modelo: 'AGRIMAXFORCE (IF)', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'IF Technology. Tractores alta potencia >250HP. Mínima compactación. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: 'IF710/60R34', li: 169, velocidad: 'A8', cargaMax: 5800, camara: 'TL' },
      { medida: 'IF900/60R42', li: 181, velocidad: 'A8', cargaMax: 8250, camara: 'TL' },
    ]
  },
  {
    marca: 'BKT', modelo: 'TR-135', codigo: 'R-1', estructura: 'Diagonal',
    aplicacion: 'Tracción convencional en suelos duros. Drive Wheel R-1 y R-3.',
    velocidadMax: 30,
    medidas: [
      { medida: '16.9-34', pr: 6, li: 139, cargaMax: 2430, camara: 'TL' },
      { medida: '18.4-34', pr: 8, li: 142, cargaMax: 2650, camara: 'TT' },
      { medida: '8.3-36', pr: 6, li: 107, cargaMax: 975, camara: 'TT' },
      { medida: '12.4-36', pr: 6, li: 121, cargaMax: 1450, camara: 'TT' },
      { medida: '13.6-36', pr: 6, li: 126, cargaMax: 1700, camara: 'TT' },
      { medida: '13.6-38', pr: 6, li: 126, cargaMax: 1700, camara: 'TT' },
      { medida: '15.5-38', pr: 8, li: 133, cargaMax: 2060, camara: 'TT' },
      { medida: '16.9-38', pr: 8, li: 141, cargaMax: 2575, camara: 'TT' },
      { medida: '18.4-38', pr: 10, li: 148, cargaMax: 3150, camara: 'TT' },
      { medida: '20.8-38', pr: 10, li: 153, cargaMax: 3650, camara: 'TT' },
      { medida: '24.5-32', pr: 12, li: 159, cargaMax: 4375, camara: 'TL' },
      { medida: '30.5-32', pr: 18, li: 170, cargaMax: 6000, camara: 'TL' },
    ]
  },
  {
    marca: 'BKT', modelo: 'TF-8181 / TF-9090 / Power RIB F-2', codigo: 'F-2', estructura: 'Convencional',
    aplicacion: 'Ruedas de dirección tractor. Nervios múltiples. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '4.00-12', pr: 4, cargaMax: 307, camara: 'TT' },
      { medida: '5.00-15', pr: 4, cargaMax: 655, camara: 'TT' },
      { medida: '4.50-16', pr: 4, cargaMax: 425, camara: 'TT' },
      { medida: '5.50-16', pr: 4, cargaMax: 450, camara: 'TT' },
      { medida: '6.00-16', pr: 4, cargaMax: 500, camara: 'TT' },
      { medida: '6.50-16', pr: 6, cargaMax: 600, camara: 'TT' },
      { medida: '7.50-16', pr: 6, cargaMax: 710, camara: 'TT' },
      { medida: '7.50-18', pr: 6, cargaMax: 745, camara: 'TT' },
      { medida: '9.00-16', pr: 6, cargaMax: 875, camara: 'TT' },
      { medida: '10.00-16', pr: 6, cargaMax: 1000, camara: 'TT' },
      { medida: '11.00-16', pr: 8, cargaMax: 1200, camara: 'TT' },
      { medida: '7.50-20', pr: 6, cargaMax: 875, camara: 'TT' },
      { medida: '5.50-20', pr: 6, cargaMax: 565, camara: 'TT' },
    ]
  },
  {
    marca: 'BKT', modelo: 'AW-702 / AW-909 / RIB-774 / RIB-775', codigo: 'I-1', estructura: 'Convencional',
    aplicacion: 'Implementos y remolques agrícolas. Alta carga. Campo y ruta. Vel. máx. 48 km/h.',
    velocidadMax: 48,
    medidas: [
      { medida: '7.00-12', pr: 6, li: 101, cargaMax: 825, camara: 'TL' },
      { medida: '10.0/80-12', pr: 6, li: 116, cargaMax: 1250, camara: 'TL' },
      { medida: '10.0/80-12', pr: 8, li: 122, cargaMax: 1500, camara: 'TL' },
      { medida: '300/65-12', pr: 8, li: 122, cargaMax: 1500, camara: 'TL' },
      { medida: '9.00-13', pr: 10, li: 113, cargaMax: 1150, camara: 'TL' },
      { medida: '200/60-14.5', pr: 10, li: 113, cargaMax: 1150, camara: 'TL' },
      { medida: '10.0/75-15.3', pr: 10, li: 128, cargaMax: 1800, camara: 'TL' },
      { medida: '11.5/80-15.3', pr: 12, li: 141, cargaMax: 2575, camara: 'TL' },
      { medida: '12.5/80-15.3', pr: 14, li: 145, cargaMax: 2900, camara: 'TL' },
      { medida: '400/60-15.5', pr: 14, li: 147, cargaMax: 3075, camara: 'TL' },
      { medida: '500/50-17', li: 143, velocidad: 'A8', cargaMax: 2725, camara: 'TL' },
      { medida: '215/75-17.5', pr: 16, li: 134, cargaMax: 2120, camara: 'TL' },
      { medida: '225/75-17.5', pr: 16, li: 143, cargaMax: 2725, camara: 'TL' },
      { medida: '500/50-22.5', li: 151, velocidad: 'A8', cargaMax: 3450, camara: 'TL' },
    ]
  },

  // ==================== FIRESTONE ====================

  {
    marca: 'Firestone', modelo: 'Super All Traction 23°', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción general. Barras 23°. Centro abierto autolimpiante. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '9.5-24', pr: 6, cargaMax: 850, profSurco: 32, camara: 'TL/TT' },
      { medida: '11.2-24', pr: 6, cargaMax: 1090, profSurco: 36, camara: 'TL/TT' },
      { medida: '12.4-24', pr: 6, cargaMax: 1380, profSurco: 37, camara: 'TL/TT' },
      { medida: '14.9-24', pr: 6, cargaMax: 1600, profSurco: 37, camara: 'TL/TT' },
      { medida: '16.9-24', pr: 6, cargaMax: 1615, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-24', pr: 8, cargaMax: 2130, profSurco: 37, camara: 'TL/TT' },
      { medida: '12.4-26', pr: 6, cargaMax: 1285, profSurco: 35, camara: 'TL/TT' },
      { medida: '14.9-26', pr: 8, cargaMax: 1700, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-26', pr: 8, cargaMax: 2105, profSurco: 37, camara: 'TL/TT' },
      { medida: '14.9-28', pr: 6, cargaMax: 1600, profSurco: 39, camara: 'TL/TT' },
      { medida: '16.9-28', pr: 8, cargaMax: 1800, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-28', pr: 8, cargaMax: 2130, profSurco: 37, camara: 'TL/TT' },
      { medida: '23.1-28', pr: 12, cargaMax: 3250, profSurco: 44, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 8, cargaMax: 1900, profSurco: 38, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 10, cargaMax: 2725, profSurco: 44, camara: 'TL/TT' },
      { medida: '12.4-32', pr: 6, cargaMax: 1150, profSurco: 35, camara: 'TL/TT' },
      { medida: '14.9-34', pr: 8, cargaMax: 1950, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 8, cargaMax: 2166, profSurco: 39, camara: 'TL/TT' },
      { medida: '23.1-34', pr: 10, cargaMax: 2725, profSurco: 44, camara: 'TL/TT' },
      { medida: '14.9-38', pr: 8, cargaMax: 1990, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 8, cargaMax: 2166, profSurco: 39, camara: 'TL/TT' },
      { medida: '23.1-38', pr: 10, cargaMax: 3155, profSurco: 44, camara: 'TL/TT' },
      { medida: '18.4-42', pr: 10, cargaMax: 2725, profSurco: 39, camara: 'TL/TT' },
      { medida: '20.8-42', pr: 10, cargaMax: 3155, profSurco: 39, camara: 'TL/TT' },
      { medida: '24.5-32', pr: 10, cargaMax: 3564, profSurco: 47, camara: 'TL/TT' },
      { medida: '30.5L-32', pr: 10, cargaMax: 4131, profSurco: 47, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 10, cargaMax: 2960, profSurco: 46, camara: 'TL/TT' },
      { medida: '20.8-42', pr: 14, cargaMax: 4495, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Super All Traction II 23°', codigo: 'R-1', estructura: 'Convencional',
    aplicacion: 'Tracción mejorada. Mayor número de barras por taco. Menor compactación. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '11.2-24', pr: 8, cargaMax: 1153, profSurco: 33, camara: 'TL/TT' },
      { medida: '12.4-24', pr: 8, cargaMax: 1398, profSurco: 34, camara: 'TL/TT' },
      { medida: '14.9-24', pr: 8, cargaMax: 1486, profSurco: 36, camara: 'TL/TT' },
      { medida: '16.9-24', pr: 8, cargaMax: 1552, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-24', pr: 8, cargaMax: 1664, profSurco: 37, camara: 'TL/TT' },
      { medida: '16.9-28', pr: 8, cargaMax: 1552, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-28', pr: 8, cargaMax: 1664, profSurco: 37, camara: 'TL/TT' },
      { medida: '16.9-30', pr: 8, cargaMax: 1654, profSurco: 37, camara: 'TL/TT' },
      { medida: '18.4-30', pr: 8, cargaMax: 1755, profSurco: 37, camara: 'TL/TT' },
      { medida: '23.1-30', pr: 10, cargaMax: 2306, profSurco: 44, camara: 'TL/TT' },
      { medida: '13.6-28', pr: 8, cargaMax: 1310, profSurco: 37, camara: 'TL/TT' },
      { medida: '14.9-30', pr: 8, cargaMax: 1485, profSurco: 36, camara: 'TL/TT' },
      { medida: '16.9-34', pr: 8, cargaMax: 1570, profSurco: 39, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 8, cargaMax: 1755, profSurco: 39, camara: 'TL/TT' },
      { medida: '13.6-38', pr: 8, cargaMax: 1310, profSurco: 38, camara: 'TL/TT' },
      { medida: '15.5-38', pr: 8, cargaMax: 1570, profSurco: 38, camara: 'TL/TT' },
      { medida: '18.4-38', pr: 10, cargaMax: 1900, profSurco: 38, camara: 'TL/TT' },
      { medida: '18.4-42', pr: 10, cargaMax: 1900, profSurco: 42, camara: 'TL/TT' },
      { medida: '20.8-38', pr: 10, cargaMax: 2125, profSurco: 42, camara: 'TL/TT' },
      { medida: '20.8-42', pr: 10, cargaMax: 2125, profSurco: 42, camara: 'TL/TT' },
      { medida: '18.4-34', pr: 10, cargaMax: 1900, profSurco: 39, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Radial 23°', codigo: 'R-1', estructura: 'Radial',
    aplicacion: 'Tracción radial económica. Barras 23°. Vel. máx. 48 km/h.',
    velocidadMax: 48,
    medidas: [
      { medida: '340/85R24 TL', li: 125, velocidad: 'A8', cargaMax: 1653, profSurco: 42, camara: 'TL' },
      { medida: '600/65R28 TL', li: 147, velocidad: 'A8', cargaMax: 3087, profSurco: 51, camara: 'TL' },
      { medida: '420/90R30 TL', li: 145, velocidad: 'A8', cargaMax: 2906, profSurco: 49, camara: 'TL' },
      { medida: '480/80R30 TL', li: 145, velocidad: 'A8', cargaMax: 2906, profSurco: 49, camara: 'TL' },
      { medida: '800/65R32 TL', li: 172, velocidad: 'A8', cargaMax: 6311, profSurco: 58, camara: 'TL' },
      { medida: '710/70R38 TL', li: 166, velocidad: 'A8', cargaMax: 5312, profSurco: 58, camara: 'TL' },
      { medida: '710/70R42 TL', li: 168, velocidad: 'A8', cargaMax: 5584, profSurco: 58, camara: 'TL' },
      { medida: '520/85R46 TL', li: 158, velocidad: 'A8', cargaMax: 4245, profSurco: 52, camara: 'TL' },
      { medida: '320/90R54 TL', li: 149, velocidad: 'A8', cargaMax: 3246, profSurco: 44, camara: 'TL' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Radial 9000', codigo: 'R-1W', estructura: 'Radial',
    aplicacion: 'R-1W radial. Mejor tracción en condiciones húmedas. Tractores europeos. Vel. máx. 48 km/h.',
    velocidadMax: 48,
    medidas: [
      { medida: '540/65R24 TL', li: 140, velocidad: 'A8', cargaMax: 2506, profSurco: 44, camara: 'TL' },
      { medida: '320/90R42 TL', li: 139, velocidad: 'A8', cargaMax: 2433, profSurco: 41, camara: 'TL' },
      { medida: '320/90R46 TL', li: 148, velocidad: 'A8', cargaMax: 3155, profSurco: 43, camara: 'TL' },
      { medida: '320/90R50 TL', li: 148, velocidad: 'A8', cargaMax: 3155, profSurco: 43, camara: 'TL' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Radial All Traction FWD', codigo: 'R-1', estructura: 'Radial',
    aplicacion: 'Ruedas delanteras FWD. Diseño multi-ángulo. Vel. máx. 48 km/h.',
    velocidadMax: 48,
    medidas: [
      { medida: '16.9R24 TL', li: 134, velocidad: 'A8', cargaMax: 2125, profSurco: 39, camara: 'TL' },
      { medida: '14.9R28 TL', li: 132, velocidad: 'A8', cargaMax: 1998, profSurco: 38, camara: 'TL' },
      { medida: '18.4R28 TL', li: 140, velocidad: 'A8', cargaMax: 2506, profSurco: 40, camara: 'TL' },
      { medida: '340/85R28 TL', li: 127, velocidad: 'A8', cargaMax: 1752, profSurco: 37, camara: 'TL' },
      { medida: '380/85R28 TL', li: 133, velocidad: 'A8', cargaMax: 2061, profSurco: 38, camara: 'TL' },
      { medida: '420/85R28 TL', li: 139, velocidad: 'A8', cargaMax: 2433, profSurco: 39, camara: 'TL' },
      { medida: '380/85R30 TL', li: 135, velocidad: 'A8', cargaMax: 2179, profSurco: 38, camara: 'TL' },
      { medida: '420/90R30 TL', li: 142, velocidad: 'A8', cargaMax: 2651, profSurco: 39, camara: 'TL' },
      { medida: '380/85R34 TL', li: 137, velocidad: 'A8', cargaMax: 2306, profSurco: 38, camara: 'TL' },
      { medida: '385/85R34 TL', li: 146, velocidad: 'A8', cargaMax: 2996, profSurco: 38, camara: 'TL' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'All Traction Utility', codigo: 'R-4', estructura: 'Convencional',
    aplicacion: 'Construcción ligera: cargadoras, retroexcavadoras, tractores industriales. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '14.9-24', pr: 12, cargaMax: 2906, profSurco: 42, camara: 'TL' },
      { medida: '17.5L-24', pr: 8, cargaMax: 2651, profSurco: 39, camara: 'TL' },
      { medida: '19.5L-24', pr: 10, cargaMax: 2792, profSurco: 39, camara: 'TL' },
      { medida: '19.5L-24 TL', pr: 12, cargaMax: 2996, profSurco: 39, camara: 'TL' },
      { medida: '21L-24 TL', pr: 12, cargaMax: 3450, profSurco: 40, camara: 'TL' },
      { medida: '21L-24 TL', pr: 16, cargaMax: 4495, profSurco: 40, camara: 'TL' },
      { medida: '23.1-26', pr: 10, cargaMax: 3882, profSurco: 40, camara: 'TL' },
      { medida: '16.9-28', pr: 10, cargaMax: 2906, profSurco: 40, camara: 'TL' },
      { medida: '20.8-38', pr: 8, cargaMax: 2800, profSurco: 46, camara: 'TL' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Champion Spade Grip', codigo: 'R-2', estructura: 'Convencional',
    aplicacion: 'R-2. Suelos húmedos. Barras curvas 45° para tracción adicional. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '13.6-24', pr: 6, cargaMax: 1215, profSurco: 79, camara: 'TL/TT' },
      { medida: '24.5-32', pr: 8, cargaMax: 2775, profSurco: 79, camara: 'TL' },
      { medida: '23.1-30', pr: 8, cargaMax: 3075, profSurco: 87, camara: 'TL' },
      { medida: '23.1-30', pr: 10, cargaMax: 3380, profSurco: 87, camara: 'TL' },
      { medida: '23.1-26', pr: 8, cargaMax: 3645, profSurco: 87, camara: 'TL' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Forestry Special CR', codigo: 'LS-2', estructura: 'Convencional',
    aplicacion: 'Forestal. CRC resistente a cortes. 23° más profundo 25%. Vel. máx. 8 km/h.',
    velocidadMax: 8,
    medidas: [
      { medida: '18.4-26', pr: 10, cargaMax: 3609, profSurco: 51, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 10, cargaMax: 4540, profSurco: 53, camara: 'TL/TT' },
      { medida: '23.1-26', pr: 14, cargaMax: 5766, profSurco: 53, camara: 'TL/TT' },
      { medida: '28L-26', pr: 12, cargaMax: 5266, profSurco: 56, camara: 'TL' },
      { medida: '28L-26 TL', pr: 12, cargaMax: 5266, profSurco: 56, camara: 'TL' },
      { medida: '24.5-32', pr: 16, cargaMax: 6992, profSurco: 56, camara: 'TL' },
      { medida: '30.5-32 TL', pr: 16, cargaMax: 7446, profSurco: 56, camara: 'TL' },
      { medida: '35.5L-32 TL', pr: 20, cargaMax: 10215, profSurco: 58, camara: 'TL' },
      { medida: '18.4-34', pr: 10, cargaMax: 3900, profSurco: 51, camara: 'TL/TT' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Implemento Agrícola Flotación', codigo: 'I-1', estructura: 'Convencional',
    aplicacion: 'Implementos agrícolas. Alta flotación. Baja compactación. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '6.50-16', pr: 10, cargaMax: 775, profSurco: 7, camara: 'TL' },
      { medida: '7.50-16', pr: 8, cargaMax: 1060, profSurco: 7, camara: 'TL' },
      { medida: '7.50-18', pr: 8, cargaMax: 1215, profSurco: 7, camara: 'TL' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Farm Implement / High Flotation / Rib Implement', codigo: 'I-1', estructura: 'Convencional',
    aplicacion: 'Implementos y ejes direccionales de tractores. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '9.5L-14 TL', pr: 8, cargaMax: 1090, profSurco: 7, camara: 'TL' },
      { medida: '9.5L-15 TL', pr: 8, cargaMax: 1108, profSurco: 7, camara: 'TL' },
      { medida: '7.60-15 TL', pr: 8, cargaMax: 949, profSurco: 7, camara: 'TL' },
      { medida: '7.80-15 TL', pr: 8, cargaMax: 1121, profSurco: 7, camara: 'TL' },
      { medida: '11L-15 TL', pr: 8, cargaMax: 1121, profSurco: 7, camara: 'TL' },
      { medida: '12.5L-15 TL', pr: 8, cargaMax: 1453, profSurco: 7, camara: 'TL' },
      { medida: '12.5L-16 TL', pr: 12, cargaMax: 1752, profSurco: 7, camara: 'TL' },
      { medida: '14L-16.1 TL', pr: 14, cargaMax: 2125, profSurco: 7, camara: 'TL' },
      { medida: '16.5L-16.1 TL', pr: 14, cargaMax: 2906, profSurco: 9, camara: 'TL' },
      { medida: '10.5/60-18', pr: 10, cargaMax: 2096, profSurco: 22, camara: 'TL' },
      { medida: '5.00-15', pr: 4, cargaMax: 438, profSurco: 5, camara: 'TL' },
      { medida: '11L-15 TL', pr: 10, cargaMax: 1320, profSurco: 7, camara: 'TL' },
      { medida: '31x13.50-15 TL', pr: 12, cargaMax: 1598, camara: 'TL' },
      { medida: '7.50-16', pr: 6, cargaMax: 1230, camara: 'TL' },
      { medida: '9.00-16', pr: 10, cargaMax: 1400, camara: 'TL' },
      { medida: '11.00-16', pr: 10, cargaMax: 1497, camara: 'TL' },
      { medida: '7.50-20', pr: 6, cargaMax: 999, camara: 'TL' },
    ]
  },
  {
    marca: 'Firestone', modelo: 'Industrial Special / Acanalada Tractor', codigo: 'F-3', estructura: 'Convencional',
    aplicacion: 'Tractores servicio industrial. Suelos duros, asfalto, concreto. Vel. máx. 40 km/h.',
    velocidadMax: 40,
    medidas: [
      { medida: '11L-15 TL', pr: 10, cargaMax: 1062, profSurco: 11, camara: 'TL' },
      { medida: '11L-16 TL', pr: 10, cargaMax: 1121, profSurco: 11, camara: 'TL' },
      { medida: '11L-16 TL', pr: 12, cargaMax: 1253, profSurco: 11, camara: 'TL' },
      { medida: '6.00-16', pr: 6, cargaMax: 515, profSurco: 6, camara: 'TL' },
      { medida: '7.50-16', pr: 8, cargaMax: 660, profSurco: 6, camara: 'TL' },
      { medida: '7.50-18', pr: 6, cargaMax: 730, profSurco: 6, camara: 'TL' },
      { medida: '7.60-18', pr: 8, cargaMax: 785, profSurco: 6, camara: 'TL' },
      { medida: '7.60-20', pr: 6, cargaMax: 660, profSurco: 6, camara: 'TL' },
      { medida: '9.00-19', pr: 8, cargaMax: 860, profSurco: 6, camara: 'TL' },
      { medida: '11.00-20', pr: 8, cargaMax: 925, profSurco: 6, camara: 'TL' },
      { medida: '6.50-20', pr: 6, cargaMax: 725, profSurco: 6, camara: 'TL' },
      { medida: '7.50-20', pr: 8, cargaMax: 1029, profSurco: 7, camara: 'TL' },
    ]
  },
];

// Funciones de consulta
export function getMarcasAgricolas(): string[] {
  return [...new Set(AGRICULTURAL_TIRE_DB.map(t => t.marca))].sort();
}

export function getModelosByMarca(marca: string): AgriculturalTireModel[] {
  return AGRICULTURAL_TIRE_DB.filter(t => t.marca === marca);
}

export function getModelosByCodigo(codigo: string): AgriculturalTireModel[] {
  return AGRICULTURAL_TIRE_DB.filter(t => t.codigo === codigo);
}

export function findByMedida(medida: string): { modelo: AgriculturalTireModel; medida: AgriculturalTireMeasure }[] {
  const results: { modelo: AgriculturalTireModel; medida: AgriculturalTireMeasure }[] = [];
  const busqueda = medida.toLowerCase().replace(/\s/g, '');
  for (const modelo of AGRICULTURAL_TIRE_DB) {
    for (const m of modelo.medidas) {
      if (m.medida.toLowerCase().replace(/\s/g, '').includes(busqueda)) {
        results.push({ modelo, medida: m });
      }
    }
  }
  return results;
}

export function getDescripcionCodigo(codigo: string): string {
  const descripciones: Record<string, string> = {
    'R-1': 'Tracción Normal — suelos duros y consistentes (soja, maíz, trigo, girasol)',
    'R-1W': 'Tracción Extra — suelos húmedos e irrigados, mayor profundidad de taco que R-1',
    'R-2': 'Tracción Extra Profunda — suelos anegados, arrozales, barro profundo',
    'R-3': 'Taco Poco Profundo — uso industrial liviano, no daña el suelo',
    'R-4': 'Industrial — tractores en asfalto, construcción, caminos de superficie dura',
    'F-1': 'Dirección Normal (1 raya) — rueda delantera tractor',
    'F-2': 'Dirección 2-3 rayas — rueda delantera tractor campo y ruta',
    'F-3': 'Dirección Multirayado — implementos y servicio industrial',
    'I-1': 'Implemento Liso/Rayado — remolques y máquinas sin tracción',
    'I-3': 'Implemento Baja Tracción — alta carga, uso mixto campo/ruta',
    'HF-1': 'Alta Flotación Tracción Liviana — maquinaria forestal y cosechadoras',
    'HF-2': 'Alta Flotación — pulverizadoras y maquinaria pesada de campo',
    'HF-3': 'Alta Flotación Extra Tracción — la más popular en flotación industrial',
    'LS-1': 'Forestal Tracción Normal',
    'LS-2': 'Forestal Tracción Intermedia — corte de madera, máquinas forestales',
    'G-1': 'Microtractor/Microcultivador — pequeños tractores de jardín',
  };
  return descripciones[codigo] ?? codigo;
}
