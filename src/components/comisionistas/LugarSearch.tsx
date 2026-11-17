import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { buscarLugares, type Lugar } from './mapServices';

interface Props {
  placeholder?: string;
  onSelect: (l: Lugar) => void;
  autoFocus?: boolean;
}

/** Buscador de localidades/direcciones de Argentina. */
export default function LugarSearch({ placeholder = 'Localidad o dirección', onSelect, autoFocus }: Props) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<Lugar[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = async () => {
    if (texto.trim().length < 3) {
      setError('Escribí al menos 3 letras.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const r = await buscarLugares(texto);
      setResultados(r);
      if (!r.length) setError('No encontré ese lugar. Probá agregando la provincia, por ejemplo "Hernando, Córdoba".');
    } catch {
      setError('No se pudo buscar ahora. Revisá la conexión y probá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
      >
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        <Button type="submit" variant="secondary" disabled={cargando}>
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-1 hidden sm:inline">Buscar</span>
        </Button>
      </form>
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {resultados && resultados.length > 0 && (
        <ul className="divide-y rounded-md border bg-card text-sm">
          {resultados.map((l, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => {
                  onSelect(l);
                  setResultados(null);
                  setTexto('');
                }}
              >
                <span className="font-medium">{l.nombre}</span>
                <span className="block truncate text-xs text-muted-foreground">{l.detalle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
