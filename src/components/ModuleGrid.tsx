import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Modulo {
  title: string;
  desc: string;
  icon: LucideIcon;
  to: string;
}

export interface GrupoModulos {
  titulo: string;
  modulos: Modulo[];
}

function saludo(d = new Date()) {
  const h = d.getHours();
  if (h < 13) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Bienvenida({ nombre }: { nombre?: string | null }) {
  const f = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hoy = f.charAt(0).toUpperCase() + f.slice(1);
  return (
    <div className="mb-8">
      <p className="text-sm text-muted-foreground">{hoy}</p>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">
        {saludo()}{nombre ? `, ${nombre}` : ''}
      </h1>
    </div>
  );
}

export default function ModuleGrid({ grupos }: { grupos: GrupoModulos[] }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      {grupos
        .filter((g) => g.modulos.length)
        .map((g) => (
          <section key={g.titulo} aria-labelledby={`grupo-${g.titulo}`}>
            <h2 id={`grupo-${g.titulo}`} className="mb-3 text-base font-semibold text-muted-foreground">
              {g.titulo}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.modulos.map(({ title, desc, icon: Icon, to }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => navigate(to)}
                  className="group flex items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold leading-tight">{title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
