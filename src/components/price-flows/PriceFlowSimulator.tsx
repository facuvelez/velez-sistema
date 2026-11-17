import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormattedInput } from '@/components/ui/formatted-input';
import { formatCurrency } from '@/utils/numberFormatter';
import { computePrices } from '@/utils/priceFlowCalculator';
import type { PriceFlowWithTiers } from '@/hooks/usePriceFlow';
import { Badge } from '@/components/ui/badge';

interface Props {
  flow: PriceFlowWithTiers | null;
}

export const PriceFlowSimulator: React.FC<Props> = ({ flow }) => {
  const [cost, setCost] = useState<number>(0);

  const result = useMemo(
    () => computePrices(cost, flow, flow?.tiers || []),
    [cost, flow]
  );

  if (!flow) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay flujo configurado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Costo de compra</label>
          <FormattedInput
            value={cost}
            onChange={setCost}
            formatNumbers
            placeholder="0"
            className="text-lg"
          />
        </div>

        {cost > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo</span>
                  <span className="font-medium">{formatCurrency(cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Flete {cost < flow.freight_threshold ? '(fijo)' : `(${flow.freight_percent}%)`}
                  </span>
                  <span className="font-medium">{formatCurrency(result.freight)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t">
                  <span className="font-semibold">Costo total</span>
                  <span className="font-bold">{formatCurrency(result.totalCost)}</span>
                </div>
                {result.tier && (
                  <div className="pt-2">
                    <Badge variant="secondary">
                      Tramo: {formatCurrency(result.tier.cost_from)} –{' '}
                      {result.tier.cost_to == null ? '∞' : formatCurrency(result.tier.cost_to)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-primary/40">
                <CardContent className="pt-6">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Mayorista</div>
                  <div className="text-3xl font-bold text-primary mt-1">
                    {formatCurrency(result.wholesalePrice)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Ganancia: {formatCurrency(result.wholesaleProfit)}
                    {result.tier && result.tier.wholesale_mode === 'percent' && ` (${result.tier.wholesale_value}%)`}
                    {result.tier && result.tier.wholesale_mode === 'fixed' && ` (+${formatCurrency(result.tier.wholesale_value)})`}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/40">
                <CardContent className="pt-6">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Público</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-500 mt-1">
                    {formatCurrency(result.publicPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Ganancia: {formatCurrency(result.publicProfit)}
                    {result.tier && result.tier.public_mode === 'percent' && ` (${result.tier.public_value}%)`}
                    {result.tier && result.tier.public_mode === 'fixed' && ` (+${formatCurrency(result.tier.public_value)})`}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
