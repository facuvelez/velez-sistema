import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, LineChart } from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormatter';
import { Producto } from '@/hooks/usePriceCompetition';
import { PriceHistoryChart } from './PriceHistoryChart';

interface Props {
  productos: Producto[];
  minByProducto: Record<string, number | null>;
}

export const ComparatorTable = ({ productos, minByProducto }: Props) => {
  const [marca, setMarca] = useState<string>('all');
  const [medida, setMedida] = useState<string>('');
  const [historyFor, setHistoryFor] = useState<Producto | null>(null);

  const marcas = useMemo(
    () => Array.from(new Set(productos.map(p => p.marca))).sort(),
    [productos]
  );

  const rows = useMemo(() => {
    const filtered = productos.filter(p => {
      if (marca !== 'all' && p.marca !== marca) return false;
      if (medida && !p.medida.toLowerCase().includes(medida.toLowerCase())) return false;
      return true;
    });
    return filtered
      .map(p => {
        const min = minByProducto[p.id] ?? null;
        const diff = min && min > 0 ? ((Number(p.precio_actual) - min) / min) * 100 : null;
        return { p, min, diff };
      })
      .sort((a, b) => {
        const av = a.diff ?? -Infinity;
        const bv = b.diff ?? -Infinity;
        return bv - av;
      });
  }, [productos, minByProducto, marca, medida]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Comparador de precios
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Select value={marca} onValueChange={setMarca}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {marcas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Filtrar por medida" value={medida} onChange={e => setMedida(e.target.value)} className="w-full sm:w-56" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medida</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Mi precio</TableHead>
                <TableHead className="text-right">Competidor más barato</TableHead>
                <TableHead className="text-right">Diferencia %</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sin productos</TableCell></TableRow>
              )}
              {rows.map(({ p, min, diff }) => {
                const overpriced = diff !== null && diff > 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.medida}</TableCell>
                    <TableCell>{p.marca}</TableCell>
                    <TableCell>{p.modelo}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.precio_actual))}</TableCell>
                    <TableCell className="text-right">{min !== null ? formatCurrency(min) : <span className="text-muted-foreground">Sin datos</span>}</TableCell>
                    <TableCell className="text-right">
                      {diff === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge variant={overpriced ? 'destructive' : 'default'} className={overpriced ? '' : 'bg-green-600 hover:bg-green-600'}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setHistoryFor(p)}>
                        <LineChart className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {historyFor && (
          <PriceHistoryChart producto={historyFor} open={!!historyFor} onClose={() => setHistoryFor(null)} />
        )}
      </CardContent>
    </Card>
  );
};
