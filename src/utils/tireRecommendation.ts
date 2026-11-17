// Tire type recommendation matrix (pure function, no persistence)

export type VehicleType = 'auto' | 'suv-deportivo' | 'camioneta' | 'utilitario' | 'moto' | 'cuatriciclo';
export type Usage = 'ciudad' | 'mixto' | 'ruta' | 'offroad' | 'dual';
export type Load = 'liviana' | 'normal' | 'pesada';

export interface Recommendation {
  type: string;
  reason: string;
  alert?: string;
}

export function getRecommendation(
  vehicleType: VehicleType,
  usage: Usage,
  load: Load
): Recommendation {
  if (vehicleType === 'auto') {
    if (usage === 'ciudad') {
      return { type: 'Touring / HP', reason: 'Auto de uso urbano: priorizá confort, bajo ruido y duración kilométrica.' };
    }
    if (usage === 'ruta' || usage === 'mixto') {
      return { type: 'HP (High Performance)', reason: 'Uso mixto o ruta: mejor agarre en seco/mojado y estabilidad a alta velocidad.' };
    }
  }

  if (vehicleType === 'suv-deportivo') {
    return {
      type: 'HP / UHP',
      reason: 'SUV deportivo: cubierta de performance con flanco reforzado para el peso del vehículo.',
      alert: load === 'pesada' ? 'Verificar índice de carga reforzado (XL).' : undefined,
    };
  }

  if (vehicleType === 'camioneta') {
    if (usage === 'ciudad') {
      return {
        type: 'HT (Highway Terrain)',
        reason: 'Camioneta de uso urbano y ruta: confort, bajo ruido y duración. No apta para barro.',
        alert: load === 'pesada' ? 'Considerar versión LT reforzada por la carga.' : undefined,
      };
    }
    if (usage === 'mixto') {
      return {
        type: 'AT (All Terrain)',
        reason: 'Uso mixto ruta + caminos de tierra/ripio: balance entre confort y tracción off-road moderada.',
        alert: load === 'pesada' ? 'Verificar índice de carga LT.' : undefined,
      };
    }
    if (usage === 'offroad') {
      return {
        type: 'MT (Mud Terrain)',
        reason: 'Uso off-road intenso: máxima tracción en barro y piedra. Más ruido y menos km en asfalto.',
        alert: 'En asfalto se desgastan más rápido y aumentan el consumo. Verificar índice de carga LT.',
      };
    }
  }

  if (vehicleType === 'utilitario') {
    if (load === 'liviana' || load === 'normal') {
      return { type: 'ST / Comercial liviana', reason: 'Utilitario de reparto liviano: durabilidad y resistencia a frenadas frecuentes.' };
    }
    return {
      type: 'LT reforzada (C)',
      reason: 'Utilitario con carga pesada o pasajeros: cubierta reforzada categoría C, flancos resistentes.',
      alert: 'Obligatorio verificar índice de carga acorde a la carga máxima del vehículo.',
    };
  }

  if (vehicleType === 'moto') {
    if (usage === 'dual' || usage === 'offroad') {
      return { type: 'Dual Sport / Trail', reason: 'Moto de uso mixto asfalto + tierra: taco intermedio, compatible con ambos terrenos.' };
    }
    return { type: 'Sport-Touring', reason: 'Moto de calle/ruta: agarre en seco y mojado, duración kilométrica equilibrada.' };
  }

  if (vehicleType === 'cuatriciclo') {
    if (usage === 'offroad') return { type: 'MUD (Barro)', reason: 'Máxima tracción en barro y terrenos muy blandos. Tacos profundos y espaciados.' };
    if (usage === 'ciudad' || usage === 'ruta') return { type: 'Utilitario / Granja', reason: 'Bajo ruido, mayor duración en superficies duras. Ideal para trabajo y caminos.' };
    if (usage === 'dual' || usage === 'mixto') return { type: 'AT (All Terrain)', reason: 'Balance ideal entre tracción off-road y comportamiento en asfalto.' };
    return { type: 'AT (All Terrain)', reason: 'El tipo más versátil para uso mixto en cuatriciclo.' };
  }

  return { type: 'Estándar', reason: 'Combinación no específica. Consultar disponibilidad con el proveedor.' };
}
