import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedInput } from '@/components/ui/formatted-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Save } from 'lucide-react';
import { usePriceFlow, type PriceFlowWithTiers, type PriceFlowTier, type MarginMode } from '@/hooks/usePriceFlow';
import { formatCurrency } from '@/utils/numberFormatter';

interface Props {
  flow: PriceFlowWithTiers;
}

type DraftTier = Omit<PriceFlowTier, 'id' | 'flow_id'> & { id?: string; _isNew?: boolean };

export const PriceFlowEditor: React.FC<Props> = ({ flow }) => {
  const { updateFlow, upsertTier, deleteTier } = usePriceFlow();

  const [threshold, setThreshold] = useState(flow.freight_threshold);
  const [fixed, setFixed] = useState(flow.freight_fixed);
  const [percent, setPercent] = useState(flow.freight_percent);
  const [tiers, setTiers] = useState<DraftTier[]>(flow.tiers);

  useEffect(() => {
    setThreshold(flow.freight_threshold);
    setFixed(flow.freight_fixed);
    setPercent(flow.freight_percent);
    setTiers(flow.tiers);
  }, [flow]);

  const handleSaveFlow = () => {
    updateFlow.mutate({
      id: flow.id,
      freight_threshold: threshold,
      freight_fixed: fixed,
      freight_percent: percent,
    });
  };

  const updateTierLocal = (idx: number, patch: Partial<DraftTier>) => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers((prev) => [
      ...prev,
      {
        cost_from: last ? Number(last.cost_to ?? last.cost_from) : 0,
        cost_to: null,
        wholesale_mode: 'fixed',
        wholesale_value: 0,
        public_mode: 'fixed',
        public_value: 0,
        sort_order: (last?.sort_order ?? 0) + 1,
        _isNew: true,
      },
    ]);
  };

  const removeTier = (idx: number) => {
    const t = tiers[idx];
    if (t.id) deleteTier.mutate(t.id);
    setTiers((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveTier = (idx: number) => {
    const t = tiers[idx];
    upsertTier.mutate({
      ...(t.id ? { id: t.id } : {}),
      flow_id: flow.id,
      cost_from: t.cost_from,
      cost_to: t.cost_to,
      wholesale_mode: t.wholesale_mode,
      wholesale_value: t.wholesale_value,
      public_mode: t.public_mode,
      public_value: t.public_value,
      sort_order: t.sort_order,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del flujo "{flow.name}"</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Flete</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label>Umbral (debajo: monto fijo)</Label>
              <FormattedInput value={threshold} onChange={setThreshold} formatNumbers />
            </div>
            <div>
              <Label>Monto fijo</Label>
              <FormattedInput value={fixed} onChange={setFixed} formatNumbers />
            </div>
            <div>
              <Label>Porcentaje (sobre umbral)</Label>
              <Input
                type="number"
                step="0.1"
                value={percent}
                onChange={(e) => setPercent(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button onClick={handleSaveFlow} disabled={updateFlow.isPending}>
              <Save className="h-4 w-4 mr-2" /> Guardar flete
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Tramos por costo total</h3>
            <Button size="sm" variant="outline" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" /> Agregar tramo
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta (vacío = ∞)</TableHead>
                  <TableHead>Mayorista</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Público</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((t, idx) => (
                  <TableRow key={t.id ?? `new-${idx}`}>
                    <TableCell>
                      <FormattedInput
                        value={t.cost_from}
                        onChange={(v) => updateTierLocal(idx, { cost_from: v })}
                        formatNumbers
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <FormattedInput
                        value={t.cost_to ?? 0}
                        onChange={(v) => updateTierLocal(idx, { cost_to: v === 0 ? null : v })}
                        formatNumbers
                        placeholder="∞"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <FormattedInput
                        value={t.wholesale_value}
                        onChange={(v) => updateTierLocal(idx, { wholesale_value: v })}
                        formatNumbers={t.wholesale_mode === 'fixed'}
                        type={t.wholesale_mode === 'percent' ? 'number' : undefined}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={t.wholesale_mode}
                        onValueChange={(v: MarginMode) => updateTierLocal(idx, { wholesale_mode: v })}
                      >
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">$</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <FormattedInput
                        value={t.public_value}
                        onChange={(v) => updateTierLocal(idx, { public_value: v })}
                        formatNumbers={t.public_mode === 'fixed'}
                        type={t.public_mode === 'percent' ? 'number' : undefined}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={t.public_mode}
                        onValueChange={(v: MarginMode) => updateTierLocal(idx, { public_mode: v })}
                      >
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">$</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => saveTier(idx)} disabled={upsertTier.isPending}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeTier(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tip: guardá cada tramo después de editarlo. Costo total = costo + flete (referencia: umbral {formatCurrency(threshold)}).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
