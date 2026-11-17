import { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, CheckCircle2, Package, Link2 } from 'lucide-react';
import { usePriceCompetition, Producto } from '@/hooks/usePriceCompetition';
import { formatCurrency } from '@/utils/numberFormatter';

const AutocompleteInput = ({
  value, onChange, field, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  field: 'medida' | 'marca';
  placeholder: string;
}) => {
  const { searchPurchaseSuggestions } = usePriceCompetition();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    if (timeout.current) window.clearTimeout(timeout.current);
    if (!value) { setSuggestions([]); return; }
    timeout.current = window.setTimeout(async () => {
      const s = await searchPurchaseSuggestions(field, value);
      setSuggestions(s);
    }, 200);
  }, [value, field, searchPurchaseSuggestions]);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-auto">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
              onMouseDown={() => { onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const MatchesManager = () => {
  const {
    productos, competidores, matches,
    createProducto, deleteProducto,
    createMatch, updateMatch, deleteMatch,
  } = usePriceCompetition();

  // Producto form
  const [nuevoMedida, setNuevoMedida] = useState('');
  const [nuevoMarca, setNuevoMarca] = useState('');
  const [nuevoModelo, setNuevoModelo] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  // Match form
  const [productoId, setProductoId] = useState('');
  const [competidorId, setCompetidorId] = useState('');
  const [pubId, setPubId] = useState('');
  const [pubTitulo, setPubTitulo] = useState('');

  const productosById = useMemo(() => Object.fromEntries(productos.map(p => [p.id, p])), [productos]);
  const competidoresById = useMemo(() => Object.fromEntries(competidores.map(c => [c.id, c])), [competidores]);

  const submitProducto = async () => {
    if (!nuevoMedida || !nuevoMarca || !nuevoModelo) return;
    await createProducto({
      medida: nuevoMedida.trim(),
      marca: nuevoMarca.trim(),
      modelo: nuevoModelo.trim(),
      precio_actual: Number(nuevoPrecio) || 0,
    });
    setNuevoMedida(''); setNuevoMarca(''); setNuevoModelo(''); setNuevoPrecio('');
  };

  const submitMatch = async () => {
    if (!productoId || !competidorId || !pubId.trim()) return;
    await createMatch({
      producto_id: productoId,
      competidor_id: competidorId,
      publication_id: pubId.trim(),
      titulo_publicacion: pubTitulo.trim() || null,
      confirmado: false,
    });
    setPubId(''); setPubTitulo('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <div>
              <Label>Medida</Label>
              <AutocompleteInput value={nuevoMedida} onChange={setNuevoMedida} field="medida" placeholder="Ej: 175/70R13" />
            </div>
            <div>
              <Label>Marca</Label>
              <AutocompleteInput value={nuevoMarca} onChange={setNuevoMarca} field="marca" placeholder="Ej: Fate" />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input value={nuevoModelo} onChange={e => setNuevoModelo(e.target.value)} placeholder="Ej: Prestiva" />
            </div>
            <div>
              <Label>Precio actual</Label>
              <Input type="number" value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)} placeholder="0" />
            </div>
            <Button onClick={submitProducto}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medida</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Mi precio</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin productos</TableCell></TableRow>
              )}
              {productos.map((p: Producto) => (
                <TableRow key={p.id}>
                  <TableCell>{p.medida}</TableCell>
                  <TableCell>{p.marca}</TableCell>
                  <TableCell>{p.modelo}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(p.precio_actual))}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => deleteProducto(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Matches con publicaciones de MercadoLibre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <div>
              <Label>Producto</Label>
              <Select value={productoId} onValueChange={setProductoId}>
                <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                <SelectContent>
                  {productos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.marca} {p.modelo} — {p.medida}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Competidor</Label>
              <Select value={competidorId} onValueChange={setCompetidorId}>
                <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                <SelectContent>
                  {competidores.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Publication ID</Label>
              <Input value={pubId} onChange={e => setPubId(e.target.value)} placeholder="MLA123456789" />
            </div>
            <div>
              <Label>Título</Label>
              <Input value={pubTitulo} onChange={e => setPubTitulo(e.target.value)} placeholder="Opcional" />
            </div>
            <Button onClick={submitMatch}><Plus className="h-4 w-4 mr-1" /> Vincular</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Competidor</TableHead>
                <TableHead>Publication ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Confirmado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Sin matches</TableCell></TableRow>
              )}
              {matches.map(m => {
                const p = productosById[m.producto_id];
                const c = competidoresById[m.competidor_id];
                return (
                  <TableRow key={m.id}>
                    <TableCell>{p ? `${p.marca} ${p.modelo} — ${p.medida}` : '—'}</TableCell>
                    <TableCell>{c?.nombre || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{m.publication_id}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{m.titulo_publicacion || '—'}</TableCell>
                    <TableCell>
                      {m.confirmado ? (
                        <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Sí</Badge>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => updateMatch(m.id, { confirmado: true })}>
                          Confirmar match
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => deleteMatch(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
