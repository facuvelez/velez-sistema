import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestOperator } from '@/contexts/GuestOperatorContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wrench, Settings, Ruler, ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type View = 'selection' | 'login';
type LoginRole = 'Administrator' | 'Alineador';

// Fuera del componente para que no se vuelva a montar en cada tecla.
function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(420px,5fr)_7fr]">
      <aside className="relative flex flex-col items-center justify-center bg-chrome px-6 pb-10 pt-8 text-chrome-foreground lg:pb-0 lg:pt-0">
        <img src="/logo-velez.png" alt="Vélez Neumáticos, distribuidor oficial Dunlop" className="w-56 max-w-full sm:w-72 lg:w-96" />
        <p className="mt-2 text-sm text-chrome-foreground/60 lg:mt-4">Sistema interno</p>
        <div className="tread-strip absolute inset-x-0 bottom-0" aria-hidden="true" />
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  const [view, setView] = useState<View>('selection');
  const [loginRole, setLoginRole] = useState<LoginRole>('Administrator');
  const [showOperators, setShowOperators] = useState(false);
  const [operators, setOperators] = useState<{ username: string }[]>([]);
  const [loadingOps, setLoadingOps] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, user, profile, loading } = useAuth();
  const { guestOperator, setGuestOperator } = useGuestOperator();
  const navigate = useNavigate();

  // Redirects
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user && profile) {
    if (profile.role === 'Operator') return <Navigate to="/operator" replace />;
    if (profile.role === 'Alineador') return <Navigate to="/alineador" replace />;
    return <Navigate to="/" replace />;
  }

  if (guestOperator) {
    return <Navigate to="/taller" replace />;
  }

  const openOperators = async () => {
    setShowOperators(true);
    setLoadingOps(true);
    const { data, error } = await supabase.rpc('get_operators_public');
    if (error) {
      console.error('Error cargando operadores:', error);
      setOperators([]);
    } else {
      setOperators((data as { username: string }[]) ?? []);
    }
    setLoadingOps(false);
  };

  const selectOperator = (name: string) => {
    setGuestOperator(name);
    setShowOperators(false);
    navigate('/taller');
  };

  const startLogin = (role: LoginRole) => {
    setLoginRole(role);
    setUsername('');
    setPassword('');
    setError('');
    setView('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!username.trim() || !password.trim()) {
      setError('Ingresá usuario y contraseña');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signIn(username, password);
      if (error) setError(error.message || 'Usuario o contraseña incorrectos');
    } catch {
      setError('Error de conexión. Intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'login') {
    const roleLabel = loginRole === 'Administrator' ? 'Administración' : 'Alineador';
    return (
      <Marco>
        <Button type="button" variant="ghost" size="sm" className="-ml-3 mb-6" onClick={() => setView('selection')} disabled={isSubmitting}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Cambiar tipo de acceso
        </Button>
        <h1 className="font-display text-3xl font-semibold">{roleLabel}</h1>
        <p className="mt-1 text-muted-foreground">Ingresá tu usuario y contraseña.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              className="h-11"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              className="h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !username || !password}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ingresando…</>
            ) : 'Ingresar'}
          </Button>
        </form>
      </Marco>
    );
  }

  const accesos = [
    { key: 'op', icon: Wrench, titulo: 'Operarios', desc: 'Entrás eligiendo tu nombre, sin contraseña', onClick: openOperators },
    { key: 'adm', icon: Settings, titulo: 'Administración', desc: 'Con usuario y contraseña', onClick: () => startLogin('Administrator') },
    { key: 'ali', icon: Ruler, titulo: 'Alineador', desc: 'Con usuario y contraseña', onClick: () => startLogin('Alineador') },
  ];

  return (
    <>
      <Marco>
        <h1 className="font-display text-3xl font-semibold">Ingresar</h1>
        <p className="mt-1 text-muted-foreground">Elegí cómo vas a entrar.</p>
        <div className="mt-8 space-y-3">
          {accesos.map(({ key, icon: Icon, titulo, desc, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="group flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <Icon className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-lg font-semibold leading-tight">{titulo}</span>
                <span className="block text-sm text-muted-foreground">{desc}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </Marco>
      <Dialog open={showOperators} onOpenChange={setShowOperators}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Quién sos?</DialogTitle>
          </DialogHeader>
          {loadingOps ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : operators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay operadores registrados.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {operators.map((op) => (
                <Button
                  key={op.username}
                  variant="outline"
                  className="h-16 text-base"
                  onClick={() => selectOperator(op.username)}
                >
                  {op.username}
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
