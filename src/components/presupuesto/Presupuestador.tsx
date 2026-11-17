import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Download, Trash2 } from 'lucide-react';
import { PresupuestoPDF } from './PresupuestoPDF';
import { toast } from 'sonner';

interface Item {
  id: string;
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
}

const newItem = (): Item => ({
  id: Math.random().toString(36).slice(2),
  cantidad: 1,
  descripcion: '',
  precioUnitario: 0,
});

const fmtAR = (n: number) =>
  `$${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toUpperCase();

const Presupuestador: React.FC = () => {
  const [cliente, setCliente] = useState('');
  const [vehiculo, setVehiculo] = useState('');
  const [items, setItems] = useState<Item[]>([newItem()]);
  const { profile, hasRole } = useAuth();
  const esAdmin = hasRole('Administrator');
  const [incluirIVA, setIncluirIVA] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const totalConIVA = useMemo(
    () => items.reduce((acc, it) => acc + (it.cantidad || 0) * (it.precioUnitario || 0), 0),
    [items]
  );
  const totalSinIVA = totalConIVA / 1.21;
  const totalMostrado = incluirIVA ? totalSinIVA : totalConIVA;

  const itemsValidos = items.filter(
    (it) => it.descripcion.trim() && it.precioUnitario > 0 && it.cantidad > 0
  );
  const puedeDescargar = itemsValidos.length > 0;

  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length === 1 ? [newItem()] : prev.filter((it) => it.id !== id)));

  const handleDescargarImagen = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const now = new Date();
    const fechaArchivo = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const clientePart = sanitizeFileName(cliente) || 'CLIENTE';
    const vehiculoPart = sanitizeFileName(vehiculo) || 'VEHICULO';
    const fileName = `Presupuesto_${clientePart}_${vehiculoPart}_${fechaArchivo}.jpg`;
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();

    const { data: { session } } = await supabase.auth.getSession();
    const authUserId = session?.user?.id ?? null;

    console.log('[Presupuestador] Insertando en presupuestos_log...', {
      cliente,
      vehiculo,
      authUserId,
      profileUserId: profile?.user_id,
      username: profile?.username,
    });

    const { data: insertData, error: insertError } = await supabase
      .from('presupuestos_log')
      .insert({
        cliente: cliente.trim() || 'Sin nombre',
        vehiculo: vehiculo.trim() || null,
        generado_por: authUserId,
        generado_por_username: profile?.username ?? null,
      })
      .select();

    if (insertError) {
      console.error('[Presupuestador] Error insertando log:', insertError);
      toast.error(`Error al registrar presupuesto: ${insertError.message}`);
    } else {
      console.log('[Presupuestador] Log insertado OK:', insertData);
    }
  };

  const handleLimpiar = () => {
    setCliente('');
    setVehiculo('');
    setItems([newItem()]);
    setIncluirIVA(false);
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cliente">Nombre del cliente</Label>
            <Input
              id="cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <Label htmlFor="vehiculo">Vehículo</Label>
            <Input
              id="vehiculo"
              placeholder="Ej: Chevrolet Corsa 2010"
              value={vehiculo}
              onChange={(e) => setVehiculo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ítems</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setItems((p) => [...p, newItem()])}>
            <Plus className="h-4 w-4 mr-1" /> Agregar ítem
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-24">Cantidad</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-left p-2 w-36">Precio Unit.</th>
                  <th className="text-right p-2 w-36">Precio Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="p-2">
                      <Input
                        type="number"
                        min={1}
                        value={it.cantidad === 0 ? '' : it.cantidad}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateItem(it.id, { cantidad: val === '' ? 1 : parseInt(val) || 1 });
                        }}
                        className="h-8 text-sm text-center"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={it.descripcion}
                        onChange={(e) => updateItem(it.id, { descripcion: e.target.value })}
                        placeholder="Ej: Cubierta 175/65 R14"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={0}
                        value={it.precioUnitario === 0 ? '' : it.precioUnitario}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateItem(it.id, {
                            precioUnitario: val === '' ? 0 : parseFloat(val) || 0,
                          });
                        }}
                        className="h-8 text-sm text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-medium">
                      {fmtAR((it.cantidad || 0) * (it.precioUnitario || 0))}
                    </td>
                    <td className="p-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(it.id)}
                        aria-label="Eliminar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>{incluirIVA ? 'TOTAL (sin IVA):' : 'TOTAL:'}</span>
                <span>{fmtAR(totalMostrado)}</span>
              </div>
              {esAdmin && (
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={incluirIVA}
                      onCheckedChange={(v) => setIncluirIVA(Boolean(v))}
                    />
                    Mostrar precio sin IVA
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleDescargarImagen} disabled={!puedeDescargar}>
          <Download className="h-4 w-4 mr-2" /> Descargar presupuesto
        </Button>
        <Button onClick={handleLimpiar} variant="outline">
          <Trash2 className="h-4 w-4 mr-2" /> Limpiar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <PresupuestoPDF
              ref={pdfRef}
              cliente={cliente}
              vehiculo={vehiculo}
              items={items.map(({ cantidad, descripcion, precioUnitario }) => ({
                cantidad,
                descripcion,
                precioUnitario,
              }))}
              incluirIVA={incluirIVA}
              totalConIVA={totalConIVA}
              totalSinIVA={totalSinIVA}
              fecha={fecha}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Presupuestador;
