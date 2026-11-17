import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestOperator } from '@/contexts/GuestOperatorContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wrench, Settings, Ruler, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type View = 'selection' | 'login';
type LoginRole = 'Administrator' | 'Alineador';

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{roleLabel}</CardTitle>
            <CardDescription>Ingresá tu usuario y contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || !username || !password}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Iniciando sesión...</>
                ) : 'Iniciar Sesión'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setView('selection')} disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Velez Neumáticos</h1>
          <p className="text-muted-foreground mt-2">Seleccioná tu tipo de acceso</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={openOperators}
            className="group rounded-xl border-2 bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
          >
            <Wrench className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-bold">Operadores</h2>
            <p className="text-sm text-muted-foreground mt-1">Sin login — acceso directo al taller</p>
          </button>

          <button
            onClick={() => startLogin('Administrator')}
            className="group rounded-xl border-2 bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
          >
            <Settings className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-bold">Administración</h2>
            <p className="text-sm text-muted-foreground mt-1">Login con usuario y contraseña</p>
          </button>

          <button
            onClick={() => startLogin('Alineador')}
            className="group rounded-xl border-2 bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
          >
            <Ruler className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-bold">Alineador</h2>
            <p className="text-sm text-muted-foreground mt-1">Login con usuario y contraseña</p>
          </button>
        </div>
      </div>

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
    </div>
  );
}
