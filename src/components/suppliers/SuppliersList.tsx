import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Search, Phone, Mail, ArrowLeft, ChevronRight, Tag, FileText, Calendar, MapPin } from 'lucide-react';
import { Supplier, SupplierBrand, useSuppliers } from '@/hooks/useSuppliers';
import {
  usePriceListsByBrand,
  usePriceListItems,
  isListaVencida,
  SupplierPriceList,
} from '@/hooks/useSupplierPriceLists';
import { formatCurrency } from '@/utils/numberFormatter';
import { SupplierForm } from './SupplierForm';
import { SupplierDiscountRows } from './SupplierDiscountRows';
import { SupplierCurrencySection } from './SupplierCurrencySection';
import { SupplierNotesSection } from './SupplierNotesSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

type View = 'suppliers' | 'brands' | 'lists' | 'items';
type SortMode = 'name' | 'updated';

const staleInfo = (iso: string | null | undefined) => {
  if (!iso) return { last: null as string | null, days: 0, isStale: false };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  return { last: iso, days, isStale: days >= 90 };
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const normalizeGroupLetter = (name: string): string => {
  const first = name.trim().charAt(0).toUpperCase();
  const accented: Record<string, string> = {
    Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U',
  };
  if (accented[first]) return accented[first];
  if (/[A-ZÑ]/.test(first)) return first;
  return '#';
};

const groupSuppliersByLetter = (list: Supplier[]) => {
  const groups: { letter: string; suppliers: Supplier[] }[] = [];
  for (const supplier of list) {
    const letter = normalizeGroupLetter(supplier.name);
    const last = groups[groups.length - 1];
    if (!last || last.letter !== letter) {
      groups.push({ letter, suppliers: [supplier] });
    } else {
      last.suppliers.push(supplier);
    }
  }
  return groups;
};

const getCategoryLabel = (category: string | null | undefined) =>
  !category || category.trim() === '' ? 'Sin categoría' : category.trim();

const groupBrandsByCategory = (brands: SupplierBrand[]) => {
  const map = new Map<string, SupplierBrand[]>();
  for (const brand of brands) {
    const key = getCategoryLabel(brand.category);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(brand);
  }
  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => {
    const aUncat = a === 'Sin categoría';
    const bUncat = b === 'Sin categoría';
    if (aUncat && !bUncat) return 1;
    if (!aUncat && bUncat) return -1;
    return a.localeCompare(b, 'es');
  });
  return entries.map(([category, brands]) => ({ category, brands }));
};

