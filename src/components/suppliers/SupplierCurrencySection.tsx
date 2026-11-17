import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Supplier, useSuppliers } from '@/hooks/useSuppliers';

const formatFecha = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SupplierCurrencySection: React.FC<{ supplier: Supplier }> = ({ supplier }) => {
  const { updateSupplier } = useSuppliers();
  const isUSD = supplier.currency === 'USD';
  const isAutomatico = supplier.exchange_rate_source === 'oficial_bna_venta';
  const [rate, setRate] = useState(
    supplier.exchange_rate != null ? String(supplier.exchange_rate) : ''
  );
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false);

  useEffect(() => {
    setRate(supplier.exchange_rate != null ? String(supplier.exchange_rate) : '');
  }, [supplier.exchange_rate]);

  const toggle = (checked: boolean) => {
    updateSupplier.mutate({
      id: supplier.id,
      currency: checked ? 'USD' : 'ARS',
      exchange_rate: checked ? supplier.exchange_rate ?? null : null,
      exchange_rate_source: checked ? supplier.exchange_rate_source || 'manual' : 'manual',
    });
  };

  const changeSource = (value: string) => {
    updateSupplier.mutate({ id: supplier.id, exchange_rate_source: value });
  };

  const handleSourceSelect = (value: string) => {
    if (isAutomatico && value === 'manual') {
      // Pasar de automático a manual apaga el cron para este proveedor:
      // confirmamos antes para que no sea un cambio accidental.
      setConfirmarDesactivar(true);
      return;
    }
    changeSource(value);
  };

  const confirmarCambioAManual = () => {
    changeSource('manual');
    setConfirmarDesactivar(false);
  };

  const saveRate = () => {
    const parsed = rate.trim() === '' ? null : Number(rate.replace(',', '.'));
    const value = parsed != null && !isNaN(parsed) && parsed > 0 ? parsed : null;
    if ((supplier.exchange_rate ?? null) === value) return;
    updateSupplier.mutate({ id: supplier.id, exchange_rate: value });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Switch checked={isUSD} onCheckedChange={toggle} />
        <Label className="cursor-pointer">Este proveedor cotiza en dólares</Label>
      </div>

      {isUSD && (
        <div className="space-y-3">
          <div className="max-w-xs">
            <Label className="text-xs text-muted-foreground">Origen de la cotización</Label>
            <Select value={supplier.exchange_rate_source || 'manual'} onValueChange={handleSourceSelect}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="oficial_bna_venta">Automático (dólar oficial, venta)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAutomatico ? (
            <div className="max-w-sm space-y-1.5 rounded-md border-2 border-emerald-500/50 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <RefreshCw className="h-4 w-4" />
                Automático — no cargar a mano
              </div>
              {supplier.exchange_rate != null ? (
                <>
                  <p className="text-lg font-semibold">${supplier.exchange_rate}</p>
                  <p className="text-xs text-muted-foreground">
                    Última actualización: {formatFecha(supplier.exchange_rate_updated_at) || 'sin datos'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Todavía no se cargó ningún valor. Se actualiza automáticamente todos los días a las 11:00.
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                Este valor se actualiza solo, una vez por día, con el dólar oficial venta. No hace falta
                (ni conviene) tocarlo a mano.
              </p>
            </div>
          ) : (
            <div className="max-w-xs">
              <Label className="text-xs text-muted-foreground">Cotización del dólar (en pesos)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="Ej: 1350"
                className="h-9"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={saveRate}
              />
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmarDesactivar} onOpenChange={setConfirmarDesactivar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Desactivar la actualización automática?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este proveedor deja de actualizar su cotización sola todos los días. A partir de ahora
              vas a tener que cargar el valor del dólar a mano cada vez que cambie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCambioAManual}>Sí, pasar a manual</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
