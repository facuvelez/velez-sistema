import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Pencil, Check } from 'lucide-react';
import { SupplierBrand, useSuppliers } from '@/hooks/useSuppliers';
import { SUPPLIER_CATEGORIES as CATEGORIES } from '@/lib/supplierCategories';
import {
  SUBCATEGORIAS_NEUMATICOS,
  ORIGENES,
  CONSTRUCCIONES,
  esNeumaticos,
} from '@/lib/tireAttributes';


export interface SupplierBrandsManagerHandle {
  commitPendingBrand: () => Promise<void>;
}

interface Props {
  supplierId: string;
  brands: SupplierBrand[];
  existingBrandNames: string[];
}

export const SupplierBrandsManager = forwardRef<SupplierBrandsManagerHandle, Props>(
  ({ supplierId, brands, existingBrandNames }, ref) => {
    const { addBrand, updateBrand, deleteBrand } = useSuppliers();
    const [pendingBrands, setPendingBrands] = useState<string[]>([]);
    const [brandInput, setBrandInput] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [subcategoria, setSubcategoria] = useState('');
    const [origen, setOrigen] = useState('');
    const [construccion, setConstruccion] = useState('');

    const [notes, setNotes] = useState('');

    useImperativeHandle(ref, () => ({
      commitPendingBrand: async () => {
        if (pendingBrands.length > 0) {
          await handleAdd();
        }
      },
    }));

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSubcategoria, setEditSubcategoria] = useState('');
  const [editOrigen, setEditOrigen] = useState('');
  const [editConstruccion, setEditConstruccion] = useState('');

  const [editNotes, setEditNotes] = useState('');

  const groupedBrands = useMemo(() => {
    const map = new Map<string, { displayName: string; rows: SupplierBrand[] }>();
    brands.forEach((b) => {
      const key = b.brand.trim().toUpperCase();
      const existing = map.get(key);
      if (existing) {
        existing.rows.push(b);
      } else {
        map.set(key, { displayName: b.brand.trim(), rows: [b] });
      }
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, ...value }));
  }, [brands]);

  const confirmBrand = () => {
    const name = brandInput.trim();
    if (!name) return;
    if (pendingBrands.includes(name)) {
      setBrandInput('');
      return;
    }
    setPendingBrands([...pendingBrands, name]);
    setBrandInput('');
  };

  const removePendingBrand = (name: string) => {
    setPendingBrands(pendingBrands.filter((b) => b !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      confirmBrand();
    }
  };

  const handleAdd = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (pendingBrands.length === 0) return;
    const combos = pendingBrands.flatMap((name) =>
      categories.length > 0
        ? categories.map((c) => ({ brand: name, category: c as string | null }))
        : [{ brand: name, category: null as string | null }]
    );
    await Promise.all(
      combos.map((combo) =>
        addBrand.mutateAsync({
          supplier_id: supplierId,
          brand: combo.brand,
          category: combo.category,
          subcategoria: esNeumaticos(combo.category) && subcategoria ? subcategoria : null,
          origen: esNeumaticos(combo.category) && origen ? origen : null,
          construccion: esNeumaticos(combo.category) && construccion ? construccion : null,
          notes: notes.trim() || null,
        })
      )
    );
    setPendingBrands([]);
    setBrandInput('');
    setCategories([]);
    setSubcategoria('');
    setOrigen('');
    setConstruccion('');
    setNotes('');
  };

  const startEdit = (b: SupplierBrand) => {
    setEditingId(b.id);
    setEditBrand(b.brand);
    setEditCategory(b.category || '');
    setEditSubcategoria(b.subcategoria || '');
    setEditOrigen(b.origen || '');
    setEditConstruccion(b.construccion || '');
    setEditNotes(b.notes || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!editingId || !editBrand.trim()) return;
    await updateBrand.mutateAsync({
      id: editingId,
      brand: editBrand.trim(),
      category: editCategory || null,
      subcategoria: esNeumaticos(editCategory) && editSubcategoria ? editSubcategoria : null,
      origen: esNeumaticos(editCategory) && editOrigen ? editOrigen : null,
      construccion: esNeumaticos(editCategory) && editConstruccion ? editConstruccion : null,
      notes: editNotes.trim() || null,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Marcas y vehículos que trabaja</Label>
        {brands.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay marcas cargadas.</p>
        ) : (
          <div className="space-y-2">
            {groupedBrands.map((group) => {
              const editingRow = editingId ? group.rows.find((b) => b.id === editingId) : null;
              if (editingRow) {
                return (
                  <div key={editingRow.id} className="p-3 rounded-lg border bg-card space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Marca *</Label>
                        <Input value={editBrand} onChange={(e) => setEditBrand(e.target.value.toUpperCase())} />
                      </div>
                      <div>
                        <Label className="text-xs">Categoría</Label>
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {esNeumaticos(editCategory) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Subcategoría (opcional)</Label>
                          <select
                            value={editSubcategoria}
                            onChange={(e) => setEditSubcategoria(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="">Sin elegir</option>
                            {SUBCATEGORIAS_NEUMATICOS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Origen (opcional)</Label>
                          <select
                            value={editOrigen}
                            onChange={(e) => setEditOrigen(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="">Sin elegir</option>
                            {ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Construcción (opcional)</Label>
                          <select
                            value={editConstruccion}
                            onChange={(e) => setEditConstruccion(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="">Sin elegir</option>
                            {CONSTRUCCIONES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs">Notas (opcional)</Label>
                      <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" onClick={saveEdit} disabled={!editBrand.trim()}>
                        <Check className="h-4 w-4 mr-1" /> Guardar
                      </Button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={group.key} className="flex flex-wrap items-center justify-between p-3 rounded-lg border bg-card gap-2">
                  <span className="font-medium shrink-0">{group.displayName.toUpperCase()}</span>
                  <div className="flex flex-wrap gap-2">
                    {group.rows.map((b) => (
                      <Badge key={b.id} variant="secondary" className="inline-flex items-center gap-1 pl-2 pr-1">
                        {[b.category || 'Sin categoría', b.subcategoria, b.origen, b.construccion]
                          .filter(Boolean)
                          .join(' · ')}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEdit(b);
                          }}
                          className="rounded-full hover:bg-muted p-0.5"
                          title="Editar"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteBrand.mutate(b.id);
                          }}
                          className="rounded-full hover:bg-muted p-0.5"
                          title="Borrar"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <Label className="text-sm font-semibold">Agregar marca</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Marca *</Label>
            <div className="flex gap-2">
              <Input
                list={`brands-list-${supplierId}`}
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="Ej: DUNLOP"
              />
              <datalist id={`brands-list-${supplierId}`}>
                {Array.from(new Set(existingBrandNames)).map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  confirmBrand();
                }}
                disabled={!brandInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {pendingBrands.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {pendingBrands.map((name) => (
                  <Badge key={name} variant="secondary" className="flex items-center gap-1">
                    {name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removePendingBrand(name);
                      }}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs">Categorías (opcional, podés elegir varias)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map((c) => {
                const selected = categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCategories((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                      );
                    }}
                  >
                    <Badge variant={selected ? 'default' : 'outline'} className="cursor-pointer">
                      {c}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {categories.some((c) => esNeumaticos(c)) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Subcategoría (opcional)</Label>
              <select
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Sin elegir</option>
                {SUBCATEGORIAS_NEUMATICOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Origen (opcional)</Label>
              <select
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Sin elegir</option>
                {ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Construcción (opcional)</Label>
              <select
                value={construccion}
                onChange={(e) => setConstruccion(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Sin elegir</option>
                {CONSTRUCCIONES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
        <div>
          <Label className="text-xs">Notas (opcional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: solo medidas chicas" />
        </div>
        <Button type="button" onClick={handleAdd} disabled={pendingBrands.length === 0} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Agregar marca(s)
        </Button>
      </div>
    </div>
  );
});
SupplierBrandsManager.displayName = 'SupplierBrandsManager';
