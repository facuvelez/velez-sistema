/**
 * Calcula el costo final unitario de un ítem comprado a un proveedor.
 * Fórmula (descuentos en cascada):
 * precio_lista × (1 − desc1%) × (1 − desc2%) × (1 + flete%)
 */
export function calculateFinalUnitCost(
  listPrice: number,
  discountPercent1: number,
  discountPercent2: number,
  freightPercent: number
): number {
  const afterDiscount1 = listPrice * (1 - (discountPercent1 || 0) / 100);
  const afterDiscount2 = afterDiscount1 * (1 - (discountPercent2 || 0) / 100);
  const finalCost = afterDiscount2 * (1 + (freightPercent || 0) / 100);
  return Math.round(finalCost * 100) / 100;
}

export function calculateSubtotal(finalUnitCost: number, quantity: number): number {
  return Math.round(finalUnitCost * quantity * 100) / 100;
}
