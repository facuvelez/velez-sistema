import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { PurchaseItemInput, useSupplierPurchases } from '@/hooks/useSupplierPurchases';
import { calculateFinalUnitCost, calculateSubtotal } from '@/utils/supplierCostCalculator';
import { formatCurrency } from '@/utils/numberFormatter';

const VEHICLE_TYPES = ['Moto', 'Auto', 'Camioneta', 'Camión', 'Tractor', 'Agrícola', 'Vial', 'Industrial', 'Otro'];
const CATEGORIES = ['Neumáticos', 'Llantas', 'Repuestos tren delantero'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const emptyItem = (discount = 0, freight = 0): PurchaseItemInput => ({
  brand: '',
  category: null,
  vehicle_type: null,
  description: '',
  quantity: 1,
  list_price: 0,
  discount_percent: discount,
  freight_percent: freight,
});

export const PurchaseForm: React.FC<Props> = ({ open, onOpenChange }) => {
  const { suppliers } = useSuppliers();
  const { createPurchase } = useSupplierPurchases();
  const activeSuppliers = suppliers.filter((s) => s.is_active);

  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItemInput[]>([emptyItem()]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const supplierBrands = selectedSupplier?.brands || [];

  useEffect(() => {
    if (open) {
      setSupplierId('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setInvoiceNumber('');
      setNotes('');
      setItems([emptyItem()]);
    }
  }, [open]);

  const updateItem = (idx: number, patch: Partial<PurchaseItemInput>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };


  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const computedItems = useMemo(
    () =>
      items.map((it) => {
        const final = calculateFinalUnitCost(it.list_price, it.discount_percent, 0, it.freight_percent);
        return { ...it, final_unit_cost: final, subtotal: calculateSubtotal(final, it.quantity) };
      }),
    [items]
  );

  const total = computedItems.reduce((s, it) => s + it.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;
    await createPurchase.mutateAsync({
      supplier_id: supplierId,
      purchase_date: purchaseDate,
      invoice_number: invoiceNumber.trim() || null,
      notes: notes.trim() || null,
      items,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva compra a proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label>Proveedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proveedor..." /></SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
            <div className="sm:col-span-3">
              <Label>N° factura / remito</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Ítems de la compra</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Agregar ítem
              </Button>
            </div>

            {computedItems.map((it, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium">Ítem #{idx + 1}</span>
                  {items.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs">Marca</Label>
                    <Input
                      list={`brands-${idx}`}
                      value={it.brand || ''}
                      onChange={(e) => updateItem(idx, { brand: e.target.value })}
                      placeholder="Marca"
                    />
                    <datalist id={`brands-${idx}`}>
                      {supplierBrands.map((b) => <option key={b.id} value={b.brand} />)}
                    </datalist>
                  </div>
                  <div>
                    <Label className="text-xs">Categoría</Label>
                    <Select value={it.category || ''} onValueChange={(v) => updateItem(idx, { category: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Vehículo</Label>
                    <Select value={it.vehicle_type || ''} onValueChange={(v) => updateItem(idx, { vehicle_type: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs">Medida / descripción</Label>
                    <Input
                      value={it.description || ''}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      placeholder="110/70-17"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Precio lista</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={it.list_price}
                      onChange={(e) => updateItem(idx, { list_price: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Desc. %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={it.discount_percent}
                      onChange={(e) => updateItem(idx, { discount_percent: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Flete %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={it.freight_percent}
                      onChange={(e) => updateItem(idx, { freight_percent: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs">Costo unit. final</Label>
                    <div className="h-10 flex items-center px-3 rounded-md border bg-background font-mono text-sm font-semibold text-primary">
                      {formatCurrency(it.final_unit_cost)}
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm">
                  Subtotal: <strong className="text-primary">{formatCurrency(it.subtotal)}</strong>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t">
              <div className="text-lg">
                Total compra: <strong className="text-primary">{formatCurrency(total)}</strong>
              </div>
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!supplierId || createPurchase.isPending}>
              Registrar compra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
