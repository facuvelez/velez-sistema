export type MarginMode = 'fixed' | 'percent';

export interface PriceFlow {
  id: string;
  name: string;
  is_default: boolean;
  freight_threshold: number;
  freight_fixed: number;
  freight_percent: number;
}

export interface PriceFlowTier {
  id: string;
  flow_id: string;
  cost_from: number;
  cost_to: number | null;
  wholesale_mode: MarginMode;
  wholesale_value: number;
  public_mode: MarginMode;
  public_value: number;
  sort_order: number;
}

export interface PriceComputation {
  freight: number;
  totalCost: number;
  tier: PriceFlowTier | null;
  wholesalePrice: number;
  publicPrice: number;
  wholesaleProfit: number;
  publicProfit: number;
}

export function calcFreight(cost: number, flow: PriceFlow): number {
  if (cost <= 0) return 0;
  if (cost < flow.freight_threshold) return flow.freight_fixed;
  return Math.round(cost * (flow.freight_percent / 100));
}

export function pickTier(totalCost: number, tiers: PriceFlowTier[]): PriceFlowTier | null {
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  for (const t of sorted) {
    const from = Number(t.cost_from);
    const to = t.cost_to == null ? Infinity : Number(t.cost_to);
    if (totalCost >= from && totalCost < to) return t;
  }
  // fallback: last tier (covers exact upper bound of unbounded)
  return sorted[sorted.length - 1] ?? null;
}

export function applyMargin(total: number, mode: MarginMode, value: number): number {
  const v = Number(value);
  if (mode === 'fixed') return total + v;
  return Math.round(total * (1 + v / 100));
}

export function computePrices(
  cost: number,
  flow: PriceFlow | null | undefined,
  tiers: PriceFlowTier[]
): PriceComputation {
  if (!flow || cost <= 0) {
    return {
      freight: 0,
      totalCost: cost,
      tier: null,
      wholesalePrice: 0,
      publicPrice: 0,
      wholesaleProfit: 0,
      publicProfit: 0,
    };
  }
  const freight = calcFreight(cost, flow);
  const totalCost = cost + freight;
  const tier = pickTier(totalCost, tiers);
  if (!tier) {
    return { freight, totalCost, tier: null, wholesalePrice: 0, publicPrice: 0, wholesaleProfit: 0, publicProfit: 0 };
  }
  const wholesalePrice = applyMargin(totalCost, tier.wholesale_mode, tier.wholesale_value);
  const publicPrice = applyMargin(totalCost, tier.public_mode, tier.public_value);
  return {
    freight,
    totalCost,
    tier,
    wholesalePrice,
    publicPrice,
    wholesaleProfit: wholesalePrice - totalCost,
    publicProfit: publicPrice - totalCost,
  };
}
