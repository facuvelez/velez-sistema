import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Users } from 'lucide-react';
import { Competidor, usePriceCompetition } from '@/hooks/usePriceCompetition';

export const CompetidoresManager = () => {
  const { competidores, createCompetidor, updateCompetidor, deleteCompetidor } = usePriceCompetition();
  const [nombre, setNombre] = useState('');
  const [seller, setSeller] = useState('');

  const submit = async () => {
    if (!nombre.trim()) return;
    await createCompetidor({ nombre: nombre.trim(), seller_id_mercadolibre: seller.trim() || null, activo: true });
    setNombre(''); setSeller('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Competidores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <div>
            <Label>Nombre</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Neumáticos XYZ" />
          </div>
          <div>
            <Label>Seller ID MercadoLibre</Label>
            <Input value={seller} onChange={e => setSeller(e.target.value)} placeholder="Opcional" />
          </div>
          <Button onClick={submit}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Seller ID</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competidores.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin competidores</TableCell></TableRow>
            )}
            {competidores.map((c: Competidor) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nombre}</TableCell>
                <TableCell>{c.seller_id_mercadolibre || '—'}</TableCell>
                <TableCell>
                  <Switch checked={c.activo} onCheckedChange={(v) => updateCompetidor(c.id, { activo: v })} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => deleteCompetidor(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
