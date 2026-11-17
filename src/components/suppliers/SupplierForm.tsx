import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Supplier, useSuppliers } from '@/hooks/useSuppliers';
import { SupplierBrandsManager, SupplierBrandsManagerHandle } from './SupplierBrandsManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPLIER_CATEGORIES as CATEGORIES } from '@/lib/supplierCategories';

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier?: Supplier | null;
}

export const SupplierForm: React.FC<Props> = ({ open, onOpenChange, supplier }) => {
  const { suppliers, createSupplier, updateSupplier } = useSuppliers();
  const isEdit = !!supplier;
  const brandsManagerRef = useRef<SupplierBrandsManagerHandle>(null);

  const [name, setName] = useState(supplier?.name || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [province, setProvince] = useState(supplier?.province || '');
  const [notes, setNotes] = useState(supplier?.notes || '');
  const [categories, setCategories] = useState<string[]>(supplier?.categories || []);
  const [isActive, setIsActive] = useState(supplier?.is_active ?? true);

  React.useEffect(() => {
    if (open) {
      setName(supplier?.name || '');
      setPhone(supplier?.phone || '');
      setEmail(supplier?.email || '');
      setAddress(supplier?.address || '');
      setProvince(supplier?.province || '');
      setNotes(supplier?.notes || '');
      setCategories(supplier?.categories || []);
      setIsActive(supplier?.is_active ?? true);
    }
  }, [open, supplier]);

  const allBrandNames = suppliers.flatMap((s) => s.brands?.map((b) => b.brand) || []);

  const toggleCategory = (c: string) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await brandsManagerRef.current?.commitPendingBrand();
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      province: province || null,
      notes: notes.trim() || null,
      categories,
      is_active: isActive,
    };
    if (isEdit && supplier) {
      await updateSupplier.mutateAsync({ id: supplier.id, ...payload });
    } else {
      await createSupplier.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label>Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v.replace(/(^|\s)([a-záéíóúñ])/g, (_, sep, ch) => sep + ch.toUpperCase()));
                }}
                required
                placeholder="Ej: Ezequiel Gilardoni"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Provincia</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger><SelectValue placeholder="Seleccionar provincia" /></SelectTrigger>
                <SelectContent>
                  {PROVINCIAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Categorías que provee</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={categories.includes(c)} onCheckedChange={() => toggleCategory(c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Los descuentos se cargan por categoría y marca desde la tarjeta del proveedor.
          </p>


          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Proveedor activo</Label>
          </div>

        </form>

        {isEdit && supplier && (
          <div className="mt-4 pt-4 border-t">
            <SupplierBrandsManager
              ref={brandsManagerRef}
              supplierId={supplier.id}
              brands={supplier.brands || []}
              existingBrandNames={allBrandNames}
            />
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit}>{isEdit ? 'Guardar cambios' : 'Crear proveedor'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
