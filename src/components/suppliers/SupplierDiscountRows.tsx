import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import {
  useSupplierCategoryDiscounts,
  CATEGORIAS_DESCUENTO_BASE,
  SupplierCategoryDiscount,
} from '@/hooks/useSupplierCategoryDiscounts';
import {
  CATEGORIA_TODOS_LOS_ARTICULOS as WILDCARD,
  clasificarCategoria,
} from '@/lib/supplierCategories';
import {
  SUBCATEGORIAS_NEUMATICOS,
  ORIGENES,
  CONSTRUCCIONES,
  esNeumaticos,
} from '@/lib/tireAttributes';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface Row {
  key: string;
  id?: string;
  category: string;
  brand: string;
  subcategoria: string;
  origen: string;
  construccion: string;
  d1: string;
  s1: 'discount' | 'surcharge';
  d2: string;
  s2: 'discount' | 'surcharge';
  d3: string;
  s3: 'discount' | 'surcharge';
  d4: string;
  s4: 'discount' | 'surcharge';
  d5: string;
  s5: 'discount' | 'surcharge';
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const TIPOS_PUROS = CATEGORIAS_DESCUENTO_BASE.filter((c) => c !== WILDCARD);
const TIPOS = [...TIPOS_PUROS, WILDCARD];

const CategoryCombobox: React.FC<{
  value: string;
  suggestions: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  allowFreeText?: boolean;
}> = ({ value, suggestions, onSelect, placeholder, allowFreeText }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const matches = useMemo(
    () => suggestions.filter((c) => normalize(c).includes(normalize(search))),
    [suggestions, search]
  );

  const exactMatch = useMemo(
    () => matches.some((c) => normalize(c) === normalize(search)),
    [matches, search]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 flex-1 min-w-[150px] justify-between px-3 text-sm font-normal"
        >
          <span className="truncate">{value || placeholder || 'Subcategoría'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar subcategoría..."
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <CommandList className="max-h-60">
            <CommandEmpty>No se encontraron subcategorías.</CommandEmpty>
            {matches.map((c) => (
              <CommandItem
                key={c}
                value={normalize(c)}
                onSelect={() => {
                  onSelect(c);
                  setSearch('');
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${value === c ? 'opacity-100' : 'opacity-0'}`}
                />
                {c}
              </CommandItem>
            ))}
            {allowFreeText && search.trim() && !exactMatch && (
              <CommandItem
                key="__free__"
                value={normalize(search)}
                onSelect={() => {
                  onSelect(search.trim());
                  setSearch('');
                  setOpen(false);
                }}
              >
                <span className="text-muted-foreground">Usar '{search.trim()}'</span>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const toRow = (d: SupplierCategoryDiscount): Row => {
  const signOf = (v: number | null) =>
    v != null && v < 0 ? 'surcharge' : 'discount';
  const mag = (v: number | null) =>
    v == null ? '' : String(Math.abs(v));

  return {
    key: d.id,
    id: d.id,
    category: d.category,
    brand: d.brand || '',
    subcategoria: d.subcategoria || '',
    origen: d.origen || '',
    construccion: d.construccion || '',
    d1: mag(d.discount_percent_1),
    s1: signOf(d.discount_percent_1),
    d2: mag(d.discount_percent_2),
    s2: signOf(d.discount_percent_2),
    d3: mag(d.discount_percent_3),
    s3: signOf(d.discount_percent_3),
    d4: mag(d.discount_percent_4),
    s4: signOf(d.discount_percent_4),
    d5: mag(d.discount_percent_5),
    s5: signOf(d.discount_percent_5),
  };
};

const signedNum = (
  value: string,
  sign: 'discount' | 'surcharge'
): number | null => {
  if (value.trim() === '') return null;
  const n = Math.abs(Number(value.replace(',', '.')) || 0);
  return sign === 'surcharge' ? -n : n;
};

const TIERS: { field: keyof Row; signField: keyof Row; label: string }[] = [
  { field: 'd1', signField: 's1', label: 'Desc. 1' },
  { field: 'd2', signField: 's2', label: 'Desc. 2' },
  { field: 'd3', signField: 's3', label: 'Desc. 3' },
  { field: 'd4', signField: 's4', label: 'Desc. 4' },
  { field: 'd5', signField: 's5', label: 'Desc. 5' },
];

const isSameAsSaved = (row: Row, original: SupplierCategoryDiscount | undefined | null) => {
  if (!original) return false;
  const v1 = signedNum(row.d1, row.s1) ?? 0;
  const v2 = signedNum(row.d2, row.s2);
  const v3 = signedNum(row.d3, row.s3);
  const v4 = signedNum(row.d4, row.s4);
  const v5 = signedNum(row.d5, row.s5);
  return (
    original.category === row.category.trim() &&
    (original.brand || '') === row.brand.trim() &&
    (original.subcategoria || '') === row.subcategoria.trim() &&
    (original.origen || '') === row.origen.trim() &&
    (original.construccion || '') === row.construccion.trim() &&
    Number(original.discount_percent_1 ?? 0) === v1 &&
    (original.discount_percent_2 ?? null) === v2 &&
    (original.discount_percent_3 ?? null) === v3 &&
    (original.discount_percent_4 ?? null) === v4 &&
    (original.discount_percent_5 ?? null) === v5
  );
};

export const SupplierDiscountRows: React.FC<{ supplierId: string; brandCategories: string[] }> = ({
  supplierId,
  brandCategories,
}) => {
  const { discounts, upsertDiscount, deleteDiscount } = useSupplierCategoryDiscounts();

  const saved = useMemo(
    () => discounts.filter((d) => d.supplier_id === supplierId),
    [discounts, supplierId]
  );

  const [rows, setRows] = useState<Row[]>(saved.map(toRow));
  // Tipo elegido en el paso 1 para filas NUEVAS que todavía no tienen categoría
  // guardada (para filas con categoría ya elegida, el Tipo se deriva clasificando
  // esa categoría, así siempre refleja la realidad).
  const [pendingTipo, setPendingTipo] = useState<Record<string, string>>({});

  useEffect(() => {
    setRows((prev) => {
      const prevById = new Map(prev.filter((r) => r.id).map((r) => [r.id as string, r]));
      const merged = saved.map((d) => {
        const existing = prevById.get(d.id);
        // No pisar filas con cambios sin guardar
        if (existing && !isSameAsSaved(existing, d)) return existing;
        return toRow(d);
      });
      // Una fila "nueva" (sin id) deja de mostrarse en cuanto su categoría+marca+segmento
      // ya fue persistida y aparece en `saved` — si no, queda duplicada al lado
      // de la fila recién sincronizada que viene de `merged`.
      const savedKeySet = new Set(
        saved.map((d) => `${normalize(d.category)}|${normalize(d.brand || '')}|${normalize(d.subcategoria || '')}`)
      );
      const nuevos = prev.filter(
        (r) => !r.id && !savedKeySet.has(`${normalize(r.category)}|${normalize(r.brand)}|${normalize(r.subcategoria)}`)
      );
      return [...merged, ...nuevos];
    });
  }, [saved]);

  const categoriasSugeridas = useMemo(() => {
    const set = new Set([
      ...CATEGORIAS_DESCUENTO_BASE,
      ...brandCategories,
      ...saved.map((d) => d.category), // conservar categorías ya guardadas de este proveedor aunque no coincidan con ninguna marca actual, para no esconder filas viejas
    ]);
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));
  }, [brandCategories, saved]);


  // Agrupa las categorías sugeridas por Tipo puro, para el selector en 2 pasos.
  const categoriasPorTipo = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const t of TIPOS_PUROS) map[t] = [];
    for (const c of categoriasSugeridas) {
      const t = clasificarCategoria(c);
      if (t === WILDCARD) continue;
      if (!map[t]) map[t] = [];
      if (!map[t].includes(c)) map[t].push(c);
    }
    for (const t of TIPOS_PUROS) map[t].sort((a, b) => a.localeCompare(b, 'es'));
    return map;
  }, [categoriasSugeridas]);

  const patch = (key: string, p: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...p } : r)));

  const activeTipo = (row: Row): string | null => {
    if (row.category.trim()) return clasificarCategoria(row.category);
    return pendingTipo[row.key] || null;
  };

  const selectTipo = (row: Row, tipo: string) => {
    if (tipo === WILDCARD) {
      patch(row.key, { category: WILDCARD });
      setPendingTipo((prev) => {
        const next = { ...prev };
        delete next[row.key];
        return next;
      });
      return;
    }
    setPendingTipo((prev) => ({ ...prev, [row.key]: tipo }));
    // Si la categoría actual ya no pertenece al Tipo recién elegido, la limpiamos
    // para forzar a elegir de nuevo una subcategoría válida de ese Tipo.
    if (row.category.trim() && clasificarCategoria(row.category) !== tipo) {
      patch(row.key, { category: '' });
    }
  };

  const isDirty = (row: Row) => {
    if (!row.id) return !!row.category.trim();
    return !isSameAsSaved(row, saved.find((d) => d.id === row.id));
  };

  const save = (row: Row) => {
    if (!row.category.trim()) return;
    const original = row.id ? saved.find((d) => d.id === row.id) : null;
    if (isSameAsSaved(row, original)) return;

    upsertDiscount.mutate({
      id: row.id,
      supplier_id: supplierId,
      category: row.category,
      brand: row.brand,
      subcategoria: esNeumaticos(row.category) ? row.subcategoria : null,
      origen: esNeumaticos(row.category) ? row.origen : null,
      construccion: esNeumaticos(row.category) ? row.construccion : null,
      discount_percent_1: signedNum(row.d1, row.s1) ?? 0,
      discount_percent_2: signedNum(row.d2, row.s2),
      discount_percent_3: signedNum(row.d3, row.s3),
      discount_percent_4: signedNum(row.d4, row.s4),
      discount_percent_5: signedNum(row.d5, row.s5),
    });
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${prev.length}`,
        category: '',
        brand: '',
        subcategoria: '',
        origen: '',
        construccion: '',
        d1: '',
        s1: 'discount',
        d2: '',
        s2: 'discount',
        d3: '',
        s3: 'discount',
        d4: '',
        s4: 'discount',
        d5: '',
        s5: 'discount',
      },
    ]);

  const removeRow = (row: Row) => {
    if (row.id) deleteDiscount.mutate(row.id);
    setRows((prev) => prev.filter((r) => r.key !== row.key));
    setPendingTipo((prev) => {
      const next = { ...prev };
      delete next[row.key];
      return next;
    });
  };

  return (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-medium text-muted-foreground">Descuentos</p>

      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">Todavía no hay descuentos cargados.</p>
      )}

      {rows.map((row) => {
        const tipo = activeTipo(row);
        return (
          <div key={row.key} className="rounded-md border p-2 space-y-2">
            <div className="flex flex-wrap items-center gap-1">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectTipo(row, t)}
                  className={`h-7 px-2.5 rounded-full text-xs border transition-colors ${
                    tipo === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tipo && tipo !== WILDCARD && (
                <CategoryCombobox
                  value={row.category}
                  suggestions={categoriasPorTipo[tipo] || []}
                  onSelect={(category) => patch(row.key, { category })}
                />
              )}
              {tipo === WILDCARD && (
                <span className="h-9 flex items-center px-3 text-sm rounded-md border bg-muted text-muted-foreground min-w-[150px]">
                  Todos los artículos
                </span>
              )}
              {!tipo && (
                <span className="h-9 flex items-center px-3 text-sm text-muted-foreground">
                  Elegí un tipo arriba ↑
                </span>
              )}
              <Input
                placeholder="Marca (opcional)"
                className="h-9 w-32"
                value={row.brand}
                onChange={(e) => patch(row.key, { brand: e.target.value })}
              />
              {esNeumaticos(row.category) && (
                <>
                  <select
                    value={row.subcategoria}
                    onChange={(e) => patch(row.key, { subcategoria: e.target.value })}
                    className="h-9 w-44 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Subcategoría (opcional)</option>
                    {SUBCATEGORIAS_NEUMATICOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={row.origen}
                    onChange={(e) => patch(row.key, { origen: e.target.value })}
                    className="h-9 w-32 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Origen</option>
                    {ORIGENES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <select
                    value={row.construccion}
                    onChange={(e) => patch(row.key, { construccion: e.target.value })}
                    className="h-9 w-32 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Construcción</option>
                    {CONSTRUCCIONES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </>
              )}
              {TIERS.map(({ field, signField, label }) => (
                <div key={field} className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder={label}
                    className="h-9 w-20 text-right"
                    value={row[field] as string}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => patch(row.key, { [field]: e.target.value } as Partial<Row>)}
                  />
                  <select
                    value={row[signField] as 'discount' | 'surcharge'}
                    onChange={(e) =>
                      patch(row.key, { [signField]: e.target.value } as Partial<Row>)
                    }
                    className="h-9 w-24 rounded-md border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="discount">Descuento</option>
                    <option value="surcharge">Recargo</option>
                  </select>
                </div>
              ))}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                title="Guardar"
                disabled={!isDirty(row) || !row.category.trim()}
                onClick={() => save(row)}
              >
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-9 w-9">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Borrar este descuento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se borra el renglón {row.category || 'sin categoría'}
                      {row.brand ? ` – ${row.brand}` : ''}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeRow(row)}>Borrar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4 mr-1" /> Agregar categoría
      </Button>
    </div>
  );
};