/** Nivel 3: listas de precios de una marca */
const BrandLists: React.FC<{ brand: SupplierBrand; onOpenList: (l: SupplierPriceList) => void }> = ({ brand, onOpenList }) => {
  const { data: lists = [], isLoading } = usePriceListsByBrand(brand.id);

  if (isLoading) return <p className="text-muted-foreground">Cargando listas...</p>;
  if (lists.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        La marca <span className="font-medium">{brand.brand}</span> <span className="text-red-600 font-semibold">todavía no tiene listas de precios cargadas</span>.
      </CardContent></Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lists.map((l) => {
        const vencida = isListaVencida(l.uploaded_at);
        return (
          <Card
            key={l.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => onOpenList(l)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="truncate">{l.name}</span>
                </CardTitle>
                {vencida && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500 flex-shrink-0">Vencida</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {l.vehicle_type && <div>{l.vehicle_type}</div>}
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Cargada el {formatDate(l.uploaded_at)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

/** Nivel 4: items de una lista */
const ListItems: React.FC<{ list: SupplierPriceList }> = ({ list }) => {
  const { data: items = [], isLoading } = usePriceListItems(list.id);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) =>
      (i.medida || '').toLowerCase().includes(s) ||
      (i.codigo || '').toLowerCase().includes(s) ||
      (i.descripcion || '').toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{list.name}</CardTitle>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por medida, código o descripción..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando ítems...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {items.length === 0 ? 'Esta lista todavía no tiene ítems cargados.' : 'Sin resultados para la búsqueda.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-2">Medida</th>
                  <th className="py-2 pr-2">Código</th>
                  <th className="py-2 pr-2">Descripción</th>
                  <th className="py-2 pr-2 text-right">Precio</th>
                  <th className="py-2 pr-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-b">
                    <td className="py-2 pr-2 font-medium">{i.medida || '—'}</td>
                    <td className="py-2 pr-2">{i.codigo || '—'}</td>
                    <td className="py-2 pr-2">{i.descripcion || '—'}</td>
                    <td className="py-2 pr-2 text-right font-semibold">{formatCurrency(i.precio)}</td>
                    <td className="py-2 pr-2 text-right">{i.stock || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BrandCard: React.FC<{ brand: SupplierBrand; onClick: () => void }> = ({ brand, onClick }) => {
  const { data: lists = [], isLoading } = usePriceListsByBrand(brand.id);
  const lastList = lists[0];
  const days = lastList
    ? Math.floor((Date.now() - new Date(lastList.uploaded_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isStale = lastList && days >= 90;

  return (
    <Card className="cursor-pointer hover:border-primary transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> {brand.brand}
          </CardTitle>
          {isStale && (
            <Badge className="bg-orange-500 text-white hover:bg-orange-500 flex-shrink-0">Sin actualizar</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {brand.vehicle_types.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {brand.vehicle_types.map((v) => (
              <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
            ))}
          </div>
        ) : 'Sin tipos de vehículo'}
        {!isLoading && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <Calendar className="h-3 w-3" />
            {lastList ? (
              <span>
                Última actualización: {formatDate(lastList.uploaded_at)}
                {isStale && (
                  <span className="text-orange-600 font-medium"> (hace {Math.round(days / 30)} meses)</span>
                )}
              </span>
            ) : (
              <span className="text-red-600 font-semibold">Todavía no tiene listas de precios cargadas</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BrandSegmentRow: React.FC<{ brand: SupplierBrand; onClick: () => void }> = ({ brand, onClick }) => {
  const { data: lists = [], isLoading } = usePriceListsByBrand(brand.id);
  const lastList = lists[0];
  const days = lastList
    ? Math.floor((Date.now() - new Date(lastList.uploaded_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isStale = lastList && days >= 90;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border bg-background hover:border-primary transition-colors p-2"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">
          {brand.subcategoria || brand.brand}
          {(brand.origen || brand.construccion) && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {[brand.origen, brand.construccion].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
        {isStale && (
          <Badge className="bg-orange-500 text-white hover:bg-orange-500 flex-shrink-0">Sin actualizar</Badge>
        )}
      </div>
      {!isLoading && (
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {lastList ? (
            <span>
              Última actualización: {formatDate(lastList.uploaded_at)}
              {isStale && (
                <span className="text-orange-600 font-medium"> (hace {Math.round(days / 30)} meses)</span>
              )}
            </span>
            ) : (
              <span className="text-red-600 font-semibold">Todavía no tiene listas de precios cargadas</span>
            )}
        </div>
      )}
    </button>
  );
};

const BrandGroupCard: React.FC<{
  displayName: string;
  brands: SupplierBrand[];
  onSelectBrand: (b: SupplierBrand) => void;
}> = ({ displayName, brands, onSelectBrand }) => {
  const [open, setOpen] = useState(false);
  return (
    <Card className="cursor-pointer hover:border-primary transition-colors">
      <CardHeader className="pb-2" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> {displayName}
          </CardTitle>
          <ChevronRight
            className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </div>
        <p className="text-xs text-muted-foreground">{brands.length} líneas</p>
      </CardHeader>
      {open && (
        <CardContent className="space-y-2">
          {brands.map((b) => (
            <BrandSegmentRow key={b.id} brand={b} onClick={() => onSelectBrand(b)} />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

const groupBrandsByDisplayName = (brands: SupplierBrand[]) => {
  const map = new Map<string, SupplierBrand[]>();
  brands.forEach((b) => {
    const key = b.display_brand || b.brand;
    const arr = map.get(key);
    if (arr) arr.push(b);
    else map.set(key, [b]);
  });
  return Array.from(map.entries()).map(([displayName, rows]) => ({ displayName, rows }));
};

export const SuppliersList: React.FC<{ onLevelChange?: (atTopLevel: boolean) => void }> = ({
  onLevelChange,
}) => {
  const { suppliers, isLoading, deleteSupplier } = useSuppliers();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const currentEditingSupplier = editing ? suppliers.find((s) => s.id === editing.id) ?? editing : null;

  const [view, setView] = useState<View>('suppliers');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<SupplierPriceList | null>(null);
  const [activeBrandCategory, setActiveBrandCategory] = useState<string | null>(null);

  React.useEffect(() => {
    onLevelChange?.(view === 'suppliers');
  }, [view, onLevelChange]);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || null;
  const selectedBrand = selectedSupplier?.brands?.find((b) => b.id === selectedBrandId) || null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q
      ? suppliers
      : suppliers.filter((s) =>
          s.name.toLowerCase().includes(q) ||
          s.brands?.some((b) => b.brand.toLowerCase().includes(q)) ||
          s.categories.some((c) => c.toLowerCase().includes(q))
        );
    if (sortMode === 'updated') {
      return [...base].sort((a, b) => {
        const av = a.lastPriceUpdate ? new Date(a.lastPriceUpdate).getTime() : -Infinity;
        const bv = b.lastPriceUpdate ? new Date(b.lastPriceUpdate).getTime() : -Infinity;
        if (av === bv) return a.name.localeCompare(b.name, 'es');
        return bv - av;
      });
    }
    return [...base].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [suppliers, search, sortMode]);

  const supplierGroups = useMemo(
    () => (sortMode === 'name' ? groupSuppliersByLetter(filtered) : []),
    [filtered, sortMode]
  );

  const brandGroups = useMemo(
    () => (selectedSupplier ? groupBrandsByCategory(selectedSupplier.brands || []) : []),
    [selectedSupplier]
  );

  useEffect(() => {
    if (view === 'brands' && brandGroups.length > 0) {
      setActiveBrandCategory(brandGroups[0].category);
    }
  }, [view, selectedSupplierId, brandGroups]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setFormOpen(true); };

  const renderSupplierCard = (s: Supplier) => {
    const { last, days, isStale } = staleInfo(s.lastPriceUpdate);
    return (
      <Card
        key={s.id}
        className={`cursor-pointer hover:border-primary transition-colors ${!s.is_active ? 'opacity-60' : ''}`}
        onClick={() => { setSelectedSupplierId(s.id); setView('brands'); }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{s.name}</CardTitle>
              <div className="flex flex-wrap gap-1 mt-2">
                {s.is_active ? (
                  <Badge variant="default">Activo</Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
                {isStale && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500">Sin actualizar</Badge>
                )}
                {s.categories.map((c) => (
                  <Badge key={c} variant="outline">{c}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminará "{s.name}" y todas sus marcas asociadas. Las compras registradas se mantendrán.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteSupplier.mutate(s.id)}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(s.phone || s.email) && (
            <div className="flex flex-col gap-1 text-muted-foreground">
              {s.phone && <span className="flex items-center gap-2"><Phone className="h-3 w-3" />{s.phone}</span>}
              {s.email && <span className="flex items-center gap-2"><Mail className="h-3 w-3" />{s.email}</span>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {last ? (
                <span className={isStale ? 'font-semibold text-orange-600' : 'font-semibold text-foreground'}>
                  Actualizado: {formatDate(last)}
                  {isStale && <span className="font-normal"> (hace {Math.round(days / 30)} meses)</span>}
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Sin listas de precios cargadas</span>
              )}
            </div>
            {s.province && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">{s.province}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };


  const goBack = () => {
    if (view === 'items') { setSelectedList(null); setView('lists'); }
    else if (view === 'lists') { setSelectedBrandId(null); setView('brands'); }
    else if (view === 'brands') { setSelectedSupplierId(null); setView('suppliers'); }
  };

  const Breadcrumb = () => (
    <div className="flex items-center gap-1 flex-wrap text-sm text-muted-foreground">
      <button
        className="hover:text-foreground"
        onClick={() => { setView('suppliers'); setSelectedSupplierId(null); setSelectedBrandId(null); setSelectedList(null); }}
      >
        Comparador de proveedores
      </button>
      {selectedSupplier && (
        <>
          <ChevronRight className="h-3 w-3" />
          <button
            className="hover:text-foreground"
            onClick={() => { setView('brands'); setSelectedBrandId(null); setSelectedList(null); }}
          >
            {selectedSupplier.name}
          </button>
        </>
      )}
      {selectedBrand && (
        <>
          <ChevronRight className="h-3 w-3" />
          <button
            className="hover:text-foreground"
            onClick={() => { setView('lists'); setSelectedList(null); }}
          >
            {selectedBrand.brand}
          </button>
        </>
      )}
      {selectedList && (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{selectedList.name}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {view !== 'suppliers' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <Breadcrumb />
          </div>

          {view === 'brands' && selectedSupplier && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-2xl truncate">{selectedSupplier.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSupplier.is_active ? (
                          <Badge variant="default">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                        {selectedSupplier.categories.map((c) => (
                          <Badge key={c} variant="outline">{c}</Badge>
                        ))}
                      </div>
                      {(selectedSupplier.phone || selectedSupplier.email) && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-sm text-muted-foreground">
                          {selectedSupplier.phone && (
                            <span className="flex items-center gap-2">
                              <Phone className="h-4 w-4" /> {selectedSupplier.phone}
                            </span>
                          )}
                          {selectedSupplier.email && (
                            <span className="flex items-center gap-2">
                              <Mail className="h-4 w-4" /> {selectedSupplier.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(selectedSupplier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará "{selectedSupplier.name}" y todas sus marcas asociadas. Las compras registradas se mantendrán.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSupplier.mutate(selectedSupplier.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Moneda</h2>
                <SupplierCurrencySection supplier={selectedSupplier} />
              </section>

              <section className="space-y-3">
                <SupplierNotesSection supplier={selectedSupplier} />
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Descuentos</h2>
                <SupplierDiscountRows
                  supplierId={selectedSupplier.id}
                  brandCategories={Array.from(
                    new Set((selectedSupplier.brands || []).map((b) => b.category).filter((c): c is string => !!c))
                  )}
                />
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Marcas</h2>
                {(selectedSupplier.brands || []).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      {selectedSupplier.name} no tiene marcas cargadas. Editá el proveedor para agregarlas.
                    </CardContent>
                  </Card>
                ) : brandGroups.length === 1 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupBrandsByDisplayName(brandGroups[0].brands).map((grp) =>
                      grp.rows.length === 1 ? (
                        <BrandCard
                          key={grp.rows[0].id}
                          brand={grp.rows[0]}
                          onClick={() => { setSelectedBrandId(grp.rows[0].id); setView('lists'); }}
                        />
                      ) : (
                        <BrandGroupCard
                          key={grp.displayName}
                          displayName={grp.displayName}
                          brands={grp.rows}
                          onSelectBrand={(b) => { setSelectedBrandId(b.id); setView('lists'); }}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <Tabs value={activeBrandCategory || brandGroups[0].category} onValueChange={setActiveBrandCategory}>
                    <TabsList className="mb-2 flex flex-wrap h-auto">
                      {brandGroups.map((g) => (
                        <TabsTrigger key={g.category} value={g.category}>
                          {g.category} ({g.brands.length})
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {brandGroups.map((g) => (
                      <TabsContent key={g.category} value={g.category}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupBrandsByDisplayName(g.brands).map((grp) =>
                            grp.rows.length === 1 ? (
                              <BrandCard
                                key={grp.rows[0].id}
                                brand={grp.rows[0]}
                                onClick={() => { setSelectedBrandId(grp.rows[0].id); setView('lists'); }}
                              />
                            ) : (
                              <BrandGroupCard
                                key={grp.displayName}
                                displayName={grp.displayName}
                                brands={grp.rows}
                                onSelectBrand={(b) => { setSelectedBrandId(b.id); setView('lists'); }}
                              />
                            )
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </section>
            </div>
          )}

          {view === 'lists' && selectedBrand && (
            <BrandLists
              brand={selectedBrand}
              onOpenList={(l) => { setSelectedList(l); setView('items'); }}
            />
          )}

          {view === 'items' && selectedList && <ListItems list={selectedList} />}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, marca o categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre (A-Z)</SelectItem>
                  <SelectItem value="updated">Última actualización</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo proveedor
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              No hay proveedores. Crea el primero con el botón "Nuevo proveedor".
            </CardContent></Card>
          ) : sortMode === 'updated' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((s) => renderSupplierCard(s))}
            </div>
          ) : (
            <div className="space-y-4">
              {supplierGroups.map(({ letter, suppliers }) => (
                <div key={letter} className="space-y-2">
                  <div className="flex items-center gap-3 pt-2 first:pt-0">
                    <span className="text-sm font-semibold text-primary">{letter}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suppliers.map((s) => renderSupplierCard(s))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SupplierForm open={formOpen} onOpenChange={setFormOpen} supplier={currentEditingSupplier} />
    </div>
  );
};
