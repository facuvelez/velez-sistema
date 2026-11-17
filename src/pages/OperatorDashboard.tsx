import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Wrench } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

export default function OperatorDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (profile?.role === 'Alineador') {
    return <Navigate to="/taller" replace />;
  }

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Operador</h1>
            <p className="text-muted-foreground">Bienvenido, {profile?.username}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-12">
        <Button
          onClick={() => navigate('/taller')}
          size="lg"
          className="h-32 w-full max-w-md text-2xl gap-3 shadow-lg"
        >
          <Wrench className="h-8 w-8" />
          Ver órdenes del taller
        </Button>
      </main>
    </div>
  );
}
