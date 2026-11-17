import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Producto, PrecioCompetencia, usePriceCompetition } from '@/hooks/usePriceCompetition';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/numberFormatter';

interface Props {
  producto: Producto;
  open: boolean;
  onClose: () => void;
}

export const PriceHistoryChart = ({ producto, open, onClose }: Props) => {
  const { getPriceHistory } = usePriceCompetition();
  const [data, setData] = useState<{ date: string; min: number }[]>([]);

  useEffect(() => {
    if (!open) return;
    getPriceHistory(producto.id, 30).then((rows: PrecioCompetencia[]) => {
      // group by date, take min precio per day
      const byDay: Record<string, number> = {};
      rows.forEach(r => {
        const d = new Date(r.fecha_relevamiento).toISOString().slice(0, 10);
        const price = Number(r.precio);
        if (byDay[d] === undefined || price < byDay[d]) byDay[d] = price;
      });
      setData(Object.entries(byDay).map(([date, min]) => ({ date, min })).sort((a, b) => a.date.localeCompare(b.date)));
    });
  }, [open, producto.id, getPriceHistory]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{producto.marca} {producto.modelo} — {producto.medida}</DialogTitle>
        </DialogHeader>
        <div className="h-72">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos en los últimos 30 días</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => formatCurrency(Number(v))} width={100} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="min" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
